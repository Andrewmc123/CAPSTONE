from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import Friend, User, db, Notification
from datetime import datetime, timezone

friend_routes = Blueprint('friends', __name__)

@friend_routes.route('/')
@login_required
def get_friends():
    try:
        # I believe this fetches all friend relationships for the current user
        friends_as_user = Friend.query.filter_by(user_id=current_user.id, status='friends').all()
        friends_as_friend = Friend.query.filter_by(friend_id=current_user.id, status='friends').all()

        # I believe this collects all friend user IDs without duplication
        friend_ids = {f.friend_id for f in friends_as_user} | {f.user_id for f in friends_as_friend}

        # I believe this fetches all User objects in one query to avoid N+1
        users = User.query.filter(User.id.in_(friend_ids)).all()

        # I believe this returns serialized user data without triggering extra Friend queries
        return jsonify({
            "friends": [u.to_dict() for u in users]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@friend_routes.route('/pending', methods=['GET'])
@login_required
def get_pending_friends():
    try:
        # I believe this fetches pending requests where current user is the recipient
        pending_requests = Friend.query.filter(
            (Friend.friend_id == current_user.id) & (Friend.status == 'pending')
        ).all()

        # I believe this fetches all users who sent the pending requests in one query
        sender_ids = {req.user_id for req in pending_requests}
        senders = User.query.filter(User.id.in_(sender_ids)).all()
        senders_dict = {u.id: u.to_dict() for u in senders}

        return jsonify({
            "pending": [
                {**req.to_dict(), "sender": senders_dict.get(req.user_id)}
                for req in pending_requests
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@friend_routes.route('/add', methods=['POST'])
@login_required
def add_friend():
    try:
        data = request.get_json()
        friend_id = data.get('friendId')

        if not friend_id:
            return jsonify({"message": "friendId is required"}), 400

        friend_user = User.query.get(friend_id)
        if not friend_user:
            return jsonify({"message": "User not found"}), 404

        existing = Friend.query.filter(
            ((Friend.user_id == current_user.id) & (Friend.friend_id == friend_id)) |
            ((Friend.user_id == friend_id) & (Friend.friend_id == current_user.id))
        ).first()

        if existing:
            return jsonify({
                "message": "Friend request already exists or users are already friends"
            }), 400

        new_request = Friend(
            user_id=current_user.id,
            friend_id=friend_id,
            status='pending',
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.session.add(new_request)

        notification = Notification(
            sender_id=current_user.id,
            recipient_id=friend_id,
            notification_type='friend_request',
            message=f"{current_user.username} sent you a friend request",
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(notification)

        db.session.commit()

        return jsonify(new_request.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@friend_routes.route('/accept/<int:friend_id>', methods=['PUT'])
@login_required
def accept_friend_request(friend_id):
    try:
        friend_request = Friend.query.filter_by(
            user_id=friend_id,
            friend_id=current_user.id,
            status='pending'
        ).first()

        if not friend_request:
            return jsonify({"message": "No pending friend request found."}), 404

        friend_request.status = 'friends'
        friend_request.updated_at = datetime.now(timezone.utc)

        notification = Notification(
            sender_id=current_user.id,
            recipient_id=friend_id,
            notification_type='friend_request_accepted',
            message=f"{current_user.username} accepted your friend request",
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(notification)

        # I believe this deletes the original friend request notification
        Notification.query.filter_by(
            sender_id=friend_id,
            recipient_id=current_user.id,
            notification_type='friend_request'
        ).delete()

        db.session.commit()

        return jsonify({
            "message": "Friend request accepted.",
            "friend": friend_request.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@friend_routes.route('/decline/<int:friend_id>', methods=['DELETE'])
@login_required
def decline_friend_request(friend_id):
    try:
        friend_request = Friend.query.filter_by(
            user_id=friend_id,
            friend_id=current_user.id,
            status='pending'
        ).first()

        if not friend_request:
            return jsonify({"message": "No pending friend request found from that user."}), 404

        Notification.query.filter_by(
            sender_id=friend_id,
            recipient_id=current_user.id,
            notification_type='friend_request'
        ).delete()

        db.session.delete(friend_request)
        db.session.commit()

        return jsonify({
            "message": "Friend request declined.",
            "friend": friend_request.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
