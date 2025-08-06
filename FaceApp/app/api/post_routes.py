from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import db, Post, Like, Comment, Friend
from sqlalchemy import or_, and_

post_routes = Blueprint('posts', __name__)

def serialize_post(post):
    liked_by_current_user = any(like.user_id == current_user.id for like in post.likes)
    return {
        **post.to_dict(),
        "comment_count": len(post.comments),
        "liked_by_current_user": liked_by_current_user
    }

@post_routes.route('/')
@login_required
def get_all_posts():
    posts = Post.query.all()
    return {'posts': [serialize_post(post) for post in posts]}

@post_routes.route('/', methods=['POST'])
@login_required
def create_post():
    data = request.get_json()
    post = Post(
        user_id=current_user.id,
        body=data.get('body'),
        image_url=data.get('image_url')
    )
    db.session.add(post)
    db.session.commit()
    return post.to_dict(), 201

@post_routes.route('/<int:post_id>', methods=['PUT'])
@login_required
def update_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id:
        return {'error': 'Unauthorized'}, 403

    data = request.get_json()
    post.body = data.get('body', post.body)
    post.image_url = data.get('image_url', post.image_url)
    db.session.commit()
    return post.to_dict(), 200

@post_routes.route('/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id:
        return {'error': 'Unauthorized'}, 403

    db.session.delete(post)
    db.session.commit()
    return {'message': 'Post deleted successfully'}, 200

@post_routes.route('/<int:post_id>/like', methods=['POST'])
@login_required
def toggle_like(post_id):
    like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()
    if like:
        db.session.delete(like)
    else:
        new_like = Like(user_id=current_user.id, post_id=post_id)
        db.session.add(new_like)
    db.session.commit()
    return {'status': 'success'}, 200

@post_routes.route('/<int:post_id>/comments', methods=['POST'])
@login_required
def add_comment(post_id):
    data = request.get_json()
    comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        content=data.get('content')
    )
    db.session.add(comment)
    db.session.commit()
    return comment.to_dict(), 201

@post_routes.route('/<int:post_id>/comments', methods=['GET'])
@login_required
def get_comments(post_id):
    post = Post.query.get_or_404(post_id)
    comments = Comment.query.filter_by(post_id=post.id).order_by(Comment.created_at.asc()).all()
    return {'comments': [comment.to_dict() for comment in comments]}, 200

# ✅ FILTER FRIEND POSTS ROUTE
@post_routes.route('/friends', methods=['GET'])
@login_required
def get_friends_posts():
    friends = Friend.query.filter(
        or_(
            and_(Friend.requester_id == current_user.id, Friend.status == 'accepted'),
            and_(Friend.receiver_id == current_user.id, Friend.status == 'accepted')
        )
    ).all()

    friend_ids = set()
    for friend in friends:
        if friend.requester_id == current_user.id:
            friend_ids.add(friend.receiver_id)
        else:
            friend_ids.add(friend.requester_id)

    friend_ids.add(current_user.id)

    posts = Post.query.filter(Post.user_id.in_(friend_ids)).order_by(Post.created_at.desc()).all()

    return {'posts': [serialize_post(post) for post in posts]}, 200
