from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import Friend, User, db
from datetime import datetime, timezone
from sqlalchemy import or_, and_

friend_routes = Blueprint('friends', __name__)

@friend_routes.route('/', methods=['GET'])
@login_required
def get_friends():
    friends_as_requester = Friend.query.filter_by(requester_id=current_user.id, status='accepted').all()
    friends_as_receiver = Friend.query.filter_by(receiver_id=current_user.id, status='accepted').all()

    all_friends = friends_as_requester + friends_as_receiver

    return {
        "accepted": [friend.to_dict() for friend in all_friends]
    }

@friend_routes.route('/pending', methods=['GET'])
@login_required
def get_pending_friends():
    pending = Friend.query.filter(
        and_(
            Friend.receiver_id == current_user.id,
            Friend.status == 'pending'
        )
    ).all()

    return {
        "pending": [pending_request.to_dict() for pending_request in pending]
    }

@friend_routes.route('/add', methods=['POST'])
@login_required
def add_friend():
    data = request.get_json()
    friend_id = data.get('friendId')

    if not friend_id:
        return { "message": "Missing friendId in request body" }, 400

    if int(friend_id) == current_user.id:
        return { "message": "You cannot friend yourself." }, 400

    existing = Friend.query.filter(
        or_(
            and_(Friend.requester_id == current_user.id, Friend.receiver_id == friend_id),
            and_(Friend.requester_id == friend_id, Friend.receiver_id == current_user.id)
        )
    ).first()

    if existing:
        return {
            "message": "Friend request already exists or users are already friends"
        }, 400

    new_request = Friend(
        requester_id=current_user.id,
        receiver_id=friend_id,
        status='pending',
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    db.session.add(new_request)
    db.session.commit()

    return {
        "friend": new_request.to_dict()
    }, 201

@friend_routes.route('/accept/<int:friend_id>', methods=['PUT'])
@login_required
def accept_friend_request(friend_id):
    friend_request = Friend.query.filter_by(
        requester_id=friend_id,
        receiver_id=current_user.id,
        status='pending'
    ).first()

    if not friend_request:
        return { "message": "No pending friend request found." }, 404

    friend_request.status = 'friends'
    friend_request.updated_at = datetime.now(timezone.utc)

    db.session.commit()

    return {
        "message": "Friend request accepted.",
        "friend": friend_request.to_dict()
    }, 200

@friend_routes.route('/decline/<int:friend_id>', methods=['DELETE'])
@login_required
def decline_friend_request(friend_id):
    friend_request = Friend.query.filter_by(
        requester_id=friend_id,
        receiver_id=current_user.id,
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

@friend_routes.route('/delete/<int:friend_id>', methods=['DELETE'])
@login_required
def delete_friend(friend_id):
    friendship = Friend.query.filter(
        or_(
            and_(Friend.requester_id == current_user.id, Friend.receiver_id == friend_id),
            and_(Friend.requester_id == friend_id, Friend.receiver_id == current_user.id)
        )
    ).first()

    if not friendship:
        return { "message": "Friendship not found." }, 404

    friend_data = friendship.to_dict()

    db.session.delete(friendship)
    db.session.commit()

    return {
        "message": "Removed friend from your list.",
        "friend": friend_data
    }, 200

@friend_routes.route('/test', methods=['GET'])
def test():
    return "test"
