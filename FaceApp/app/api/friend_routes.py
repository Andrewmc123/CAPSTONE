from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import Friend, User, db, Notification
from datetime import datetime, timezone
from sqlalchemy import or_, and_

friend_routes = Blueprint('friends', __name__)

@friend_routes.route('/add', methods=['POST'])
@login_required
def add_friend():
    try:
        data = request.get_json()
        friend_id = data.get('friendId')
        
        if not friend_id:
            return jsonify({"error": "friendId is required"}), 400

        if friend_id == current_user.id:
            return jsonify({"error": "Cannot add yourself as friend"}), 400

        friend_user = User.query.get(friend_id)
        if not friend_user:
            return jsonify({"error": "User not found"}), 404

        existing = Friend.query.filter(
            or_(
                and_(Friend.user_id == current_user.id, Friend.friend_id == friend_id),
                and_(Friend.user_id == friend_id, Friend.friend_id == current_user.id)
            )).first()

        if existing:
            return jsonify({"error": "Friend request already exists"}), 400

        new_request = Friend(
            user_id=current_user.id,
            friend_id=friend_id,
            status='pending',
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(new_request)

        notification = Notification(
            sender_id=current_user.id,
            recipient_id=friend_id,
            notification_type='friend_request',
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(notification)

        db.session.commit()
        return jsonify(new_request.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500