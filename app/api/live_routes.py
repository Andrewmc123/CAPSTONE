"""
Live API — TikTok-style live sessions: go live, join (max 10 viewers), near-live
video frames, live chat, and host moderation (mute chat, kick, report).
"""
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timedelta
from sqlalchemy import or_

from app.models import db, User, LiveSession, LiveViewer, LiveMessage, LiveReport
from app.gifts import (
    gift_by_key, GIFTS_UNLOCK_AURA, FREE_GIFT_KEY, FREE_GIFT_COOLDOWN_HOURS,
    LIVE_24H_HOURS, LIVE_24H_REWARDS,
)

live_routes = Blueprint('live', __name__)


def top_supporters(session, limit=3):
    """Rank a session's gifters by Bolts actually spent (the paid "top subs").
    Free daily gifts contribute 0 Bolts, so they can't farm the reward board."""
    tally = {}
    for m in session.messages:
        if not m.gift_key:
            continue
        gift = gift_by_key(m.gift_key)
        if not gift:
            continue
        spent = 0 if m.free else gift['bolts']
        row = tally.setdefault(m.user_id, {
            'user_id': m.user_id,
            'user': m.user.to_dict_basic() if m.user else None,
            'aura': 0,
            'bolts': 0,
            'gifts': 0,
        })
        row['aura'] += gift['aura']
        row['bolts'] += spent
        row['gifts'] += 1
    ranked = sorted(tally.values(), key=lambda r: (r['bolts'], r['aura']), reverse=True)
    return ranked[:limit]


def finalize_live(session, mark_ended=True):
    """End a session and, for a 24h live, pay its top supporters their Bolts
    thank-you — exactly once (guarded by rewards_paid). Returns the recap or None."""
    recap = None
    if session.is_24h and not session.rewards_paid:
        host = session.host
        winners = [w for w in top_supporters(session, len(LIVE_24H_REWARDS)) if w['bolts'] > 0]
        rewarded = []
        for i, sup in enumerate(winners):
            reward = LIVE_24H_REWARDS[i]
            u = User.query.get(sup['user_id'])
            if u:
                u.bolts = (u.bolts or 0) + reward
            rewarded.append({'user': sup['user'], 'aura': sup['aura'], 'bolts': sup['bolts'], 'reward': reward})
        session.rewards_paid = True
        recap = {
            'aura_gained': max(0, host.aura_score() - (session.start_aura or 0)) if host else 0,
            'followers_gained': max(0, host.follower_count() - (session.start_followers or 0)) if host else 0,
            'peak_viewers': session.peak_viewers or 0,
            'rewarded': rewarded,
        }
    if mark_ended:
        session.is_live = False
        if not session.ended_at:
            session.ended_at = datetime.utcnow()
    return recap


@live_routes.route('/active')
def active_lives():
    """All currently-live sessions for the discovery grid (public)."""
    sessions = LiveSession.query.filter_by(is_live=True)\
        .order_by(LiveSession.created_at.desc()).all()
    return jsonify({'sessions': [s.to_dict() for s in sessions]})


