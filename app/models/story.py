from datetime import datetime, timedelta
from .db import db, environment, SCHEMA, add_prefix_for_prod

STORY_TTL_HOURS = 24


class Story(db.Model):
    """An ephemeral post that auto-expires 24 hours after it's created."""
    __tablename__ = 'stories'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    media_url = db.Column(db.String, nullable=False)
    media_type = db.Column(db.String(10), default='image')  # 'image' | 'video'
    caption = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

    user = db.relationship('User', back_populates='stories')

    @staticmethod
    def expiry_from(when=None):
        return (when or datetime.utcnow()) + timedelta(hours=STORY_TTL_HOURS)

    def is_active(self):
        return bool(self.expires_at and self.expires_at > datetime.utcnow())

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'media_url': self.media_url,
            'media_type': self.media_type or 'image',
            'caption': self.caption or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'user': self.user.to_dict_basic() if self.user else None,
        }
