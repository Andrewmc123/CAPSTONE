from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime
from enum import Enum

class FriendStatus(Enum):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    DECLINED = 'declined'
    BLOCKED = 'blocked'

class Friend(db.Model):
    __tablename__ = 'friends'

    if environment == "production":
        __table_args__ = (
            {'schema': SCHEMA},
            db.CheckConstraint(
                "status IN ('pending', 'accepted', 'declined', 'blocked')",
                name='check_status_values'
            ),
            db.CheckConstraint(
                "pending IN (TRUE, FALSE)",
                name='check_pending_boolean'
            ),
            db.UniqueConstraint(
                'requester_id', 'receiver_id',
                name='unique_friendship'
            )
        )
    else:
        __table_args__ = (
            db.CheckConstraint(
                "status IN ('pending', 'accepted', 'declined', 'blocked')",
                name='check_status_values'
            ),
            db.CheckConstraint(
                "pending IN (TRUE, FALSE)",
                name='check_pending_boolean'
            ),
            db.UniqueConstraint(
                'requester_id', 'receiver_id',
                name='unique_friendship'
            )
        )

    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(
        db.Integer, 
        db.ForeignKey(add_prefix_for_prod('users.id')), 
        nullable=False
    )
    receiver_id = db.Column(
        db.Integer, 
        db.ForeignKey(add_prefix_for_prod('users.id')), 
        nullable=False
    )
    status = db.Column(
        db.Enum(FriendStatus),
        nullable=False,
        default=FriendStatus.PENDING
    )
    pending = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        server_default='true'
    )
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

    def __init__(self, **kwargs):
        super(Friend, self).__init__(**kwargs)
        if isinstance(self.status, str):
            self.status = FriendStatus(self.status)
        if 'pending' not in kwargs:
            self.pending = self.status == FriendStatus.PENDING

    def to_dict(self):
        return {
            'id': self.id,
            'requester_id': self.requester_id,
            'receiver_id': self.receiver_id,
            'status': self.status.value if self.status else None,
            'pending': self.pending,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'requester': self.requester.to_dict() if self.requester else None,
            'receiver': self.receiver.to_dict() if self.receiver else None
        }
