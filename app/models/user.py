from .db import db, environment, SCHEMA, add_prefix_for_prod
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime

class User(db.Model, UserMixin):
    __tablename__ = 'users'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(40), nullable=False, unique=True)
    email = db.Column(db.String(255), nullable=False, unique=True)
    firstname = db.Column(db.String(30), nullable=False)
    lastname = db.Column(db.String(30), nullable=False)
    hashed_password = db.Column(db.String(255), nullable=False)
    profile_img = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Existing relationships
    posts = db.relationship('Post', back_populates='user', cascade="all, delete-orphan")
    likes = db.relationship('Like', back_populates='user', cascade='all, delete')
    comments = db.relationship('Comment', back_populates='user', cascade='all, delete-orphan')

    # Updated friend relationships (using user_id/friend_id instead of requester_id/receiver_id)
    friends_sent = db.relationship(
        'Friend',
        foreign_keys='Friend.user_id',
        back_populates='user',
        cascade='all, delete-orphan'
    )

    friends_received = db.relationship(
        'Friend',
        foreign_keys='Friend.friend_id',
        back_populates='friend',
        cascade='all, delete-orphan'
    )

    # NEW: Face encoding relationship (one-to-many: one user can have multiple face encodings)
    face_encodings = db.relationship(
        'FaceEncoding',
        back_populates='user',
        cascade='all, delete-orphan'
    )

    # NEW: Vault content relationship (one-to-many: one user can have multiple vault contents)
    vault_contents = db.relationship(
        'VaultContent',
        back_populates='user',
        cascade='all, delete-orphan'
    )

    @property
    def password(self):
        return self.hashed_password

    @password.setter
    def password(self, password):
        self.hashed_password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self):
        # Get accepted friends from both sent and received relationships
        accepted_friends = []
        
        # Check friends where this user sent the request and it was accepted
        for friend_request in self.friends_sent:
            if friend_request.status == 'friends':  # Changed from 'accepted' to 'friends'
                accepted_friends.append({
                    'id': friend_request.friend.id,
                    'username': friend_request.friend.username,
                    'profile_img': friend_request.friend.profile_img
                })
        
        # Check friends where this user received the request and it was accepted
        for friend_request in self.friends_received:
            if friend_request.status == 'friends':  # Changed from 'accepted' to 'friends'
                accepted_friends.append({
                    'id': friend_request.user.id,
                    'username': friend_request.user.username,
                    'profile_img': friend_request.user.profile_img
                })

        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'firstname': self.firstname,
            'lastname': self.lastname,
            'profile_img': self.profile_img,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'friends': accepted_friends,  # List of friend objects
            'friends_count': len(accepted_friends),  # Count of friends
            'face_encodings_count': len(self.face_encodings),
            'vault_contents_count': len(self.vault_contents)
        }

    def to_dict_basic(self):
        return {
            'id': self.id,
            'username': self.username,
            'profile_img': self.profile_img
        }