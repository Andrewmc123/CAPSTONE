from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class Group(db.Model):
    """A discussion group / topic with its own group chat (BLK-style).

    One leader, optional mods, up to MAX_MEMBERS members. Public groups anyone
    can join; private groups need an invite from the leader. `aura` is the
    group's popularity score (climbs with activity).
    """
    __tablename__ = 'groups'

    MAX_MEMBERS = 20

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(40), nullable=False, default='other')
    leader_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    is_public = db.Column(db.Boolean, default=True, nullable=False)
    aura = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    leader = db.relationship('User', foreign_keys=[leader_id])
    members = db.relationship('GroupMember', back_populates='group', cascade='all, delete-orphan')
    messages = db.relationship('GroupMessage', back_populates='group', cascade='all, delete-orphan')

    def role_of(self, user_id):
        if not user_id:
            return None
        for m in self.members:
            if m.user_id == user_id:
                return m.role
        return None

    def is_full(self):
        return len(self.members) >= self.MAX_MEMBERS

    def to_dict(self, current_user_id=None, with_members=False):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'leader_id': self.leader_id,
            'leader': self.leader.to_dict_basic() if self.leader else None,
            'is_public': self.is_public,
            'aura': self.aura or 0,
            'member_count': len(self.members),
            'max_members': self.MAX_MEMBERS,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'my_role': self.role_of(current_user_id),
        }
        if with_members:
            data['members'] = [m.to_dict() for m in sorted(
                self.members,
                key=lambda m: {'leader': 0, 'mod': 1, 'member': 2}.get(m.role, 3),
            )]
        return data


class GroupMember(db.Model):
    __tablename__ = 'group_members'

    if environment == "production":
        __table_args__ = (
            db.UniqueConstraint('group_id', 'user_id', name='uq_group_member'),
            {'schema': SCHEMA},
        )
    else:
        __table_args__ = (
            db.UniqueConstraint('group_id', 'user_id', name='uq_group_member'),
        )

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('groups.id')), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    role = db.Column(db.String(10), default='member', nullable=False)  # leader | mod | member
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    group = db.relationship('Group', back_populates='members')
    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role': self.role,
            'user': self.user.to_dict_basic() if self.user else None,
        }


class GroupMessage(db.Model):
    __tablename__ = 'group_messages'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('groups.id')), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    content = db.Column(db.Text)
    media_type = db.Column(db.String(10), default='text')  # text | gif | image | audio
    media_url = db.Column(db.String)
    is_pinned = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    group = db.relationship('Group', back_populates='messages')
    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'group_id': self.group_id,
            'user_id': self.user_id,
            'content': self.content,
            'media_type': self.media_type or 'text',
            'media_url': self.media_url,
            'is_pinned': bool(self.is_pinned),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': self.user.to_dict_basic() if self.user else None,
        }
