"""
Live API — TikTok-style live sessions: go live, join (max 10 viewers), near-live
video frames, live chat, and host moderation (mute chat, kick, report).
"""
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime

from app.models import db, LiveSession, LiveViewer, LiveMessage, LiveReport

live_routes = Blueprint('live', __name__)


@live_routes.route('/active')
def active_lives():
    """All currently-live sessions for the discovery grid (public)."""
    sessions = LiveSession.query.filter_by(is_live=True)\
        .order_by(LiveSession.created_at.desc()).all()
    return jsonify({'sessions': [s.to_dict() for s in sessions]})


@live_routes.route('/start', methods=['POST'])
@login_required
def start_live():
    """Start a new live broadcast (ends any existing one by this host first)."""
    LiveSession.query.filter_by(host_id=current_user.id, is_live=True)\
        .update({'is_live': False, 'ended_at': datetime.utcnow()})
    data = request.get_json() or {}
    session = LiveSession(
        host_id=current_user.id,
        title=(data.get('title') or '').strip()[:120] or f"{current_user.username} is live",
    )
    db.session.add(session)
    db.session.commit()
    return jsonify(session.to_dict()), 201


@live_routes.route('/<int:session_id>')
@login_required
def get_live(session_id):
    """Full state for a live room — host, viewers, chat, and latest frame."""
    s = LiveSession.query.get(session_id)
    if not s:
        return jsonify({'error': 'Live not found'}), 404
    return jsonify({
        **s.to_dict(include_frame=True),
        'is_host': s.host_id == current_user.id,
        'viewers': [v.to_dict() for v in s.active_viewers()],
        'messages': [m.to_dict() for m in s.messages[-50:]],
    })


@live_routes.route('/<int:session_id>/join', methods=['POST'])
@login_required
def join_live(session_id):
    s = LiveSession.query.get(session_id)
    if not s or not s.is_live:
        return jsonify({'error': 'Live has ended'}), 404
    if s.host_id == current_user.id:
        return jsonify({'ok': True, 'host': True})

    viewer = LiveViewer.query.filter_by(session_id=session_id, user_id=current_user.id).first()
    if viewer and viewer.is_banned:
        return jsonify({'error': 'You were removed from this live'}), 403
    if not viewer:
        if len(s.active_viewers()) >= LiveSession.MAX_VIEWERS:
            return jsonify({'error': f'This live is full ({LiveSession.MAX_VIEWERS} viewers max)'}), 403
        db.session.add(LiveViewer(session_id=session_id, user_id=current_user.id))
        db.session.commit()
    return jsonify({'ok': True})


@live_routes.route('/<int:session_id>/leave', methods=['POST'])
@login_required
def leave_live(session_id):
    LiveViewer.query.filter_by(
        session_id=session_id, user_id=current_user.id, is_banned=False).delete()
    db.session.commit()
    return jsonify({'ok': True})


@live_routes.route('/<int:session_id>/end', methods=['POST'])
@login_required
def end_live(session_id):
    s = LiveSession.query.get(session_id)
    if not s:
        return jsonify({'error': 'Live not found'}), 404
    if s.host_id != current_user.id:
        return jsonify({'error': 'Only the host can end the live'}), 403
    s.is_live = False
    s.ended_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'ok': True})


@live_routes.route('/<int:session_id>/frame', methods=['POST'])
@login_required
def update_frame(session_id):
    """Host pushes its latest webcam frame (data URL) for viewers to poll."""
    s = LiveSession.query.get(session_id)
    if not s or s.host_id != current_user.id:
        return jsonify({'error': 'Not the host'}), 403
    s.current_frame = (request.get_json() or {}).get('frame')
    db.session.commit()
    return jsonify({'ok': True})


@live_routes.route('/<int:session_id>/chat', methods=['POST'])
@login_required
def post_chat(session_id):
    s = LiveSession.query.get(session_id)
    if not s or not s.is_live:
        return jsonify({'error': 'Live has ended'}), 404
    if not s.chat_enabled and s.host_id != current_user.id:
        return jsonify({'error': 'Chat is turned off'}), 403
    content = ((request.get_json() or {}).get('content') or '').strip()[:500]
    if not content:
        return jsonify({'error': 'Empty message'}), 400
    msg = LiveMessage(session_id=session_id, user_id=current_user.id, content=content)
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201


@live_routes.route('/<int:session_id>/chat/toggle', methods=['POST'])
@login_required
def toggle_chat(session_id):
    """Host mutes / unmutes the whole chat."""
    s = LiveSession.query.get(session_id)
    if not s or s.host_id != current_user.id:
        return jsonify({'error': 'Not the host'}), 403
    s.chat_enabled = not s.chat_enabled
    db.session.commit()
    return jsonify({'chat_enabled': s.chat_enabled})


@live_routes.route('/<int:session_id>/kick', methods=['POST'])
@login_required
def kick_viewer(session_id):
    """Host removes a viewer and blocks them from rejoining."""
    s = LiveSession.query.get(session_id)
    if not s or s.host_id != current_user.id:
        return jsonify({'error': 'Not the host'}), 403
    user_id = (request.get_json() or {}).get('user_id')
    viewer = LiveViewer.query.filter_by(session_id=session_id, user_id=user_id).first()
    if viewer:
        viewer.is_banned = True
        db.session.commit()
    return jsonify({'ok': True})


@live_routes.route('/<int:session_id>/report', methods=['POST'])
@login_required
def report_user(session_id):
    """Report a viewer or the host."""
    s = LiveSession.query.get(session_id)
    if not s:
        return jsonify({'error': 'Live not found'}), 404
    data = request.get_json() or {}
    db.session.add(LiveReport(
        session_id=session_id,
        reporter_id=current_user.id,
        reported_user_id=data.get('user_id'),
        reason=(data.get('reason') or '').strip()[:255] or None,
    ))
    db.session.commit()
    return jsonify({'ok': True})
