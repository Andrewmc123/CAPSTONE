from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, Comment, Post, Notification, CommentLike
from datetime import datetime

comments_routes = Blueprint('comments', __name__)


# Get all comments (optional feed-like route)
@comments_routes.route('/', methods=['GET'])
@login_required
def get_all_comments():
    try:
        comments = Comment.query.order_by(Comment.created_at.desc()).all()
        return [comment.to_dict(current_user.id) for comment in comments], 200
    except Exception as e:
        return {'errors': {'message': str(e)}}, 500


# Add a comment to a post (supports text and/or GIF)
@comments_routes.route('/<int:post_id>', methods=['POST'])
@login_required
def create_comment(post_id):
    try:
        data = request.get_json() or {}
        body = (data.get('content') or data.get('body') or '').strip()
        gif_url = data.get('gif_url')

        if not body and not gif_url:
            return {'errors': {'message': 'Comment text or a GIF is required'}}, 400

        post = Post.query.get(post_id)
        if not post:
            return {'errors': {'message': 'Post not found'}}, 404

        comment = Comment(
            user_id=current_user.id,
            post_id=post_id,
            body=body,
            gif_url=gif_url,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(comment)
        db.session.commit()

        notification_data = None
        if post.user_id != current_user.id:
            notification = Notification(
                recipient_id=post.user_id,
                sender_id=current_user.id,
                notification_type="post_comment",
                post_id=post_id,
                comment_id=comment.id,
                is_read=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.session.add(notification)
            db.session.commit()
            notification_data = notification.to_dict()

        return {
            "comment": comment.to_dict(current_user.id),
            "notification": notification_data
        }, 201

    except Exception as e:
        db.session.rollback()
        return {'errors': {'message': str(e)}}, 500


# Like / unlike a comment
@comments_routes.route('/<int:comment_id>/like', methods=['POST'])
@login_required
def toggle_comment_like(comment_id):
    comment = Comment.query.get(comment_id)
    if not comment:
        return {'errors': {'message': 'Comment not found'}}, 404

    existing = CommentLike.query.filter_by(
        user_id=current_user.id, comment_id=comment_id).first()

    if existing:
        db.session.delete(existing)
    else:
        db.session.add(CommentLike(user_id=current_user.id, comment_id=comment_id))
        # Notify the comment's author — deep-links straight to the comment.
        if comment.user_id != current_user.id:
            db.session.add(Notification(
                sender_id=current_user.id,
                recipient_id=comment.user_id,
                notification_type='comment_like',
                post_id=comment.post_id,
                comment_id=comment.id,
                is_read=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ))

    db.session.commit()
    return comment.to_dict(current_user.id), 200


# Update a comment
@comments_routes.route('/<int:comment_id>', methods=['PUT'])
@login_required
def update_comment(comment_id):
    try:
        data = request.get_json() or {}
        body = (data.get('content') or data.get('body') or '').strip()

        if not body:
            return {
                "message": "Validation error",
                "errors": {"content": "Comment text is required"}
            }, 400

        comment = Comment.query.get(comment_id)
        if not comment:
            return {"message": "Comment not found"}, 404
        if comment.user_id != current_user.id:
            return {"message": "Unauthorized"}, 403

        comment.body = body
        comment.updated_at = datetime.utcnow()
        db.session.commit()

        return comment.to_dict(current_user.id), 200

    except Exception as e:
        db.session.rollback()
        return {'errors': {'message': str(e)}}, 500


# Delete a comment
@comments_routes.route('/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    try:
        comment = Comment.query.get(comment_id)
        if not comment:
            return {"message": "Comment not found"}, 404
        if comment.user_id != current_user.id:
            return {"message": "Unauthorized"}, 403

        Notification.query.filter_by(comment_id=comment_id).delete()
        db.session.delete(comment)
        db.session.commit()
        return {"message": "Successfully deleted"}, 200

    except Exception as e:
        db.session.rollback()
        return {'errors': {'message': str(e)}}, 500
