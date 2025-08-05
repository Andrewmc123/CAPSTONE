from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime

class Friend(db.Model):
    __tablename__ = 'friends'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = db.relationship(
        'User',
        foreign_keys=[requester_id],
        back_populates='sent_requests'
    )

    receiver = db.relationship(
        'User',
        foreign_keys=[receiver_id],
        back_populates='received_requests'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'requester_id': self.requester_id,
            'receiver_id': self.receiver_id,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'requester': self.requester.to_dict() if self.requester else None,
            'receiver': self.receiver.to_dict() if self.receiver else None
        }
