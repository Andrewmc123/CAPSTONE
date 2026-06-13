from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class Bookmark(db.Model):
    __tablename__ = 'bookmarks'

    if environment == "production":
        __table_args__ = (
            db.UniqueConstraint('user_id', 'post_id', name='uq_user_post_bookmark'),
            {'schema': SCHEMA},
        )
    else:
        __table_args__ = (
            db.UniqueConstraint('user_id', 'post_id', name='uq_user_post_bookmark'),
        )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('posts.id')), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', back_populates='bookmarks')
    post = db.relationship('Post', back_populates='bookmarks')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'post_id': self.post_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
