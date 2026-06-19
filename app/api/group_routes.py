"""
Network groups API — BLK-style discussion groups with a group chat.

Roles: leader (creator) > mod > member. Public groups anyone can join; private
groups require an invite. `aura` is the group's popularity, nudged up by chatter.
"""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.models import db, Group, GroupMember, GroupMessage

group_routes = Blueprint('groups', __name__)


def _role(group, user_id):
    return group.role_of(user_id)


def _can_moderate(group, user_id):
    return _role(group, user_id) in ('leader', 'mod')


@group_routes.route('/')
def list_groups():
    """All groups, optionally filtered by ?category=, hottest (most aura) first."""
    q = Group.query
    category = request.args.get('category')
    if category and category != 'all':
        q = q.filter(Group.category == category)
    groups = q.order_by(Group.aura.desc(), Group.id.desc()).all()
    uid = current_user.id if current_user.is_authenticated else None
    return jsonify({'groups': [g.to_dict(uid) for g in groups]})


@group_routes.route('/', methods=['POST'])
@login_required
def create_group():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Give your discussion a title'}), 400
    try:
        group = Group(
            name=name[:120],
            description=(data.get('description') or '').strip() or None,
            category=(data.get('category') or 'other').strip() or 'other',
            leader_id=current_user.id,
            is_public=bool(data.get('is_public', True)),
            aura=0,
        )
        db.session.add(group)
        db.session.flush()
        db.session.add(GroupMember(group_id=group.id, user_id=current_user.id, role='leader'))
        db.session.commit()
        return jsonify(group.to_dict(current_user.id, with_members=True)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@group_routes.route('/<int:group_id>')
def get_group(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    uid = current_user.id if current_user.is_authenticated else None
    return jsonify(group.to_dict(uid, with_members=True))


@group_routes.route('/<int:group_id>/messages')
def get_messages(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    # private groups only reveal chat to members
    uid = current_user.id if current_user.is_authenticated else None
    if not group.is_public and not _role(group, uid):
        return jsonify({'error': 'This group is private — you need an invite from the leader', 'private': True}), 403
    msgs = GroupMessage.query.filter_by(group_id=group_id).order_by(GroupMessage.created_at.asc()).all()
    return jsonify({'messages': [m.to_dict() for m in msgs]})


@group_routes.route('/<int:group_id>/messages', methods=['POST'])
@login_required
def post_message(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    if not _role(group, current_user.id):
        return jsonify({'error': 'Join the group to chat'}), 403
    data = request.get_json() or {}
    content = (data.get('content') or '').strip()
    media_url = (data.get('media_url') or '').strip() or None
    media_type = data.get('media_type') or 'text'
    if not content and not media_url:
        return jsonify({'error': 'Empty message'}), 400
    msg = GroupMessage(
        group_id=group_id,
        user_id=current_user.id,
        content=content or None,
        media_type=media_type,
        media_url=media_url,
    )
    group.aura = (group.aura or 0) + 1  # chatter raises the group's aura
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201


@group_routes.route('/<int:group_id>/join', methods=['POST'])
@login_required
def join_group(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    if _role(group, current_user.id):
        return jsonify(group.to_dict(current_user.id, with_members=True))
    if not group.is_public:
        return jsonify({'error': 'This group is private — ask the leader for an invite', 'private': True}), 403
    if group.is_full():
        return jsonify({'error': f'This group is full ({group.MAX_MEMBERS} max)'}), 400
    db.session.add(GroupMember(group_id=group_id, user_id=current_user.id, role='member'))
    group.aura = (group.aura or 0) + 2
    db.session.commit()
    return jsonify(group.to_dict(current_user.id, with_members=True))


@group_routes.route('/<int:group_id>/leave', methods=['POST'])
@login_required
def leave_group(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    mem = GroupMember.query.filter_by(group_id=group_id, user_id=current_user.id).first()
    if not mem:
        return jsonify({'message': 'Not a member'})
    if mem.role == 'leader':
        return jsonify({'error': 'The leader can delete the group but not leave it'}), 400
    db.session.delete(mem)
    db.session.commit()
    return jsonify({'message': 'Left group'})


# ---------- leader / mod controls ----------

@group_routes.route('/<int:group_id>/messages/<int:message_id>', methods=['DELETE'])
@login_required
def delete_message(group_id, message_id):
    group = Group.query.get(group_id)
    msg = GroupMessage.query.get(message_id)
    if not group or not msg or msg.group_id != group_id:
        return jsonify({'error': 'Not found'}), 404
    # author can delete their own; leader/mod can delete any
    if msg.user_id != current_user.id and not _can_moderate(group, current_user.id):
        return jsonify({'error': 'Not allowed'}), 403
    db.session.delete(msg)
    db.session.commit()
    return jsonify({'id': message_id})


@group_routes.route('/<int:group_id>/members/<int:user_id>/promote', methods=['POST'])
@login_required
def promote_member(group_id, user_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    if _role(group, current_user.id) != 'leader':
        return jsonify({'error': 'Only the leader can promote mods'}), 403
    mem = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
    if not mem:
        return jsonify({'error': 'Member not found'}), 404
    mem.role = 'member' if mem.role == 'mod' else 'mod'  # toggle
    db.session.commit()
    return jsonify(mem.to_dict())


@group_routes.route('/<int:group_id>/members/<int:user_id>', methods=['DELETE'])
@login_required
def kick_member(group_id, user_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    if not _can_moderate(group, current_user.id):
        return jsonify({'error': 'Only leaders/mods can remove members'}), 403
    mem = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
    if not mem:
        return jsonify({'error': 'Member not found'}), 404
    if mem.role == 'leader':
        return jsonify({'error': "You can't remove the leader"}), 400
    db.session.delete(mem)
    db.session.commit()
    return jsonify({'user_id': user_id})


@group_routes.route('/<int:group_id>', methods=['DELETE'])
@login_required
def delete_group(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    if _role(group, current_user.id) != 'leader':
        return jsonify({'error': 'Only the leader can delete this group'}), 403
    db.session.delete(group)
    db.session.commit()
    return jsonify({'id': group_id})


@group_routes.route('/<int:group_id>/invite', methods=['POST'])
@login_required
def invite_member(group_id):
    """Leader/mod adds a friend straight into the group (used for private groups)."""
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    if not _can_moderate(group, current_user.id):
        return jsonify({'error': 'Only leaders/mods can invite'}), 403
    data = request.get_json() or {}
    uid = data.get('user_id')
    if not uid:
        return jsonify({'error': 'user_id required'}), 400
    if GroupMember.query.filter_by(group_id=group_id, user_id=uid).first():
        return jsonify({'message': 'Already a member'})
    if group.is_full():
        return jsonify({'error': f'Group is full ({group.MAX_MEMBERS} max)'}), 400
    db.session.add(GroupMember(group_id=group_id, user_id=uid, role='member'))
    db.session.commit()
    return jsonify(group.to_dict(current_user.id, with_members=True))
