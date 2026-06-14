from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class ProfileVisit(db.Model):
    """One row per (visitor, profile) pair, refreshed on each visit — powers
    the 'who viewed your profile' list."""
    __tablename__ = 'profile_visits'

    if environment == "production":
        __table_args__ = (
            db.UniqueConstraint('visitor_id', 'profile_id', name='uq_visitor_profile'),
            {'schema': SCHEMA},
        )
    else:
        __table_args__ = (
            db.UniqueConstraint('visitor_id', 'profile_id', name='uq_visitor_profile'),
        )

    id = db.Column(db.Integer, primary_key=True)
    visitor_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    profile_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    visitor = db.relationship('User', foreign_keys=[visitor_id], backref='profile_visits_made')
    profile = db.relationship('User', foreign_keys=[profile_id], backref='profile_visits_received')

    def to_dict(self):
        return {
            'id': self.id,
            'visitor_id': self.visitor_id,
            'profile_id': self.profile_id,
            'visited_at': self.updated_at.isoformat() if self.updated_at else None,
            'visitor': self.visitor.to_dict_basic() if self.visitor else None,
        }
