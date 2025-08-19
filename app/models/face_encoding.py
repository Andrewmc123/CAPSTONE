from .db import db
from datetime import datetime

class FaceEncoding(db.Model):
    __tablename__ = 'face_encodings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    encoding = db.Column(db.PickleType, nullable=False)  # Stores numpy array
    sample_image = db.Column(db.String(255))  # Path to sample image
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # User relationship - FIXED: Match the User model's relationship name
    # Use backref='encoding_user' to match the User model's backref
    user = db.relationship('User', backref=db.backref('user_face_encodings', lazy=True, cascade='all, delete-orphan'))
    
    vault_content = db.relationship(
        "VaultContent", 
        back_populates="face_encoding",
        uselist=False
        )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "sample_image": self.sample_image,
            "created_at": self.created_at.isoformat()
        }