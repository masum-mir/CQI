# """Business logic for the master list of required items (1..17)."""
# from core.utils import now
# from core.utils.response import ApiError
# from core.utils.validators import require_fields, parse_int
# from apps.fileList.repositories import item_repo
# from apps.fileList.api.serializers import item_dict
#
#
# def list_items():
#     items = [item_dict(i) for i in item_repo.find_active()]
#     return {'count': len(items), 'items': items}
#
#
# def upsert_item(data):
#     require_fields(data, ['itemNo', 'name'])
#     item_no = parse_int(data['itemNo'], name='itemNo')
#     set_fields = {
#         'name': data['name'],
#         'description': data.get('description'),
#         'category': data.get('category'),
#         'has_sub_items': bool(data.get('hasSubItems', False)),
#         'sub_items': [{'key': s['key'], 'label': s['label']} for s in data.get('subItems', [])],
#         'allowed_extensions': data.get('allowedExtensions', []),
#         'max_size_mb': data.get('maxSizeMb'),
#         'is_mandatory': data.get('isMandatory', True),
#         'active': data.get('active', True),
#         'updated_at': now(),
#     }
#     item = item_repo.upsert(item_no, set_fields, {'item_no': item_no, 'created_at': now()})
#     return {'item': item_dict(item)}
#
#
# def update_item(item_no, data):
#     item_no = parse_int(item_no, name='itemNo')
#     if not item_repo.find_by_item_no(item_no):
#         raise ApiError('Item not found', status=404)
#     updates = {}
#     for field, attr in [('name', 'name'), ('description', 'description'),
#                         ('category', 'category'), ('hasSubItems', 'has_sub_items'),
#                         ('active', 'active')]:
#         if field in data:
#             updates[attr] = data[field]
#     if 'subItems' in data:
#         updates['sub_items'] = [{'key': s['key'], 'label': s['label']} for s in data['subItems']]
#     updates['updated_at'] = now()
#     return {'item': item_dict(item_repo.update(item_no, updates))}


"""Business logic for the master list of required items (1..21)."""
from core.utils import now
from core.utils.response import ApiError
from core.utils.validators import require_fields, parse_int
from apps.fileList.repositories import item_repo
from apps.fileList.api.serializers import item_dict


def list_items():
    items = [item_dict(i) for i in item_repo.find_active()]
    return {'count': len(items), 'items': items}


def upsert_item(data):
    require_fields(data, ['itemNo', 'name'])
    item_no = parse_int(data['itemNo'], name='itemNo')
    set_fields = {
        'name': data['name'],
        'description': data.get('description'),
        'category': data.get('category'),
        'allowed_extensions': data.get('allowedExtensions', []),
        'max_size_mb': data.get('maxSizeMb'),
        'is_mandatory': data.get('isMandatory', True),
        'active': data.get('active', True),
        'updated_at': now(),
    }
    item = item_repo.upsert(item_no, set_fields, {'item_no': item_no, 'created_at': now()})
    return {'item': item_dict(item)}


def update_item(item_no, data):
    item_no = parse_int(item_no, name='itemNo')
    if not item_repo.find_by_item_no(item_no):
        raise ApiError('Item not found', status=404)
    updates = {}
    for field, attr in [('name', 'name'), ('description', 'description'),
                        ('category', 'category'), ('active', 'active')]:
        if field in data:
            updates[attr] = data[field]
    updates['updated_at'] = now()
    return {'item': item_dict(item_repo.update(item_no, updates))}