@live_routes.route('/start', methods=['POST'])
@login_required
def start_live():
    """Start a new live broadcast (ends any existing one by this host first).
    Pass is_24h=true for a 24-hour live — gated behind followers + Aura."""
    data = request.get_json() or {}
    is_24h = bool(data.get('is_24h'))
    if is_24h and not current_user.can_24h_live():
        return jsonify({'error': '24-hour live unlocks at 2,000 followers and 10,000 Aura',
                        'locked': True}), 403

    LiveSession.query.filter_by(host_id=current_user.id, is_live=True)\
        .update({'is_live': False, 'ended_at': datetime.utcnow()})
    session = LiveSession(
        host_id=current_user.id,
        title=(data.get('title') or '').strip()[:120] or f"{current_user.username} is live",
        is_24h=is_24h,
        ends_at=datetime.utcnow() + timedelta(hours=LIVE_24H_HOURS) if is_24h else None,
        start_aura=current_user.aura_score() if is_24h else 0,
        start_followers=current_user.follower_count() if is_24h else 0,
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
    # Auto-close a 24h live whose countdown has run out (pays rewards once).
    if s.is_live and s.is_24h and s.ends_at and datetime.utcnow() >= s.ends_at:
        finalize_live(s, mark_ended=True)
        db.session.commit()
    return jsonify({
        **s.to_dict(include_frame=True),
        'is_host': s.host_id == current_user.id,
        'viewers': [v.to_dict() for v in s.active_viewers()],
        'messages': [m.to_dict() for m in s.messages[-50:]],
        'top_supporters': top_supporters(s) if s.is_24h else [],
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
    # Track the max concurrent viewers reached during the stream.
    count = len(s.active_viewers())
    if count > (s.peak_viewers or 0):
        s.peak_viewers = count
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
    if not s.is_live:
        # Already ended — never re-run the reward payout.
        return jsonify({'ok': True, 'recap': None})

    recap = finalize_live(s, mark_ended=True)
    db.session.commit()
    return jsonify({'ok': True, 'recap': recap})


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


@live_routes.route('/<int:session_id>/gift', methods=['POST'])
@login_required
def send_gift(session_id):
    """Send a gift to the host: spends the sender's Bolts, credits the host Glow
    (their tier's share) + Aura, and drops an animated message in the chat.
    Gated — the host must have unlocked gifts (Rising tier)."""
    s = LiveSession.query.get(session_id)
    if not s or not s.is_live:
        return jsonify({'error': 'Live has ended'}), 404
    host = s.host
    if not host or host.id == current_user.id:
        return jsonify({'error': "You can't gift your own live"}), 400

    gift = gift_by_key((request.get_json() or {}).get('gift_key'))
    if not gift:
        return jsonify({'error': 'Unknown gift'}), 400

    if host.aura_score() < GIFTS_UNLOCK_AURA:
        return jsonify({'error': f"@{host.username} unlocks gifts at "
                                 f"{GIFTS_UNLOCK_AURA:,} Aura"}), 403
    # The daily free gift (one entry-level gift every 24h) spends no Bolts and
    # credits the host Aura only — never Glow, so it can't be farmed for cash.
    # Claim it with an atomic conditional UPDATE so racing requests can't both
    # take the free path.
    now = datetime.utcnow()
    is_free = False
    if gift['key'] == FREE_GIFT_KEY:
        cutoff = now - timedelta(hours=FREE_GIFT_COOLDOWN_HOURS)
        claimed = User.query.filter(
            User.id == current_user.id,
            or_(User.free_gift_used_at.is_(None), User.free_gift_used_at <= cutoff),
        ).update({User.free_gift_used_at: now}, synchronize_session=False)
        if claimed == 1:
            is_free = True
            current_user.free_gift_used_at = now   # reflect for the response

    if not is_free and (current_user.bolts or 0) < gift['bolts']:
        return jsonify({'error': 'Not enough Bolts', 'need_bolts': True}), 402

    host.gift_aura = (host.gift_aura or 0) + gift['aura']
    if not is_free:
        current_user.bolts -= gift['bolts']
        host.glow = (host.glow or 0) + round(gift['bolts'] * host.tier()['share'])

    msg = LiveMessage(
        session_id=session_id,
        user_id=current_user.id,
        content=f"sent {gift['name']}",
        gift_key=gift['key'],
        free=is_free,
    )
    db.session.add(msg)
    db.session.commit()

    return jsonify({
        'message': msg.to_dict(),
        'gift': gift,
        'free': is_free,
        'bolts': current_user.bolts,
        'free_gift_ready': current_user.free_gift_ready(),
        'free_gift_resets_at': current_user.free_gift_resets_at(),
        'host_aura': host.aura_score(),
    }), 201


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
