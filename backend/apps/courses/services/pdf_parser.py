import re

# PDF day letters -> weekday names
DAY_MAP = {'S': 'Sat', 'M': 'Mon', 'T': 'Tue', 'W': 'Wed', 'R': 'Thu', 'F': 'Fri', 'A': 'Fri'}

_ROW = re.compile(
    r'^(?P<course>[A-Z]{2,4}\d{3,4})\s+'
    r'(?P<sec>\d+)\s+'
    r'(?P<fac>[A-Z]+)\s+'
    r'(?P<enr>\d+)/(?P<cap>\d+)\s+'
    r'(?P<days>[SMTWRFA]{1,3})\s+'
    r'(?P<t1>\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(?P<t2>\d{1,2}:\d{2}\s*[AP]M)\s+'
    r'(?P<room>.+?)\s*$'
)
_SEMESTER = re.compile(r'Offered Courses\s*\(([^)]+)\)', re.IGNORECASE)


def extract_text(file_obj):
    """Extract text from a PDF file object (Django UploadedFile or bytes)."""
    import io
    try:
        import pdfplumber
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError('pdfplumber is required to parse PDFs (pip install pdfplumber)') from exc

    data = file_obj.read() if hasattr(file_obj, 'read') else file_obj
    parts = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            parts.append(page.extract_text() or '')
    return '\n'.join(parts)


def _to_24h(t):
    t = t.replace(' ', '')
    m = re.match(r'(\d{1,2}):(\d{2})(AM|PM)', t, re.IGNORECASE)
    if not m:
        return t
    hh, mm, ap = int(m.group(1)), m.group(2), m.group(3).upper()
    if ap == 'PM' and hh != 12:
        hh += 12
    if ap == 'AM' and hh == 12:
        hh = 0
    return f'{hh:02d}:{mm}'


def _expand_days(token):
    return [DAY_MAP.get(ch, ch) for ch in token]


def detect_semester(text):
    m = _SEMESTER.search(text)
    return m.group(1).strip() if m else None


def parse_offered_courses(text, departments=None):
    """Return {'semester', 'offerings':[...], 'errors':[...]}.

    Each offering: {course_code, section, faculty_code, capacity:{enrolled,total},
    schedule:[{day,start_time,end_time,room}]}. Multiple PDF rows for one section
    are merged; a department filter (list of code prefixes) is applied if given.
    """
    dept_set = {d.upper() for d in departments} if departments else None
    semester = detect_semester(text)
    offerings = {}
    errors = []
    last_key = None

    for i, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line:
            continue
        if line.lower().startswith('course') or 'east west university' in line.lower() \
                or 'offered courses' in line.lower():
            continue

        m = _ROW.match(line)
        if not m:
            # room name wrapped onto the next line -> append to the last slot
            if last_key and not re.match(r'^[A-Z]{2,4}\d{3,4}\b', line):
                slots = offerings[last_key]['schedule']
                if slots:
                    slots[-1]['room'] = (slots[-1]['room'] + ' ' + line).strip()
            continue

        g = m.groupdict()
        dept = re.match(r'[A-Z]+', g['course']).group()
        if dept_set and dept not in dept_set:
            last_key = None
            continue

        key = (g['course'], g['sec'])
        off = offerings.setdefault(key, {
            'course_code': g['course'], 'section': g['sec'],
            'faculty_code': g['fac'],
            'capacity': {'enrolled': int(g['enr']), 'total': int(g['cap'])},
            'schedule': [],
        })
        room = g['room'].strip()
        for day in _expand_days(g['days']):
            off['schedule'].append({
                'day': day,
                'start_time': _to_24h(g['t1']),
                'end_time': _to_24h(g['t2']),
                'room': room,
            })
        last_key = key

    return {'semester': semester, 'offerings': list(offerings.values()), 'errors': errors}
