from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import db, Post, Like, Comment, Friend, User, Notification, Follow
from sqlalchemy import or_, and_
from sqlalchemy.orm import joinedload, selectinload
from datetime import datetime
import json

post_routes = Blueprint('posts', __name__)

POST_QUERY_OPTIONS = (
    joinedload(Post.user),
    selectinload(Post.likes),
    selectinload(Post.comments),
    selectinload(Post.bookmarks),
)


def viewer_id():
    return current_user.id if current_user.is_authenticated else None


def get_friend_ids(user_id):
    friends = Friend.query.filter(
        or_(
            and_(Friend.user_id == user_id, Friend.status == 'friends'),
            and_(Friend.friend_id == user_id, Friend.status == 'friends')
        )
    ).all()
    ids = set()
    for f in friends:
        ids.add(f.friend_id if f.user_id == user_id else f.user_id)
    return ids


def engagement_score(post):
    """For You ranking: engagement weighted with a gentle recency decay."""
    now = datetime.utcnow()
    created = post.created_at or now
    age_hours = max(1.0, (now - created).total_seconds() / 3600)
    raw = (
        len(post.likes) * 3
        + len(post.comments) * 2
        + (post.shares or 0) * 4
        + (post.views or 0) * 0.05
        + len(post.bookmarks) * 3
    )
    return raw / (age_hours ** 0.25)


def paginate(items, page, per_page):
    start = (page - 1) * per_page
    chunk = items[start:start + per_page]
    return chunk, start + per_page < len(items)


@post_routes.route('/feed')
def get_feed():
    """
    TikTok-style feed. tab=foryou (public) | following | friends (auth required).
    Paginated with ?page=&per_page=
    """
    tab = request.args.get('tab', 'foryou')
    page = max(1, request.args.get('page', 1, type=int))
    per_page = min(20, request.args.get('per_page', 8, type=int))

    query = Post.query.options(*POST_QUERY_OPTIONS)

    if tab == 'following':
        if not current_user.is_authenticated:
            return {'error': 'Log in to see your Following feed'}, 401
        followed_ids = [f.followed_id for f in Follow.query.filter_by(follower_id=current_user.id).all()]
        posts = query.filter(Post.user_id.in_(followed_ids)).order_by(Post.created_at.desc()).all()
        chunk, has_more = paginate(posts, page, per_page)
    elif tab == 'friends':
        if not current_user.is_authenticated:
            return {'error': 'Log in to see your Friends feed'}, 401
        friend_ids = get_friend_ids(current_user.id)
        posts = query.filter(Post.user_id.in_(friend_ids)).order_by(Post.created_at.desc()).all()
        chunk, has_more = paginate(posts, page, per_page)
    else:
        posts = query.all()
        posts.sort(key=engagement_score, reverse=True)
        chunk, has_more = paginate(posts, page, per_page)

    uid = viewer_id()
    return {
        'posts': [p.to_dict(uid) for p in chunk],
        'page': page,
        'has_more': has_more,
        'tab': tab,
    }


@post_routes.route('/')
@login_required
def get_all_posts():
    posts = Post.query.options(*POST_QUERY_OPTIONS).order_by(Post.created_at.desc()).all()
    uid = viewer_id()
    return {'posts': [p.to_dict(uid) for p in posts]}


@post_routes.route('/<int:post_id>')
def get_single_post(post_id):
    """Public single video page (share target)."""
    post = Post.query.options(*POST_QUERY_OPTIONS).get_or_404(post_id)
    return post.to_dict(viewer_id())


@post_routes.route('/user/<int:user_id>')
def get_user_posts(user_id):
    user = User.query.get_or_404(user_id)
    posts = Post.query.options(*POST_QUERY_OPTIONS)\
        .filter_by(user_id=user.id).order_by(Post.created_at.desc()).all()
    uid = viewer_id()
    return {'posts': [p.to_dict(uid) for p in posts]}


@post_routes.route('/liked/<int:user_id>')
def get_liked_posts(user_id):
    """Videos a user has liked (profile 'Liked' tab)."""
    likes = Like.query.filter_by(user_id=user_id).order_by(Like.created_at.desc()).all()
    post_ids = [l.post_id for l in likes]
    posts = Post.query.options(*POST_QUERY_OPTIONS).filter(Post.id.in_(post_ids)).all()
    by_id = {p.id: p for p in posts}
    ordered = [by_id[pid] for pid in post_ids if pid in by_id]
    uid = viewer_id()
    return {'posts': [p.to_dict(uid) for p in ordered]}


@post_routes.route('/', methods=['POST'])
@login_required
def create_post():
    data = request.get_json()

    if not data:
        return {'error': 'Request body must be JSON'}, 400

    body = (data.get('body') or '').strip()
    image_url = data.get('image_url')
    video_url = data.get('video_url')

    # carousel: up to 10 images shown side-by-side as swipeable slides
    images = data.get('images')
    if isinstance(images, list):
        images = [u for u in images if u][:10]
    else:
        images = None
    if images and not image_url:
        image_url = images[0]  # first slide doubles as poster/thumbnail

    media_type = data.get('media_type') or (
        'video' if video_url else
        ('carousel' if images and len(images) > 1 else
         ('gif' if (image_url or '').endswith('.gif') else 'image'))
    )

    if not body and not image_url and not video_url:
        return {'error': 'A caption, video, image or GIF is required'}, 400

    edit_data = data.get('edit_data')
    if isinstance(edit_data, (dict, list)):
        edit_data = json.dumps(edit_data)

    post = Post(
        user_id=current_user.id,
        body=body,
        image_url=image_url,
        images=json.dumps(images) if images else None,
        video_url=video_url,
        media_type=media_type,
        sound_name=data.get('sound_name'),
        sound_url=data.get('sound_url'),
        edit_data=edit_data,
        location=(data.get('location') or '').strip()[:120] or None,
        views=0,
        shares=0,
    )

    db.session.add(post)
    db.session.commit()

    fresh = Post.query.options(*POST_QUERY_OPTIONS).get(post.id)
    return fresh.to_dict(current_user.id), 201


