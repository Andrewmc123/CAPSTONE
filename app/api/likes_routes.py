from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, Like, Post, Notification, User
from datetime import datetime

likes_routes = Blueprint('likes', __name__)

@likes_routes.route('/<int:post_id>', methods=['POST'])
@login_required
def like_post(post_id):
    try:
        post = Post.query.get(post_id)
        if not post:
            return {"error": "Post not found"}, 404

        existing_like = Like.query.filter_by(
            user_id=current_user.id,
            post_id=post_id
        ).first()
        
        if existing_like:
            return {"error": "Post already liked"}, 400

        like = Like(
            user_id=current_user.id,
            post_id=post_id
        )
        db.session.add(like)

        if current_user.id != post.user_id:
            notification = Notification(
                sender_id=current_user.id,
                recipient_id=post.user_id,
                notification_type='post_like',
                post_id=post_id,
                message=None,
                is_read=False,
                created_at=datetime.utcnow()
            )
            db.session.add(notification)

        db.session.commit()

        return {
            "like": like.to_dict(),
            "message": "Post liked successfully"
        }, 201
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500

@likes_routes.route('/<int:post_id>', methods=['DELETE'])
@login_required
def unlike_post(post_id):
    try:
        like = Like.query.filter_by(
            user_id=current_user.id,
            post_id=post_id
        ).first()

        if not like:
            return {"error": "Like not found"}, 404

        db.session.delete(like)
        db.session.commit()

        return {"message": "Post unliked successfully"}, 200
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500