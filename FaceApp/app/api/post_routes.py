# post_routes.py

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import db, Post, Like, Comment

post_routes = Blueprint('posts', __name__)

# Get all posts (can later be filtered to only show friends' posts)
@post_routes.route('/')
@login_required
def get_all_posts():
    """
    Gets all posts made by the current user's friends and self
    """
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return {'posts': [post.to_dict() for post in posts]}, 200


# Create a new post (with optional media)
@post_routes.route('/', methods=['POST'])
@login_required
def create_post():
    """
    Creates a new post (with image or video)
    """
    data = request.get_json()
    post = Post(
        user_id=current_user.id,
        caption=data.get('caption'),
        media_url=data.get('media_url'),
        media_type=data.get('media_type')  # 'image' or 'video'
    )
    db.session.add(post)
    db.session.commit()
    return post.to_dict(), 201


# Like or Unlike a post
@post_routes.route('/<int:post_id>/like', methods=['POST'])
@login_required
def toggle_like(post_id):
    """
    Likes or unlikes a post
    """
    like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()
    if like:
        db.session.delete(like)
    else:
        new_like = Like(user_id=current_user.id, post_id=post_id)
        db.session.add(new_like)
    db.session.commit()
    return {'status': 'success'}, 200


# Add a comment to a post
@post_routes.route('/<int:post_id>/comments', methods=['POST'])
@login_required
def add_comment(post_id):
    """
    Adds a comment to a post
    """
    data = request.get_json()
    comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        content=data.get('content')
    )
    db.session.add(comment)
    db.session.commit()
    return comment.to_dict(), 201