@post_routes.route('/<int:post_id>', methods=['PUT'])
@login_required
def update_post(post_id):
    post = Post.query.options(*POST_QUERY_OPTIONS).get_or_404(post_id)

    if post.user_id != current_user.id:
        return {'error': 'Unauthorized'}, 403

    data = request.get_json() or {}
    body = data.get('body')
    if body is not None:
        post.body = body.strip()
    if 'image_url' in data:
        post.image_url = data.get('image_url')
    if 'sound_name' in data:
        post.sound_name = data.get('sound_name')
    edit_data = data.get('edit_data')
    if edit_data is not None:
        post.edit_data = json.dumps(edit_data) if isinstance(edit_data, (dict, list)) else edit_data
    post.updated_at = datetime.utcnow()
    db.session.commit()

    db.session.refresh(post)
    return post.to_dict(current_user.id), 200


@post_routes.route('/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id:
        return {'error': 'Unauthorized'}, 403

    Notification.query.filter_by(post_id=post_id).delete()
    db.session.delete(post)
    db.session.commit()
    return {'message': 'Post deleted successfully'}, 200


@post_routes.route('/<int:post_id>/like', methods=['POST'])
@login_required
def toggle_like(post_id):
    post = Post.query.options(*POST_QUERY_OPTIONS).get_or_404(post_id)

    like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()

    if like:
        db.session.delete(like)
    else:
        db.session.add(Like(user_id=current_user.id, post_id=post_id))
        if post.user_id != current_user.id:
            db.session.add(Notification(
                recipient_id=post.user_id,
                sender_id=current_user.id,
                notification_type='post_like',
                post_id=post_id,
                is_read=False,
            ))

    db.session.commit()
    db.session.refresh(post)
    return post.to_dict(current_user.id), 200


@post_routes.route('/<int:post_id>/view', methods=['POST'])
def add_view(post_id):
    """Increment view count — public, fired after ~2s of watch time."""
    post = Post.query.get_or_404(post_id)
    post.views = (post.views or 0) + 1
    db.session.commit()
    return {'id': post.id, 'views': post.views}, 200


@post_routes.route('/<int:post_id>/share', methods=['POST'])
def add_share(post_id):
    """Increment share count — public."""
    post = Post.query.get_or_404(post_id)
    post.shares = (post.shares or 0) + 1
    db.session.commit()
    return {'id': post.id, 'shares': post.shares}, 200


@post_routes.route('/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    # Top-level comments only (newest first); each carries its replies nested.
    comments = Comment.query.options(joinedload(Comment.user))\
        .filter_by(post_id=post_id, parent_id=None)\
        .order_by(Comment.created_at.desc())\
        .all()
    uid = viewer_id()
    return {'comments': [c.to_dict(uid, include_replies=True) for c in comments]}, 200


@post_routes.route('/<int:post_id>/comments', methods=['POST'])
@login_required
def add_comment(post_id):
    data = request.get_json() or {}
    body = (data.get('body') or data.get('content') or '').strip()
    gif_url = data.get('gif_url')
    parent_id = data.get('parent_id')

    if not body and not gif_url:
        return {'error': 'Comment text or a GIF is required'}, 400

    post = Post.query.get_or_404(post_id)

    # a reply must point at a real top-level comment on this same post
    parent = None
    if parent_id:
        parent = Comment.query.filter_by(id=parent_id, post_id=post_id).first()
        if not parent:
            return {'error': 'Parent comment not found'}, 404
        # keep threads one level deep (TikTok-style): replies attach to the root
        if parent.parent_id:
            parent_id = parent.parent_id

    comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        parent_id=parent_id,
        body=body,
        gif_url=gif_url,
    )
    db.session.add(comment)

    # notify the post author (top-level) or the parent comment's author (reply)
    notify_uid = parent.user_id if parent else post.user_id
    if notify_uid != current_user.id:
        db.session.add(Notification(
            recipient_id=notify_uid,
            sender_id=current_user.id,
            notification_type='post_comment',
            post_id=post_id,
            is_read=False,
        ))
    db.session.commit()

    fresh = Comment.query.options(joinedload(Comment.user)).get(comment.id)
    return fresh.to_dict(current_user.id), 201


@post_routes.route('/<int:post_id>/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(post_id, comment_id):
    comment = Comment.query.filter_by(id=comment_id, post_id=post_id).first_or_404()

    if comment.user_id != current_user.id and comment.post.user_id != current_user.id:
        return {'error': 'Unauthorized'}, 403

    Notification.query.filter_by(comment_id=comment_id).delete()
    db.session.delete(comment)
    db.session.commit()
    return {'message': 'Comment deleted successfully'}, 200


@post_routes.route('/friends', methods=['GET'])
@login_required
def get_friends_posts():
    friend_ids = get_friend_ids(current_user.id)
    friend_ids.add(current_user.id)

    all_posts = Post.query.options(*POST_QUERY_OPTIONS).filter(
        Post.user_id.in_(friend_ids)
    ).order_by(Post.created_at.desc()).all()

    return {'posts': [p.to_dict(current_user.id) for p in all_posts]}, 200
