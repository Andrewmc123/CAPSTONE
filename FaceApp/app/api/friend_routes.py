from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import Friend, User
from app.models import db
from datetime import datetime, timezone

friend_routes = Blueprint('friends', __name__)


# Get all confirmed friends
@friend_routes.route('/', methods=['GET'])
@login_required
def get_friends():
    friends_as_user = Friend.query.filter_by(user_id=current_user.id, status='friends').all()
    friends_as_friend = Friend.query.filter_by(friend_id=current_user.id, status='friends').all()

    all_friends = friends_as_user + friends_as_friend

    return {
        "friends": [friend.to_dict() for friend in all_friends]
    }


# Get pending friend requests for current user
@friend_routes.route('/pending', methods=['GET'])
@login_required
def get_pending_friends():
    pending = Friend.query.filter(
        ((Friend.friend_id == current_user.id)) &
        (Friend.status == 'pending')
    ).all()


    return {
        "pending": [pending_request.to_dict() for pending_request in pending]
    }


# Send a friend request
@friend_routes.route('/add', methods=['POST'])
@login_required
def add_friend():
    data = request.get_json()
    friend_id = data.get('friendId')

    if not friend_id:
        return { "message": "Missing friendId in request body" }, 400

    existing = Friend.query.filter(
        ((Friend.user_id == current_user.id) & (Friend.friend_id == friend_id)) |
        ((Friend.user_id == friend_id) & (Friend.friend_id == current_user.id))
    ).first()

    if existing:
        return {
            "message": "Friend request already exists or users are already friends"
        }, 400

    new_request = Friend(
        user_id=current_user.id,
        friend_id=friend_id,
        status='pending',
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    db.session.add(new_request)
    db.session.commit()

    return {
        "friend": new_request.to_dict()
    }, 201


# Accept a friend request
@friend_routes.route('/accept/<int:friend_id>', methods=['PUT'])
@login_required
def accept_friend_request(friend_id):
    friend_request = Friend.query.filter_by(
        user_id=friend_id,
        friend_id=current_user.id,
        status='pending'
    ).first()

    if not friend_request:
        return { "message": "No pending friend request found." }, 404

    friend_request.status = 'friends'
    friend_request.updated_at = datetime.now()

    db.session.commit()

    return {
        "message": "Friend request accepted.",
        "friend": friend_request.to_dict()
    }, 200


# Decline a friend request
@friend_routes.route('/decline/<int:friend_id>', methods=['DELETE'])
@login_required
def decline_friend_request(friend_id):
    friend_request = Friend.query.filter_by(
        user_id=friend_id,
        friend_id=current_user.id,
        status='pending'
    ).first()

    if not friend_request:
        return {
            "message": "No pending friend request found from that user."
        }, 404

    friend_data = friend_request.to_dict()

    db.session.delete(friend_request)
    db.session.commit()

    return {
        "message": "Friend request deleted.",
        "friend": friend_data
    }, 200


# Remove a confirmed friend
@friend_routes.route('/delete/<int:friend_id>', methods=['DELETE'])
@login_required
def delete_friend(friend_id):
    friend = Friend.query.filter(
        ((Friend.user_id == current_user.id) & (Friend.friend_id == friend_id)) |
        ((Friend.user_id == friend_id) & (Friend.friend_id == current_user.id))
    ).first()

    if not friend:
        return { "message": "Friendship not found." }, 404

    db.session.delete(friend)
    db.session.commit()

    return {
        "message": "Removed friend from your list.",
        "friend": friend.to_dict()
    }, 200


# Test route
@friend_routes.route('/test', methods=['GET'])
def test():
    print('test')
    return "test"
