from .db import db, environment, SCHEMA, add_prefix_for_prod
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime
from sqlalchemy.orm import foreign

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

    posts = db.relationship('Post', back_populates='user', cascade="all, delete-orphan")
    likes = db.relationship('Like', back_populates='user', cascade='all, delete')
    comments = db.relationship('Comment', back_populates='user', cascade='all, delete-orphan')

    sent_requests = db.relationship(
        'Friend',
        back_populates='requester',
        foreign_keys='Friend.requester_id',
        primaryjoin='User.id == foreign(Friend.requester_id)',
        cascade='all, delete-orphan'
    )

    received_requests = db.relationship(
        'Friend',
        back_populates='receiver',
        foreign_keys='Friend.receiver_id',
        primaryjoin='User.id == foreign(Friend.receiver_id)',
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
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'firstname': self.firstname,
            'lastname': self.lastname,
            'profile_img': self.profile_img,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
