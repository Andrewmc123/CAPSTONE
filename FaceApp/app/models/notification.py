from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # 'post_like', 'post_comment', 'friend_request', etc.
    post_id = db.Column(db.Integer, nullable=True)
    comment_id = db.Column(db.Integer, nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship('User', foreign_keys=[sender_id])
    recipient = db.relationship('User', foreign_keys=[recipient_id])

    def to_dict(self):
        return {
            'id': self.id,
            'sender': {
                'id': self.sender.id,
                'username': self.sender.username,
                'profile_img': self.sender.profile_img
            },
            'recipient_id': self.recipient_id,
            'message': self.generate_message(),
            'link': self.generate_link(),
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }

    def generate_link(self):
        if self.post_id:
            return f"/posts/{self.post_id}"
        return "#"

    def generate_message(self):
        messages = {
            'post_like': f"{self.sender.username} liked your post",
            'post_comment': f"{self.sender.username} commented on your post",
            'friend_request': f"{self.sender.username} sent you a friend request",
            'friend_request_accepted': f"{self.sender.username} accepted your friend request"
        }
        return messages.get(self.notification_type, "New notification")