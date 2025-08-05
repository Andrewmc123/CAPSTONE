# notification_routes.py

from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, Notification
from datetime import datetime

notification_routes = Blueprint('notifications', __name__)


# Get all notifications for the current user
@notification_routes.route('/')
@login_required
def get_notifications():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pagination = Notification.query.filter_by(recipient_id=current_user.id)\
        .order_by(Notification.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    return {
        'notifications': [n.to_dict() for n in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }

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
