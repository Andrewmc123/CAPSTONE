# notification_routes.py
from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app.models import db, Notification, Friend, User
from datetime import datetime

notification_routes = Blueprint('notifications', __name__)

@notification_routes.route('/')
@login_required
def get_user_notifications():
    """Get all notifications for current user"""
    # Check for pending friend requests without notifications
    pending_requests = Friend.query.filter_by(
        friend_id=current_user.id,
        status='pending'
    ).all()

    for req in pending_requests:
        exists = Notification.query.filter_by(
            sender_id=req.user_id,
            recipient_id=current_user.id,
            notification_type='friend_request'
        ).first()
        
        if not exists:
            requesting_user = User.query.get(req.user_id)
            if requesting_user:
                notification = Notification(
                    sender_id=req.user_id,
                    recipient_id=current_user.id,
                    notification_type='friend_request',
                    message=f"{requesting_user.username} sent you a friend request",
                    created_at=req.created_at
                )
                db.session.add(notification)
    
    db.session.commit()

    notifications = Notification.query.filter_by(
        recipient_id=current_user.id
    ).order_by(
        Notification.created_at.desc()
    ).all()

    unread_count = Notification.query.filter_by(
        recipient_id=current_user.id,
        is_read=False
    ).count()

    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count
    })

@notification_routes.route('/read/all', methods=['PUT'])
@login_required
def mark_all_as_read():
    """Mark all notifications as read"""
    updated = Notification.query.filter_by(
        recipient_id=current_user.id,
        is_read=False
    ).update({'is_read': True, 'updated_at': datetime.utcnow()})
    
    db.session.commit()
    
    return jsonify({
        'message': f'Marked {updated} notifications as read',
        'unread_count': 0
    })

@notification_routes.route('/<int:notification_id>', methods=['PUT'])
@login_required
def mark_as_read(notification_id):
    """Mark single notification as read"""
    notification = Notification.query.get(notification_id)
    
    if not notification or notification.recipient_id != current_user.id:
        return jsonify({'error': 'Notification not found'}), 404
    
    notification.is_read = True
    notification.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(notification.to_dict())

@notification_routes.route('/<int:notification_id>', methods=['DELETE'])
@login_required
def delete_notification(notification_id):
    """Delete a notification"""
    notification = Notification.query.get(notification_id)
    
    if not notification or notification.recipient_id != current_user.id:
        return jsonify({'error': 'Notification not found'}), 404
    
    db.session.delete(notification)
    db.session.commit()
    
    return jsonify({'message': 'Notification deleted'})