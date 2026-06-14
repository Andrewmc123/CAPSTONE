from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class LiveSession(db.Model):
    """A TikTok-style live broadcast hosted by one user."""
    __tablename__ = 'live_sessions'

    MAX_VIEWERS = 10

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    host_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    title = db.Column(db.String(120))
    is_live = db.Column(db.Boolean, default=True, nullable=False)
    chat_enabled = db.Column(db.Boolean, default=True, nullable=False)
    current_frame = db.Column(db.Text)          # latest webcam frame (data URL) for near-live video
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime)

    host = db.relationship('User', backref='live_sessions')
    viewers = db.relationship('LiveViewer', back_populates='session', cascade='all, delete-orphan')
    messages = db.relationship('LiveMessage', back_populates='session', cascade='all, delete-orphan')

    def active_viewers(self):
        return [v for v in self.viewers if not v.is_banned]

    def to_dict(self, include_frame=False):
        data = {
            'id': self.id,
            'host_id': self.host_id,
            'title': self.title,
            'is_live': self.is_live,
            'chat_enabled': self.chat_enabled,
            'viewer_count': len(self.active_viewers()),
            'max_viewers': self.MAX_VIEWERS,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'host': self.host.to_dict_basic() if self.host else None,
        }
        if include_frame:
            data['current_frame'] = self.current_frame
        return data


class LiveViewer(db.Model):
    __tablename__ = 'live_viewers'

    if environment == "production":
        __table_args__ = (
            db.UniqueConstraint('session_id', 'user_id', name='uq_live_viewer'),
            {'schema': SCHEMA},
        )
    else:
        __table_args__ = (
            db.UniqueConstraint('session_id', 'user_id', name='uq_live_viewer'),
        )

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('live_sessions.id')), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    is_banned = db.Column(db.Boolean, default=False, nullable=False)   # set when the host kicks them
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    session = db.relationship('LiveSession', back_populates='viewers')
    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'is_banned': self.is_banned,
            'user': self.user.to_dict_basic() if self.user else None,
        }


class LiveMessage(db.Model):
    __tablename__ = 'live_messages'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('live_sessions.id')), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    content = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    session = db.relationship('LiveSession', back_populates='messages')
    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': self.user.to_dict_basic() if self.user else None,
        }


class LiveReport(db.Model):
    __tablename__ = 'live_reports'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('live_sessions.id')), nullable=False)
    reporter_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    reported_user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    reason = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
