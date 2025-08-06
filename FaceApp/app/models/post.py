from .db import db, environment, SCHEMA, add_prefix_for_prod
from .likes import Like
from datetime import datetime

class Post(db.Model):
    __tablename__ = 'posts'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    body = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    user = db.relationship('User', back_populates='posts')
    comments = db.relationship('Comment', back_populates='post', cascade='all, delete')
    likes = db.relationship('Like', back_populates='post', cascade='all, delete')

    def to_dict(self):
         return {
            'id': self.id,
            'user_id': self.user_id,
            'body': self.body,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user': self.user.to_dict() if self.user else None,
            'like_count': len(self.likes),
            'comment_count': len(self.comments),
        }

    def to_dict_basic(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'body': self.body,
            'image_url': self.image_url,
            'comment_count': len(self.comments)
        }
