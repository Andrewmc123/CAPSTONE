from .db import db, environment, SCHEMA, add_prefix_for_prod
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime, timedelta
from app.gifts import (
    tier_for, GIFTS_UNLOCK_AURA,
    LIVE_24H_MIN_FOLLOWERS, LIVE_24H_MIN_AURA, FREE_GIFT_COOLDOWN_HOURS,
)

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
    bio = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Aura economy — Bolts (viewer coins), Glow (creator cashable), gift_aura
    # (clout earned from gifts received, added on top of likes).
    bolts = db.Column(db.Integer, default=500, nullable=False)
    glow = db.Column(db.Integer, default=0, nullable=False)
    gift_aura = db.Column(db.Integer, default=0, nullable=False)

    # Base/seeded follower count (added on top of real Follow rows) + the
    # daily-free-gift cooldown timestamp.
    extra_followers = db.Column(db.Integer, default=0, nullable=False)
    free_gift_used_at = db.Column(db.DateTime)

    # User settings — privacy, comment/message gates, activity visibility, and
    # per-type notification preferences (see resolved_notif_prefs()).
    is_private = db.Column(db.Boolean, default=False, nullable=False)
    allow_comments = db.Column(db.String(20), default='everyone', nullable=False)
    allow_messages = db.Column(db.String(20), default='everyone', nullable=False)
    show_activity = db.Column(db.Boolean, default=True, nullable=False)
    notif_prefs = db.Column(db.JSON)

    # Extended profile — shown in Settings › General
    city = db.Column(db.String(80))
    birthdate = db.Column(db.String(10))   # 'YYYY-MM-DD'
    address = db.Column(db.String(200))

    # Existing relationships
    posts = db.relationship('Post', back_populates='user', cascade="all, delete-orphan")
    stories = db.relationship('Story', back_populates='user', cascade="all, delete-orphan")
    likes = db.relationship('Like', back_populates='user', cascade='all, delete')
    comments = db.relationship('Comment', back_populates='user', cascade='all, delete-orphan')

    # Friend relationships (mutual "Friends" — like TikTok's Friends tab)
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

    # Follower graph (asymmetric, TikTok-style)
    following = db.relationship(
        'Follow',
        foreign_keys='Follow.follower_id',
        back_populates='follower',
        cascade='all, delete-orphan'
    )

    followers = db.relationship(
        'Follow',
        foreign_keys='Follow.followed_id',
        back_populates='followed',
        cascade='all, delete-orphan'
    )

    bookmarks = db.relationship('Bookmark', back_populates='user', cascade='all, delete-orphan')
    comment_likes = db.relationship('CommentLike', back_populates='user', cascade='all, delete-orphan')

    # Face-vault: people the user has taught + photos filed under them
    vault_people = db.relationship(
        'VaultPerson',
        back_populates='user',
        cascade='all, delete-orphan'
    )

    vault_photos = db.relationship(
        'VaultPhoto',
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

    def total_likes_received(self):
        return sum(len(post.likes) for post in self.posts)

    def aura_score(self):
        """Total Aura (clout) = likes received + Aura earned from gifts."""
        return self.total_likes_received() + (self.gift_aura or 0)

    def tier(self):
        return tier_for(self.aura_score())

    def gifts_unlocked(self):
        """A creator's lives accept gifts once they reach the Rising tier."""
        return self.aura_score() >= GIFTS_UNLOCK_AURA

    def follower_count(self):
        """Real followers plus any seeded/base followers."""
        return len(self.followers) + (self.extra_followers or 0)

    def active_stories(self):
        """Stories that haven't hit their 24h expiry yet."""
        now = datetime.utcnow()
        return [s for s in self.stories if s.expires_at and s.expires_at > now]

    def has_active_story(self):
        return len(self.active_stories()) > 0

    def can_24h_live(self):
        """24-hour live unlocks at enough followers AND enough Aura."""
        return (self.follower_count() >= LIVE_24H_MIN_FOLLOWERS
                and self.aura_score() >= LIVE_24H_MIN_AURA)

    def free_gift_ready(self):
        """Has this user's daily free gift recharged?"""
        if not self.free_gift_used_at:
            return True
        return datetime.utcnow() - self.free_gift_used_at >= timedelta(hours=FREE_GIFT_COOLDOWN_HOURS)

    def free_gift_resets_at(self):
        """ISO time the next free gift is available (None if ready now)."""
        if self.free_gift_ready() or not self.free_gift_used_at:
            return None
        return (self.free_gift_used_at + timedelta(hours=FREE_GIFT_COOLDOWN_HOURS)).isoformat()

    def resolved_notif_prefs(self):
        """Per-type notification prefs — every key defaults to True, with any
        stored overrides merged on top."""
        defaults = {
            'likes': True,
            'comments': True,
            'follows': True,
            'live': True,
            'mentions': True,
        }
        defaults.update(self.notif_prefs or {})
        return defaults

    def to_dict(self):
        # Collect accepted friends from both directions, de-duplicated by user
        # id. A friendship can be stored as two rows (sent + received) and the
        # seeds may add duplicate rows, so without this the same friend would be
        # counted many times (e.g. friends_count 40 for ~6 real friends).
        friends_by_id = {}

        for friend_request in self.friends_sent:
            other = friend_request.friend
            if friend_request.status == 'friends' and other and other.id != self.id:
                friends_by_id[other.id] = {
                    'id': other.id,
                    'username': other.username,
                    'profile_img': other.profile_img
                }

        for friend_request in self.friends_received:
            other = friend_request.user
            if friend_request.status == 'friends' and other and other.id != self.id:
                friends_by_id[other.id] = {
                    'id': other.id,
                    'username': other.username,
                    'profile_img': other.profile_img
                }

        accepted_friends = list(friends_by_id.values())

        likes = self.total_likes_received()
        aura = likes + (self.gift_aura or 0)
        tier = tier_for(aura)

        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'firstname': self.firstname,
            'lastname': self.lastname,
            'profile_img': self.profile_img,
            'bio': self.bio or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'friends': accepted_friends,
            'friends_count': len(accepted_friends),
            'followers_count': self.follower_count(),
            'following_count': len(self.following),
            'likes_received': likes,
            'aura': aura,
            'tier': tier['name'],
            'tier_key': tier['key'],
            'has_story': self.has_active_story(),
            'gifts_unlocked': aura >= GIFTS_UNLOCK_AURA,
            'can_24h_live': self.can_24h_live(),
            'free_gift_ready': self.free_gift_ready(),
            'free_gift_resets_at': self.free_gift_resets_at(),
            'bolts': self.bolts,
            'glow': self.glow,
            'video_count': len(self.posts),
            'vault_people_count': len(self.vault_people),
            'vault_photos_count': len(self.vault_photos),
            'is_private': self.is_private,
            'allow_comments': self.allow_comments,
            'allow_messages': self.allow_messages,
            'show_activity': self.show_activity,
            'notif_prefs': self.resolved_notif_prefs(),
            'city': self.city or '',
            'birthdate': self.birthdate or '',
            'address': self.address or '',
        }

    def to_dict_basic(self):
        return {
            'id': self.id,
            'username': self.username,
            'profile_img': self.profile_img,
            'firstname': self.firstname,
            'lastname': self.lastname,
            'bio': self.bio or '',
            'followers_count': self.follower_count(),
            'tier_key': self.tier()['key'],
        }
