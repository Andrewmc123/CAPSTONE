from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime
import json


class VaultPerson(db.Model):
    """A face the user has taught the app, stored under a name they choose.
    Holds one or more 128-float face descriptors (from face-api.js) used to
    recognize this person in future photos."""
    __tablename__ = 'vault_people'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    descriptors = db.Column(db.Text, nullable=False, default='[]')   # JSON: list of 128-float arrays
    cover_image = db.Column(db.String(500))                          # sample face thumbnail url
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', back_populates='vault_people')
    photos = db.relationship('VaultPhoto', back_populates='person', cascade='all, delete-orphan')

    def descriptor_list(self):
        try:
            return json.loads(self.descriptors) or []
        except (ValueError, TypeError):
            return []

    def to_dict(self, with_descriptors=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'cover_image': self.cover_image,
            'photo_count': len(self.photos),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if with_descriptors:
            data['descriptors'] = self.descriptor_list()
        return data
