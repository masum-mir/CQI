import datetime


def now():
    """Timezone-aware UTC timestamp for stored documents."""
    return datetime.datetime.now(datetime.timezone.utc)


def ensure_aware(dt):
    """Coerce a datetime to tz-aware UTC. Real MongoDB (tz_aware) returns aware
    datetimes; some drivers/mocks return naive ones — normalize before compare."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=datetime.timezone.utc)
    return dt
