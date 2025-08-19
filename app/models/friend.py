from .db import db, environment, SCHEMA, add_prefix_for_prod
from sqlalchemy import CheckConstraint
from datetime import datetime
from flask_login import current_user

class Friend(db.Model):
    __tablename__ = 'friends'

    if environment == "production":
        __table_args__ = (
            CheckConstraint("status IN ('friends', 'pending')", name="check_status_valid"),
            {'schema': SCHEMA}
        )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    friend_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    status = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    user = db.relationship('User', foreign_keys=[user_id])
    friend = db.relationship('User', foreign_keys=[friend_id])

    def to_dict(self, current_user_id=None):
        # Use provided current_user_id or fallback logic
        if current_user_id is not None:
            if self.user_id == current_user_id:
                other_user = self.friend
            else:
                other_user = self.user
        else:
            # Fallback: just return the friend side (user who received request)
            other_user = self.friend

        return {
            'id': self.id,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'friend': {
                'id': other_user.id,
                'username': other_user.username,
                'firstname': other_user.firstname,
                'lastname': other_user.lastname,
                'profile_img': other_user.profile_img
            }
        }