from flask import Blueprint, request
from flask_login import login_required, current_user

from ..models import db
from ..models.user import PRESENCE_CHOICES

settings_routes = Blueprint('settings', __name__)

# Allowed values for the audience-style settings.
_AUDIENCE_CHOICES = {'everyone', 'followers', 'off'}
# Keys understood inside notif_prefs.
_NOTIF_KEYS = {'likes', 'comments', 'follows', 'live', 'mentions'}


def _serialize():
    """Return the current user's settings in the shared response shape."""
    return {
        'is_private': current_user.is_private,
        'allow_comments': current_user.allow_comments,
        'allow_messages': current_user.allow_messages,
        'show_activity': current_user.show_activity,
        'presence_status': current_user.presence_status or 'active',
        'presence': current_user.effective_presence(),
        'notif_prefs': current_user.resolved_notif_prefs(),
    }


@settings_routes.route('', methods=['GET'])
@settings_routes.route('/', methods=['GET'])
@login_required
def get_settings():
    """Read the current user's privacy / notification settings."""
    return _serialize()


@settings_routes.route('', methods=['PATCH'])
@settings_routes.route('/', methods=['PATCH'])
@login_required
def update_settings():
    """Partially update the current user's settings.

    Body may include any subset of the 5 keys. Unknown/invalid values are
    ignored. notif_prefs is merged over the current resolved prefs.
    """
    data = request.get_json(silent=True) or {}

    if 'is_private' in data:
        current_user.is_private = bool(data['is_private'])

    if 'show_activity' in data:
        current_user.show_activity = bool(data['show_activity'])

    if 'allow_comments' in data and data['allow_comments'] in _AUDIENCE_CHOICES:
        current_user.allow_comments = data['allow_comments']

    if 'allow_messages' in data and data['allow_messages'] in _AUDIENCE_CHOICES:
        current_user.allow_messages = data['allow_messages']

    if 'presence_status' in data and data['presence_status'] in PRESENCE_CHOICES:
        current_user.presence_status = data['presence_status']

    if 'notif_prefs' in data and isinstance(data['notif_prefs'], dict):
        merged = current_user.resolved_notif_prefs()
        for key, value in data['notif_prefs'].items():
            if key in _NOTIF_KEYS:
                merged[key] = bool(value)
        current_user.notif_prefs = merged

    db.session.commit()
    return _serialize()
