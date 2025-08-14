from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, Comment, Post, Notification
from datetime import datetime

comments_routes = Blueprint('comments', __name__)

# Get all comments (optional feed-like route)
@comments_routes.route('/', methods=['GET'])
@login_required
def get_all_comments():
    comments = Comment.query.order_by(Comment.created_at.desc()).all()
    return [comment.to_dict() for comment in comments], 200


# Add a comment to a post
@comments_routes.route('/<int:post_id>', methods=['POST'])
@login_required
def create_comment(post_id):
    data = request.get_json()
    content = data.get('content')

    if not content or content.strip() == "":
        return {'errors': {'content': 'Comment content is required'}}, 400

    # Create the comment
    comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        body=content.strip(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.session.add(comment)
    db.session.commit()

    # Prepare notification if commenter is not the post owner
    notification_data = None
    post = Post.query.get(post_id)
    if post and post.user_id != current_user.id:
        notification = Notification(
            recipient_id=post.user_id,
            sender_id=current_user.id,
            notification_type="post_comment",
            post_id=post_id,
            comment_id=comment.id,
            message=None,  # Will auto-generate in Notification.to_dict()
            link=None,     # Will auto-generate in Notification.to_dict()
            is_read=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(notification)
        db.session.commit()
        notification_data = notification.to_dict()

    return {
        "comment": comment.to_dict(),
        "notification": notification_data
    }, 201


# Update a comment
@comments_routes.route('/<int:comment_id>', methods=['PUT'])
@login_required
def update_comment(comment_id):
    data = request.get_json()
    comment_text = data.get('content')

    if not comment_text or comment_text.strip() == "":
        return {
            "message": "Validation error",
            "errors": {"content": "Comment text is required"}
        }, 400

    comment = Comment.query.get(comment_id)

    if not comment or comment.user_id != current_user.id:
        return {"message": "Comment couldn't be found or does not belong to the current user"}, 404

    comment.body = comment_text.strip()
    comment.updated_at = datetime.utcnow()

    db.session.commit()

    return comment.to_dict(), 200


# Delete a comment
@comments_routes.route('/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    comment = Comment.query.get(comment_id)

    if not comment or comment.user_id != current_user.id:
        return {"message": "Comment couldn't be found or does not belong to the current user"}, 404

    db.session.delete(comment)
    db.session.commit()

    return {"message": "Successfully deleted"}, 200
