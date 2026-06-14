from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class VaultPhoto(db.Model):
    """A saved/taken photo filed under a recognized person. A group photo is
    stored once per recognized person so it appears in each friend's gallery."""
    __tablename__ = 'vault_photos'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    person_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('vault_people.id')), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', back_populates='vault_photos')
    person = db.relationship('VaultPerson', back_populates='photos')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'person_id': self.person_id,
            'image_url': self.image_url,
            'caption': self.caption,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
