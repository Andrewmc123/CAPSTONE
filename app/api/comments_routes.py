from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, Comment, Post, Notification
from datetime import datetime

comments_routes = Blueprint('comments', __name__)

# Get all comments (optional feed-like route)
@comments_routes.route('/', methods=['GET'])
@login_required
def get_all_comments():
    try:
        comments = Comment.query.order_by(Comment.created_at.desc()).all()
        return [comment.to_dict() for comment in comments], 200
    except Exception as e:
        return {'errors': {'message': str(e)}}, 500


# Add a comment to a post
@comments_routes.route('/<int:post_id>', methods=['POST'])
@login_required
def create_comment(post_id):
    try:
        data = request.get_json()
        # Handle both 'content' (frontend) and 'body' (backward compatibility)
        body = data.get('content') or data.get('body')
        
        if not body or body.strip() == "":
            return {'errors': {'message': 'Comment text is required'}}, 400

        post = Post.query.get(post_id)
        if not post:
            return {'errors': {'message': 'Post not found'}}, 404

        comment = Comment(
            user_id=current_user.id,
            post_id=post_id,
            body=body.strip(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(comment)
        db.session.commit()

        # Prepare notification if commenter is not the post owner
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
            "comment": {
                **comment.to_dict(),
                "user": current_user.to_dict_basic()
            },
            "notification": notification_data
        }, 201

    except Exception as e:
        db.session.rollback()
        return {'errors': {'message': str(e)}}, 500


# Update a comment
@comments_routes.route('/<int:comment_id>', methods=['PUT'])
@login_required
def update_comment(comment_id):
    try:
        data = request.get_json()
        body = data.get('content') or data.get('body')

        if not body or body.strip() == "":
            return {
                "message": "Validation error",
                "errors": {"content": "Comment text is required"}
            }, 400

        comment = Comment.query.get(comment_id)
        if not comment:
            return {"message": "Comment not found"}, 404
        if comment.user_id != current_user.id:
            return {"message": "Unauthorized"}, 403

        comment.body = body.strip()
        comment.updated_at = datetime.utcnow()
        db.session.commit()

        return {
            **comment.to_dict(),
            "user": current_user.to_dict_basic()
        }, 200

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

        db.session.delete(comment)
        db.session.commit()
        return {"message": "Successfully deleted"}, 200

    except Exception as e:
        db.session.rollback()
        return {'errors': {'message': str(e)}}, 500