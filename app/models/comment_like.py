from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class CommentLike(db.Model):
    __tablename__ = 'comment_likes'

    if environment == "production":
        __table_args__ = (
            db.UniqueConstraint('user_id', 'comment_id', name='uq_user_comment_like'),
            {'schema': SCHEMA},
        )
    else:
        __table_args__ = (
            db.UniqueConstraint('user_id', 'comment_id', name='uq_user_comment_like'),
        )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    comment_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('comments.id')), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', back_populates='comment_likes')
    comment = db.relationship('Comment', back_populates='comment_likes')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'comment_id': self.comment_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
