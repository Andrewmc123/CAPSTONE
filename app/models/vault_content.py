from .db import db
from datetime import datetime

class VaultContent(db.Model):
    __tablename__ = 'vault_contents'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    face_encoding_id = db.Column(db.Integer, db.ForeignKey('face_encodings.id'), nullable=False)
    content_name = db.Column(db.String(255), nullable=False)
    content_data = db.Column(db.Text)  # or db.LargeBinary for binary data
    encrypted_data = db.Column(db.Text)  # if storing encrypted content
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - FIXED: Use unique backref names
    user = db.relationship('User', backref=db.backref('user_vault_contents', lazy=True))
    face_encoding = db.relationship('FaceEncoding', back_populates='vault_content')
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "face_encoding_id": self.face_encoding_id,
            "content_name": self.content_name,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }