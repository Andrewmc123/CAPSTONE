from flask import Blueprint, request
from sqlalchemy import or_
from app.models import (
    User, db, Notification, Message, ProfileVisit, Product,
    LiveSession, LiveViewer, LiveMessage, LiveReport,
    Group, GroupMember, GroupMessage, Order,
)
from app.forms import LoginForm
from app.forms import SignUpForm
from flask_login import current_user, login_user, logout_user, login_required

auth_routes = Blueprint('auth', __name__)


@auth_routes.route('/')
def authenticate():
    """
    Authenticates a user.
    """
    if current_user.is_authenticated:
        return current_user.to_dict()
    return {'errors': {'message': 'Unauthorized'}}, 401


@auth_routes.route('/login', methods=['POST'])
def login():
    form = LoginForm()
    # Get the csrf_token from the request cookie and put it into the
    # form manually to validate_on_submit can be used
    # if 'csrf_token' not in request.cookies:
    #     return {'errors': {'message': 'CSRF token missing'}}, 400  # Explicit check
    form['csrf_token'].data = request.cookies['csrf_token']
    print(form)
    if form.validate_on_submit():
        # Add the user to the session, we are logged in!
        user = User.query.filter(User.email == form.data['email']).first()
        print(user)
        login_user(user)
        return user.to_dict()
    return form.errors, 401


@auth_routes.route('/logout')
def logout():
    """
    Logs a user out
    """
    logout_user()
    return {'message': 'User logged out'}

@auth_routes.route('/signup', methods=['POST'])
def sign_up():
    form = SignUpForm()
    form['csrf_token'].data = request.cookies.get('csrf_token')

    if form.validate_on_submit():
        user = User(
            username=form.data['username'],
            email=form.data['email'],
            password=form.data['password'],
            firstname=form.data['firstname'],
            lastname=form.data['lastname'],
        )
        db.session.add(user)
        db.session.commit()
        login_user(user)
        return user.to_dict()
    
    print("SIGNUP ERRORS:", form.errors)  
    return form.errors, 401



@auth_routes.route('/delete', methods=['DELETE'])
@login_required
def delete_account():
    """Permanently delete the current user's account and all of their data.

    The User model cascades posts (→comments/likes/bookmarks), comments, likes,
    bookmarks, comment-likes, follows, friends and vault content. Everything else
    that points at the user (messages, notifications, profile visits, shop
    products, live records) has no cascade, so we clear it explicitly first —
    otherwise deleting the user would orphan rows or hit NOT-NULL FK errors.
    """
    uid = current_user.id
    user = User.query.get(uid)
    if not user:
        return {'errors': {'message': 'Account not found'}}, 404

    my_post_ids = [p.id for p in user.posts]

    Notification.query.filter(
        or_(
            Notification.sender_id == uid,
            Notification.recipient_id == uid,
            Notification.post_id.in_(my_post_ids),
        )
    ).delete(synchronize_session=False)
    Message.query.filter(
        or_(Message.sender_id == uid, Message.recipient_id == uid)
    ).delete(synchronize_session=False)
    ProfileVisit.query.filter(
        or_(ProfileVisit.visitor_id == uid, ProfileVisit.profile_id == uid)
    ).delete(synchronize_session=False)
    Product.query.filter(Product.seller_id == uid).delete(synchronize_session=False)
    LiveReport.query.filter(
        or_(LiveReport.reporter_id == uid, LiveReport.reported_user_id == uid)
    ).delete(synchronize_session=False)
    LiveMessage.query.filter(LiveMessage.user_id == uid).delete(synchronize_session=False)
    LiveViewer.query.filter(LiveViewer.user_id == uid).delete(synchronize_session=False)
    # ORM-delete the user's live sessions so their viewers/messages cascade
    for session in LiveSession.query.filter(LiveSession.host_id == uid).all():
        db.session.delete(session)

    # shop orders + network groups also point at the user with no cascade
    Order.query.filter(Order.buyer_id == uid).delete(synchronize_session=False)
    GroupMessage.query.filter(GroupMessage.user_id == uid).delete(synchronize_session=False)
    GroupMember.query.filter(GroupMember.user_id == uid).delete(synchronize_session=False)
    for grp in Group.query.filter(Group.leader_id == uid).all():
        db.session.delete(grp)  # cascades the group's members + messages

    db.session.commit()  # phase 1: clear non-cascaded refs (expires stale collections)

    # phase 2: re-fetch the now-clean user and delete (cascades the rest)
    fresh = User.query.get(uid)
    if fresh:
        db.session.delete(fresh)
        db.session.commit()

    logout_user()
    return {'message': 'Account deleted'}


@auth_routes.route('/unauthorized')
def unauthorized():
    """
    Returns unauthorized JSON when flask-login authentication fails
    """
    return {'errors': {'message': 'Unauthorized'}}, 401