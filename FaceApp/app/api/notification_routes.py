# notification_routes.py

from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, Notification
from datetime import datetime

notification_routes = Blueprint('notifications', __name__)


# Get all notifications for the current user
@notification_routes.route('/', methods=['GET'])
@login_required
def get_notifications():
    """
    Gets all notifications for the current user
    """
    notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()
    return {
        "notifications": [note.to_dict() for note in notifications]
    }, 200


# Mark a notification as read
@notification_routes.route('/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_as_read(notification_id):
    """
    Marks a single notification as read
    """
    note = Notification.query.get(notification_id)

    if not note or note.user_id != current_user.id:
        return { "message": "Notification not found or not authorized." }, 404

    note.is_read = True
    note.updated_at = datetime.utcnow()
    db.session.commit()

    return note.to_dict(), 200


# Delete a notification
@notification_routes.route('/<int:notification_id>', methods=['DELETE'])
@login_required
def delete_notification(notification_id):
    """
    Deletes a notification
    """
    note = Notification.query.get(notification_id)

    if not note or note.user_id != current_user.id:
        return { "message": "Notification not found." }, 404

    db.session.delete(note)
    db.session.commit()

    return { "message": "Notification deleted." }, 200
