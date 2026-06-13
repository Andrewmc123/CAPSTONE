from .db import db, environment, SCHEMA, add_prefix_for_prod
from .likes import Like
from datetime import datetime
import json
import re


class Post(db.Model):
    __tablename__ = 'posts'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    body = db.Column(db.Text, nullable=False)            # caption (may contain #hashtags)
    image_url = db.Column(db.String)                     # poster / thumbnail / gif url
    video_url = db.Column(db.String)                     # main video source
    media_type = db.Column(db.String(10), default='image')  # 'video' | 'image' | 'gif'
    sound_name = db.Column(db.String(120))               # display name of the sound
    sound_url = db.Column(db.String)                     # audio track mixed over the video
    views = db.Column(db.Integer, default=0)
    shares = db.Column(db.Integer, default=0)
    edit_data = db.Column(db.Text)                       # JSON: filters, trim, speed, text overlays
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    user = db.relationship('User', back_populates='posts')
    comments = db.relationship('Comment', back_populates='post', cascade='all, delete')
    likes = db.relationship('Like', back_populates='post', cascade='all, delete')
    bookmarks = db.relationship('Bookmark', back_populates='post', cascade='all, delete')

    @property
    def hashtags(self):
        return re.findall(r'#(\w+)', self.body or '')

    def parsed_edit_data(self):
        if not self.edit_data:
            return None
        try:
            return json.loads(self.edit_data)
        except (ValueError, TypeError):
            return None

    def to_dict(self, current_user_id=None):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'body': self.body,
            'image_url': self.image_url,
            'video_url': self.video_url,
            'media_type': self.media_type or 'image',
            'sound_name': self.sound_name,
            'sound_url': self.sound_url,
            'views': self.views or 0,
            'shares': self.shares or 0,
            'edit_data': self.parsed_edit_data(),
            'hashtags': self.hashtags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user': self.user.to_dict_basic() if self.user else None,
            'like_count': len(self.likes),
            'comment_count': len(self.comments),
            'bookmark_count': len(self.bookmarks),
            'liked': any(l.user_id == current_user_id for l in self.likes) if current_user_id else False,
            'bookmarked': any(b.user_id == current_user_id for b in self.bookmarks) if current_user_id else False,
        }

    def to_dict_basic(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'body': self.body,
            'image_url': self.image_url,
            'video_url': self.video_url,
            'media_type': self.media_type or 'image',
            'views': self.views or 0,
            'like_count': len(self.likes),
            'comment_count': len(self.comments),
        }
