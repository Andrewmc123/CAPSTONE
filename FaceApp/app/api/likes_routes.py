from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, Like, Post, Notification, User
from datetime import datetime

likes_routes = Blueprint('likes', __name__)

@likes_routes.route('/<int:post_id>', methods=['POST'])
@login_required
def like_post(post_id):
    """
    Like a post and send notification to post owner
    """
    post = Post.query.get(post_id)
    if not post:
        return {"error": "Post not found"}, 404

    # Check if already liked
    existing_like = Like.query.filter_by(
        user_id=current_user.id, 
        post_id=post_id
    ).first()
    
    if existing_like:
        return {"error": "Post already liked"}, 400

    # Create the like
    like = Like(
        user_id=current_user.id,
        post_id=post_id
    )
    db.session.add(like)

    # Create notification for post owner (if not liking own post)
    if current_user.id != post.user_id:
        notification = Notification(
            user_id=post.user_id,
            actor_id=current_user.id,
            event_type='like',
            event_id=post_id,
            message=f"{current_user.username} liked your post"
        )
        db.session.add(notification)

    db.session.commit()

    return {
        "like": like.to_dict(),
        "message": "Post liked successfully"
    }, 201

@likes_routes.route('/<int:post_id>', methods=['DELETE'])
@login_required
def unlike_post(post_id):
    """
    Unlike a post
    """
    like = Like.query.filter_by(
        user_id=current_user.id,
        post_id=post_id
    ).first()

    if not like:
        return {"error": "Like not found"}, 404

    db.session.delete(like)
    db.session.commit()

    return {"message": "Post unliked successfully"}, 200

@likes_routes.route('/check/<int:post_id>', methods=['GET'])
@login_required
def check_like(post_id):
    """
    Check if current user liked a post
    """
    like = Like.query.filter_by(
        user_id=current_user.id,
        post_id=post_id
    ).first()

    return {
        "liked": like is not None,
        "like": like.to_dict() if like else None
    }, 200