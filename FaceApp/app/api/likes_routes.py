# like_routes.py

from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, Likes, Post

likes_routes = Blueprint('likes', __name__)


# Get all likes by the current user
@likes_routes.route('/', methods=['GET'])
@login_required
def get_my_likes():
    """
    Returns all posts liked by the current user
    """
    likes = Like.query.filter_by(user_id=current_user.id).all()
    return {
        "likes": [like.to_dict() for like in likes]
    }, 200


# Like a post
@likes_routes.route('/<int:post_id>', methods=['POST'])
@login_required
def like_post(post_id):
    """
    Likes a post (if not already liked)
    """
    existing_like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()

    if existing_like:
        return { "message": "Post already liked." }, 400

    like = Like(user_id=current_user.id, post_id=post_id)
    db.session.add(like)
    db.session.commit()

    return {
        "like": like.to_dict()
    }, 201


# Unlike a post
@likes_routes.route('/<int:post_id>', methods=['DELETE'])
@login_required
def unlike_post(post_id):
    """
    Removes a like from a post
    """
    like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()

    if not like:
        return { "message": "Like not found." }, 404

    db.session.delete(like)
    db.session.commit()

    return { "message": "Successfully unliked." }, 200
