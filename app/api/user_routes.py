from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, User

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

    db.session.commit()
    return current_user.to_dict()
