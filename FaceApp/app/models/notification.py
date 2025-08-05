from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    message = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(255), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    recipient = db.relationship('User', foreign_keys=[recipient_id], backref='notifications_received')
    sender = db.relationship('User', foreign_keys=[sender_id], backref='notifications_sent')

    def to_dict(self):
        return {
        'id': self.id,
        'recipient_id': self.recipient_id,
        'sender_id': self.sender_id,
        'message': self.message,
        'type': self.type,
        'is_read': self.is_read,
        'created_at': self.created_at.isoformat()
    }
