from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import db, Post, Like, Comment, Friend, User
from sqlalchemy import or_, and_
from sqlalchemy.orm import joinedload, selectinload
from datetime import datetime

post_routes = Blueprint('posts', __name__)

def serialize_comment(comment):
    return {
        "id": comment.id,
        "user_id": comment.user_id,
        "post_id": comment.post_id,
        "body": comment.body,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
        "updated_at": comment.updated_at.isoformat() if comment.updated_at else None,
        "user": {
            "id": comment.user.id,
            "username": comment.user.username,
            "profile_img": comment.user.profile_img
        }
    }

def serialize_post(post):
    liked_by_current_user = any(like.user_id == current_user.id for like in post.likes)
    return {
        "id": post.id,
        "user_id": post.user_id,
        "body": post.body,
        "image_url": post.image_url,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "updated_at": post.updated_at.isoformat() if post.updated_at else None,
        "user": {
            "id": post.user.id,
            "username": post.user.username,
            "profile_img": post.user.profile_img
        },
        "comments": [serialize_comment(c) for c in post.comments],
        "like_count": len(post.likes),
        "liked_by_user": liked_by_current_user
    }

@post_routes.route('/')
@login_required
def get_all_posts():
    posts = Post.query.options(
        joinedload(Post.user),
        selectinload(Post.comments).joinedload(Comment.user),
        selectinload(Post.likes)
    ).order_by(Post.created_at.desc()).all()
    return {'posts': [serialize_post(post) for post in posts]}

@post_routes.route('/user/<int:user_id>')
@login_required
def get_user_posts(user_id):
    user = User.query.get_or_404(user_id)
    posts = Post.query.options(
        joinedload(Post.user),
        selectinload(Post.comments).joinedload(Comment.user),
        selectinload(Post.likes)
    ).filter_by(user_id=user.id).order_by(Post.created_at.desc()).all()
    return {'posts': [serialize_post(post) for post in posts]}

@post_routes.route('/', methods=['POST'])
@login_required
def create_post():
    data = request.get_json()
    
    if not data:
        return {'error': 'Request body must be JSON'}, 400
        
    body = data.get('body')
    image_url = data.get('image_url')
    
    if not body and not image_url:
        return {'error': 'Post content or image URL is required'}, 400

    # Create the post
    post = Post(
        user_id=current_user.id,
        body=body,
        image_url=image_url
    )
    
    db.session.add(post)
    db.session.commit()
    
    # Reload with relationships for the response
    post_with_relations = Post.query.options(
        joinedload(Post.user),
        selectinload(Post.comments).joinedload(Comment.user),
        selectinload(Post.likes)
    ).get(post.id)
    
    return serialize_post(post_with_relations), 201

@post_routes.route('/<int:post_id>', methods=['PUT'])
@login_required
def update_post(post_id):
    post = Post.query.options(
        joinedload(Post.user),
        selectinload(Post.comments).joinedload(Comment.user),
        selectinload(Post.likes)
    ).get_or_404(post_id)
    
    if post.user_id != current_user.id:
        return {'error': 'Unauthorized'}, 403

    data = request.get_json()
    if not data.get('body') and not data.get('image_url'):
        return {'error': 'Post content or image is required'}, 400
        
    post.body = data.get('body', post.body)
    post.image_url = data.get('image_url', post.image_url)
    post.updated_at = datetime.utcnow()
    db.session.commit()
    
    # Reload to get fresh data
    db.session.refresh(post)
    return serialize_post(post), 200

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
    post = Post.query.options(
        joinedload(Post.user),
        selectinload(Post.comments).joinedload(Comment.user),
        selectinload(Post.likes)
    ).get_or_404(post_id)
    
    like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()
    
    if like:
        db.session.delete(like)
    else:
        new_like = Like(user_id=current_user.id, post_id=post_id)
        db.session.add(new_like)
    
    db.session.commit()
    
    # Reload to get updated like status
    db.session.refresh(post)
    return serialize_post(post), 200

@post_routes.route('/<int:post_id>/comments', methods=['POST'])
@login_required
def add_comment(post_id):
    data = request.get_json()
    if not data.get('body'):
        return {'error': 'Comment text is required'}, 400

    post = Post.query.get_or_404(post_id)
    comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        body=data['body'].strip()
    )
    db.session.add(comment)
    db.session.commit()
    
    # Reload comment with user relationship
    comment_with_user = Comment.query.options(
        joinedload(Comment.user)
    ).get(comment.id)
    
    return serialize_comment(comment_with_user), 201

@post_routes.route('/<int:post_id>/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(post_id, comment_id):
    comment = Comment.query.filter_by(id=comment_id, post_id=post_id).first_or_404()
    
    if comment.user_id != current_user.id and comment.post.user_id != current_user.id:
        return {'error': 'Unauthorized'}, 403
    
    db.session.delete(comment)
    db.session.commit()
    return {'message': 'Comment deleted successfully'}, 200

@post_routes.route('/<int:post_id>/comments', methods=['GET'])
@login_required
def get_comments(post_id):
    comments = Comment.query.options(
        joinedload(Comment.user)
    ).filter_by(post_id=post_id)\
     .order_by(Comment.created_at.asc())\
     .all()
    return {'comments': [serialize_comment(comment) for comment in comments]}, 200

@post_routes.route('/friends', methods=['GET'])
@login_required
def get_friends_posts():
    friends = Friend.query.filter(
        or_(
            and_(Friend.user_id == current_user.id, Friend.status == 'accepted'),
            and_(Friend.friend_id == current_user.id, Friend.status == 'accepted')
        )
    ).all()

    friend_ids = set()
    for friend in friends:
        if friend.user_id == current_user.id:
            friend_ids.add(friend.friend_id)
        else:
            friend_ids.add(friend.user_id)

    # Include current user's ID to get both friend posts and user's own posts
    friend_ids.add(current_user.id)

    # Get all posts from friends and current user in a single query with proper ordering
    all_posts = Post.query.options(
        joinedload(Post.user),
        selectinload(Post.comments).joinedload(Comment.user),
        selectinload(Post.likes)
    ).filter(
        Post.user_id.in_(friend_ids)
    ).order_by(Post.created_at.desc()).all()

    return {
        'posts': [serialize_post(post) for post in all_posts]
    }, 200