from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, User, ProfileVisit
from datetime import datetime

user_routes = Blueprint('users', __name__)


@user_routes.route('/')
@login_required
def users():
    users = User.query.all()
    return {'users': [user.to_dict() for user in users]}


@user_routes.route('/search')
@login_required
def search_user_by_username():
    username = request.args.get('username')
    user = User.query.filter_by(username=username).first()

    if not user:
        return {"message": "User not found."}, 404

    return {"user": user.to_dict()}, 200


@user_routes.route('/<int:id>')
def user(id):
    """Public profile — like TikTok, anyone can view a creator page."""
    user = User.query.get_or_404(id)
    return user.to_dict()


@user_routes.route('/me', methods=['PUT'])
@login_required
def update_profile():
    """Update the current user's profile (bio, avatar, name, username)."""
    data = request.get_json() or {}

    username = (data.get('username') or '').strip()
    if username and username != current_user.username:
        taken = User.query.filter_by(username=username).first()
        if taken:
            return {'errors': {'username': 'Username already taken'}}, 400
        current_user.username = username

    if 'bio' in data:
        current_user.bio = (data.get('bio') or '')[:255]
    if 'profile_img' in data:
        current_user.profile_img = data.get('profile_img') or ''
    if data.get('firstname'):
        current_user.firstname = data['firstname'].strip()[:30]
    if data.get('lastname'):
        current_user.lastname = data['lastname'].strip()[:30]
    if 'city' in data:
        current_user.city = (data.get('city') or '').strip()[:80]
    if 'birthdate' in data:
        current_user.birthdate = (data.get('birthdate') or '').strip()[:10] or None
    if 'address' in data:
        current_user.address = (data.get('address') or '').strip()[:200]

    db.session.commit()
    return current_user.to_dict()


@user_routes.route('/<int:id>/visit', methods=['POST'])
@login_required
def record_visit(id):
    """Record that the current user viewed user <id>'s profile."""
    if id == current_user.id:
        return {'ok': True, 'self': True}
    if not User.query.get(id):
        return {'errors': {'message': 'User not found'}}, 404

    visit = ProfileVisit.query.filter_by(
        visitor_id=current_user.id, profile_id=id).first()
    if visit:
        visit.updated_at = datetime.utcnow()
    else:
        db.session.add(ProfileVisit(visitor_id=current_user.id, profile_id=id))
    db.session.commit()
    return {'ok': True}


@user_routes.route('/visitors')
@login_required
def my_visitors():
    """People who viewed the current user's profile, most recent first."""
    visits = ProfileVisit.query.filter_by(profile_id=current_user.id)\
        .order_by(ProfileVisit.updated_at.desc()).limit(50).all()
    return {
        'visitors': [v.to_dict() for v in visits],
        'count': len(visits),
    }


@user_routes.route('/online')
@login_required
def online_users():
    """People to show in the sidebar's presence list.

    Everyone the current user follows, ordered so the people who are actually
    around float to the top (online, then do-not-disturb, then offline). Falls
    back to the wider user list when you don't follow anyone yet, so a new
    account doesn't stare at an empty rail.
    """
    following_ids = [f.followed_id for f in current_user.following]

    if following_ids:
        users = User.query.filter(User.id.in_(following_ids)).all()
    else:
        users = User.query.filter(User.id != current_user.id).limit(30).all()

    rank = {'online': 0, 'dnd': 1, 'offline': 2}
    rows = []
    for u in users:
        presence = u.effective_presence()
        rows.append({
            'id': u.id,
            'username': u.username,
            'profile_img': u.profile_img,
            'presence': presence,
            'last_seen': u.last_seen.isoformat() if u.last_seen else None,
        })

    rows.sort(key=lambda r: (rank.get(r['presence'], 3), r['username'].lower()))

    return {
        'users': rows[:20],
        'online_count': sum(1 for r in rows if r['presence'] == 'online'),
        'me': {
            'id': current_user.id,
            'presence': current_user.effective_presence(),
            'presence_status': current_user.presence_status or 'active',
        },
    }
