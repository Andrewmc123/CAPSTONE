from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, User, Follow, Notification

follow_routes = Blueprint('follows', __name__)


@follow_routes.route('/<int:user_id>', methods=['POST'])
@login_required
def follow_user(user_id):
    """Follow a user."""
    if user_id == current_user.id:
        return {'error': "You can't follow yourself"}, 400

    target = User.query.get(user_id)
    if not target:
        return {'error': 'User not found'}, 404

    existing = Follow.query.filter_by(
        follower_id=current_user.id, followed_id=user_id).first()
    if existing:
        return {'message': 'Already following', 'following': True}, 200

    follow = Follow(follower_id=current_user.id, followed_id=user_id)
    db.session.add(follow)
    db.session.add(Notification(
        recipient_id=user_id,
        sender_id=current_user.id,
        notification_type='new_follower',
        is_read=False,
        message=f'{current_user.username} started following you',
    ))
    db.session.commit()

    return {
        'message': 'Followed',
        'following': True,
        'followers_count': len(target.followers),
        'user_id': user_id,
    }, 201


@follow_routes.route('/<int:user_id>', methods=['DELETE'])
@login_required
def unfollow_user(user_id):
    """Unfollow a user."""
    follow = Follow.query.filter_by(
        follower_id=current_user.id, followed_id=user_id).first()
    if not follow:
        return {'error': 'Not following this user'}, 404

    db.session.delete(follow)
    db.session.commit()

    target = User.query.get(user_id)
    return {
        'message': 'Unfollowed',
        'following': False,
        'followers_count': len(target.followers) if target else 0,
        'user_id': user_id,
    }, 200


@follow_routes.route('/me')
@login_required
def my_follows():
    """IDs the current user follows + who follows them (for instant UI checks)."""
    following = Follow.query.filter_by(follower_id=current_user.id).all()
    followers = Follow.query.filter_by(followed_id=current_user.id).all()
    return {
        'following_ids': [f.followed_id for f in following],
        'follower_ids': [f.follower_id for f in followers],
    }


@follow_routes.route('/<int:user_id>/followers')
@login_required
def get_followers(user_id):
    """List a user's followers — private: only YOU can see your own list."""
    if user_id != current_user.id:
        return {'error': 'You can only see your own followers'}, 403
    user = User.query.get_or_404(user_id)
    return {'followers': [f.follower.to_dict_basic() for f in user.followers]}


@follow_routes.route('/<int:user_id>/following')
@login_required
def get_following(user_id):
    """List who a user follows — private: only YOU can see your own list."""
    if user_id != current_user.id:
        return {'error': 'You can only see who you follow'}, 403
    user = User.query.get_or_404(user_id)
    return {'following': [f.followed.to_dict_basic() for f in user.following]}


@follow_routes.route('/suggestions')
def suggestions():
    """Suggested accounts: most-followed users the viewer doesn't follow yet."""
    limit = min(12, request.args.get('limit', 6, type=int))
    users = User.query.all()

    exclude = set()
    if current_user.is_authenticated:
        exclude.add(current_user.id)
        exclude.update(f.followed_id for f in Follow.query.filter_by(follower_id=current_user.id).all())

    candidates = [u for u in users if u.id not in exclude]
    candidates.sort(key=lambda u: (len(u.followers), len(u.posts)), reverse=True)

    return {'suggestions': [u.to_dict_basic() for u in candidates[:limit]]}
