from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app.models import db, Notification, Friend, User
from datetime import datetime
from sqlalchemy import and_, or_

notification_routes = Blueprint('notifications', __name__)

@notification_routes.route('/')
@login_required
def get_user_notifications():
    try:
        # Check for pending friend requests without notifications
        pending_requests = db.session.query(Friend)\
            .filter(
                Friend.friend_id == current_user.id,
                Friend.status == 'pending'
            )\
            .outerjoin(
                Notification,
                and_(
                    Notification.sender_id == Friend.user_id,
                    Notification.recipient_id == Friend.friend_id,
                    Notification.notification_type == 'friend_request'
                )
            )\
            .filter(Notification.id.is_(None))\
            .all()

        if pending_requests:
            notifications_to_add = [
                Notification(
                    sender_id=req.user_id,
                    recipient_id=current_user.id,
                    notification_type='friend_request',
                    created_at=req.created_at
                ) for req in pending_requests
            ]
            db.session.bulk_save_objects(notifications_to_add)
            db.session.commit()

        notifications = db.session.query(Notification, User)\
            .join(User, Notification.sender_id == User.id)\
            .filter(Notification.recipient_id == current_user.id)\
            .order_by(Notification.created_at.desc())\
            .all()

        return jsonify({
            'notifications': [{
                **n.to_dict(),
                'sender': u.to_dict_basic()
            } for n, u in notifications],
            'unread_count': sum(1 for n, _ in notifications if not n.is_read)
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500