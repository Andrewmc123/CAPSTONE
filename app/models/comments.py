from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime

class Comment(db.Model):
    __tablename__ = 'comments'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('posts.id')), nullable=False)
    body = db.Column(db.Text, nullable=False)
    gif_url = db.Column(db.String)  # optional GIF attached to the comment
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    user = db.relationship('User', back_populates='comments')
    post = db.relationship('Post', back_populates='comments')
    comment_likes = db.relationship('CommentLike', back_populates='comment', cascade='all, delete')

    def to_dict(self, current_user_id=None):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "post_id": self.post_id,
            "body": self.body,
            "gif_url": self.gif_url,
            "like_count": len(self.comment_likes),
            "liked": any(cl.user_id == current_user_id for cl in self.comment_likes) if current_user_id else False,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "user": {
                "id": self.user.id,
                "username": self.user.username,
                "profile_img": self.user.profile_img
            }
        }
