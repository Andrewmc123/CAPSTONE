from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'

    VALID_TYPES = {
        'post_like',
        'post_comment',
        'comment_reply',
        'friend_request',
        'friend_request_accepted'
    }

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('posts.id')), nullable=True)
    comment_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('comments.id')), nullable=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    message = db.Column(db.String(255), nullable=True)
    link = db.Column(db.String(255), nullable=True)

    # Relationships
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_notifications')
    recipient = db.relationship('User', foreign_keys=[recipient_id], backref='received_notifications')
    post = db.relationship('Post', backref='notifications')
    comment = db.relationship('Comment', backref='notifications')

    def __init__(self, **kwargs):
        if kwargs.get('notification_type') not in self.VALID_TYPES:
            raise ValueError(f"Invalid notification type. Must be one of: {self.VALID_TYPES}")
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "recipient_id": self.recipient_id,
            "sender_id": self.sender_id,
            "notification_type": self.notification_type,
            "post_id": self.post_id,
            "comment_id": self.comment_id,
            "message": self.message or self.generate_message(),
            "link": self.link or self.generate_link(),
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "sender": self.sender.to_dict_basic() if self.sender else None
        }

    def generate_link(self):
        if self.post_id:
            return f"/posts/{self.post_id}"
        elif self.notification_type == 'friend_request':
            return "/friends/pending"
        elif self.notification_type == 'friend_request_accepted':
            return f"/users/{self.sender_id}"
        return "/"

    def generate_message(self):
        sender_name = self.sender.username if self.sender else "Someone"
        return {
            'post_like': f"{sender_name} liked your post",
            'post_comment': f"{sender_name} commented on your post",
            'comment_reply': f"{sender_name} replied to your comment",
            'friend_request': f"{sender_name} sent you a friend request",
            'friend_request_accepted': f"{sender_name} accepted your friend request"
        }.get(self.notification_type, "New notification")