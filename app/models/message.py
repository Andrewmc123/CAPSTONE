from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class Message(db.Model):
    """A 1:1 direct message between two users. Optionally carries a shared
    post (video), mirroring TikTok's "send a video in a DM" feature."""
    __tablename__ = 'messages'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    content = db.Column(db.String(2000), nullable=True)            # text body (null when only sharing a video)
    post_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('posts.id')), nullable=True)  # shared video
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    recipient = db.relationship('User', foreign_keys=[recipient_id], backref='received_messages')
    post = db.relationship('Post', backref='shared_in_messages')

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
            'content': self.content,
            'post_id': self.post_id,
            'shared_post': self.post.to_dict_basic() if self.post else None,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'sender': self.sender.to_dict_basic() if self.sender else None,
        }
