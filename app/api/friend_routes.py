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

# Add this endpoint for accepting friend requests
@friend_routes.route('/accept/<int:friend_id>', methods=['POST'])
@login_required
def accept_friend_request(friend_id):
    try:
        # Find the pending friend request
        friend_request = Friend.query.filter(
            and_(
                Friend.user_id == friend_id,
                Friend.friend_id == current_user.id,
                Friend.status == 'pending'
            )
        ).first()

        if not friend_request:
            return jsonify({"error": "Friend request not found"}), 404

        # Update the status to accepted
        friend_request.status = 'accepted'
        friend_request.updated_at = datetime.now(timezone.utc)

        # Create a notification for the acceptance
        notification = Notification(
            sender_id=current_user.id,
            recipient_id=friend_id,
            notification_type='friend_request_accepted',
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(notification)

        db.session.commit()

        # Return the updated friend request
        return jsonify(friend_request.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Add this endpoint for getting pending friend requests
@friend_routes.route('/pending')
@login_required
def get_pending_friends():
    try:
        # Get pending friend requests where current user is the recipient
        pending_requests = Friend.query.filter(
            and_(
                Friend.friend_id == current_user.id,
                Friend.status == 'pending'
            )
        ).all()

        # Get the user details for each pending request
        pending_users = []
        for request in pending_requests:
            user = User.query.get(request.user_id)
            if user:
                pending_users.append(user.to_dict())

        return jsonify({"pending": pending_users}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add this endpoint for getting all friends
@friend_routes.route('/')
@login_required
def get_friends():
    try:
        # Get all accepted friends
        friends = Friend.query.filter(
            and_(
                or_(
                    Friend.user_id == current_user.id,
                    Friend.friend_id == current_user.id
                ),
                Friend.status == 'accepted'
            )
        ).all()

        # Get the friend user details
        friend_users = []
        for friend in friends:
            if friend.user_id == current_user.id:
                user = User.query.get(friend.friend_id)
            else:
                user = User.query.get(friend.user_id)
            
            if user:
                friend_users.append(user.to_dict())

        return jsonify({"friends": friend_users}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add this endpoint for declining friend requests
@friend_routes.route('/decline/<int:friend_id>', methods=['DELETE'])
@login_required
def decline_friend_request(friend_id):
    try:
        # Find the pending friend request
        friend_request = Friend.query.filter(
            and_(
                Friend.user_id == friend_id,
                Friend.friend_id == current_user.id,
                Friend.status == 'pending'
            )
        ).first()

        if not friend_request:
            return jsonify({"error": "Friend request not found"}), 404

        # Delete the friend request
        db.session.delete(friend_request)
        db.session.commit()

        return jsonify({"message": "Friend request declined"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Add this endpoint for removing friends
@friend_routes.route('/delete/<int:friend_id>', methods=['DELETE'])
@login_required
def remove_friend(friend_id):
    try:
        # Find the friend relationship
        friend_relationship = Friend.query.filter(
            or_(
                and_(
                    Friend.user_id == current_user.id,
                    Friend.friend_id == friend_id,
                    Friend.status == 'accepted'
                ),
                and_(
                    Friend.user_id == friend_id,
                    Friend.friend_id == current_user.id,
                    Friend.status == 'accepted'
                )
            )
        ).first()

        if not friend_relationship:
            return jsonify({"error": "Friend relationship not found"}), 404

        # Delete the friend relationship
        db.session.delete(friend_relationship)
        db.session.commit()

        return jsonify({"message": "Friend removed"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500