"""
Direct Messages API — TikTok-style 1:1 private chat between users.
A message can carry text, a shared video (post_id), or both.
"""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from sqlalchemy import or_, and_

from app.models import db, Message, User, Post

message_routes = Blueprint('messages', __name__)


@message_routes.route('/conversations')
@login_required
def get_conversations():
    """
    One row per person the current user has exchanged DMs with: the most
    recent message in that thread plus how many of their messages to me
    are still unread. Newest conversation first.
    """
    me = current_user.id
    msgs = Message.query.filter(
        or_(Message.sender_id == me, Message.recipient_id == me)
    ).order_by(Message.created_at.desc()).all()

    convos = {}
    for m in msgs:
        other = m.recipient_id if m.sender_id == me else m.sender_id
        if other not in convos:
            partner = m.recipient if m.sender_id == me else m.sender
            convos[other] = {
                'user': partner.to_dict_basic() if partner else None,
                'last_message': m.to_dict(),
                'unread_count': 0,
            }
        if m.recipient_id == me and not m.is_read:
            convos[other]['unread_count'] += 1

    return jsonify({
        'conversations': list(convos.values()),
        'unread_total': sum(c['unread_count'] for c in convos.values()),
    })


@message_routes.route('/unread_count')
@login_required
def unread_count():
    """Total unread DMs for the nav badge."""
    count = Message.query.filter(
        Message.recipient_id == current_user.id,
        Message.is_read.is_(False),
    ).count()
    return jsonify({'unread_total': count})


@message_routes.route('/<int:user_id>')
@login_required
def get_thread(user_id):
    """
    Full 1:1 thread between the current user and user_id (oldest -> newest).
    Marks the other user's messages to me as read on open.
    """
    me = current_user.id
    other = User.query.get(user_id)
    if not other:
        return jsonify({'error': 'User not found'}), 404

    msgs = Message.query.filter(
        or_(
            and_(Message.sender_id == me, Message.recipient_id == user_id),
            and_(Message.sender_id == user_id, Message.recipient_id == me),
        )
    ).order_by(Message.created_at.asc()).all()

    unread = [m for m in msgs if m.recipient_id == me and not m.is_read]
    if unread:
        for m in unread:
            m.is_read = True
        db.session.commit()

    return jsonify({
        'user': other.to_dict_basic(),
        'messages': [m.to_dict() for m in msgs],
    })


@message_routes.route('/<int:user_id>', methods=['POST'])
@login_required
def send_message(user_id):
    """Send a DM (text and/or a shared video) to user_id."""
    me = current_user.id
    if user_id == me:
        return jsonify({'error': "You can't message yourself"}), 400

    other = User.query.get(user_id)
    if not other:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    content = (data.get('content') or '').strip()
    post_id = data.get('post_id')

    if not content and not post_id:
        return jsonify({'error': 'Message cannot be empty'}), 400
    if post_id and not Post.query.get(post_id):
        return jsonify({'error': 'Shared post not found'}), 404

    try:
        msg = Message(
            sender_id=me,
            recipient_id=user_id,
            content=content or None,
            post_id=post_id,
        )
        db.session.add(msg)
        db.session.commit()
        return jsonify(msg.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@message_routes.route('/message/<int:message_id>', methods=['DELETE'])
@login_required
def delete_message(message_id):
    """Delete a message you sent."""
    msg = Message.query.get(message_id)
    if not msg:
        return jsonify({'error': 'Message not found'}), 404
    if msg.sender_id != current_user.id:
        return jsonify({'error': 'Not allowed'}), 403
    db.session.delete(msg)
    db.session.commit()
    return jsonify({'id': message_id})


@message_routes.route('/clear', methods=['DELETE'])
@login_required
def clear_messages():
    """Delete every DM the current user has sent or received (clear all chats)."""
    me = current_user.id
    Message.query.filter(
        or_(Message.sender_id == me, Message.recipient_id == me)
    ).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'ok': True})
