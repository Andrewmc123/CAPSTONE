from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import db, Post, Like, Comment

post_routes = Blueprint('posts', __name__)

@post_routes.route('/')
@login_required
def get_all_posts():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return {'posts': [post.to_dict() for post in posts]}, 200

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
