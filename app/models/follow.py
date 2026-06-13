from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class Follow(db.Model):
    __tablename__ = 'follows'

    if environment == "production":
        __table_args__ = (
            db.UniqueConstraint('follower_id', 'followed_id', name='uq_follower_followed'),
            {'schema': SCHEMA},
        )
    else:
        __table_args__ = (
            db.UniqueConstraint('follower_id', 'followed_id', name='uq_follower_followed'),
        )

    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    followed_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    follower = db.relationship('User', foreign_keys=[follower_id], back_populates='following')
    followed = db.relationship('User', foreign_keys=[followed_id], back_populates='followers')

    def to_dict(self):
        return {
            'id': self.id,
            'follower_id': self.follower_id,
            'followed_id': self.followed_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'follower': self.follower.to_dict_basic() if self.follower else None,
            'followed': self.followed.to_dict_basic() if self.followed else None,
        }
