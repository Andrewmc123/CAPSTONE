from flask import Blueprint
from flask_login import login_required, current_user
from app.models import db, Post, Bookmark
from sqlalchemy.orm import joinedload, selectinload

bookmark_routes = Blueprint('bookmarks', __name__)


@bookmark_routes.route('/')
@login_required
def get_bookmarks():
    """Current user's saved videos (Favorites tab)."""
    bookmarks = Bookmark.query.filter_by(user_id=current_user.id)\
        .order_by(Bookmark.created_at.desc()).all()
    post_ids = [b.post_id for b in bookmarks]
    posts = Post.query.options(
        joinedload(Post.user),
        selectinload(Post.likes),
        selectinload(Post.comments),
        selectinload(Post.bookmarks),
    ).filter(Post.id.in_(post_ids)).all()
    by_id = {p.id: p for p in posts}
    ordered = [by_id[pid] for pid in post_ids if pid in by_id]
    return {'posts': [p.to_dict(current_user.id) for p in ordered]}


@bookmark_routes.route('/<int:post_id>', methods=['POST'])
@login_required
def add_bookmark(post_id):
    """Save a video to favorites."""
    post = Post.query.get_or_404(post_id)

    existing = Bookmark.query.filter_by(
        user_id=current_user.id, post_id=post_id).first()
    if existing:
        return {'message': 'Already bookmarked', 'bookmarked': True, 'post_id': post_id}, 200

    db.session.add(Bookmark(user_id=current_user.id, post_id=post_id))
    db.session.commit()
    return {
        'message': 'Bookmarked',
        'bookmarked': True,
        'post_id': post_id,
        'bookmark_count': len(post.bookmarks),
    }, 201


@bookmark_routes.route('/<int:post_id>', methods=['DELETE'])
@login_required
def remove_bookmark(post_id):
    """Remove a video from favorites."""
    bookmark = Bookmark.query.filter_by(
        user_id=current_user.id, post_id=post_id).first()
    if not bookmark:
        return {'error': 'Not bookmarked'}, 404

    db.session.delete(bookmark)
    db.session.commit()

    post = Post.query.get(post_id)
    return {
        'message': 'Bookmark removed',
        'bookmarked': False,
        'post_id': post_id,
        'bookmark_count': len(post.bookmarks) if post else 0,
    }, 200
