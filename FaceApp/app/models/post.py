from .db import db, environment, SCHEMA, add_prefix_for_prod
from .likes import Like

class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    body = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    user = db.relationship('User', back_populates='posts')
    comments = db.relationship('Comment', back_populates='post', cascade='all, delete')
    likes = db.relationship('Like', back_populates='post', cascade='all, delete')
