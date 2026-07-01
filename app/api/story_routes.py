"""Stories API — ephemeral posts that auto-expire after 24 hours.

Expiry is enforced two ways: every read filters to `expires_at > now`, and each
request opportunistically purges rows that are already expired, so a story is
effectively gone the moment it turns 24h old (no cron needed).
"""
from datetime import datetime
from flask import Blueprint, request
from flask_login import login_required, current_user

from ..models import db, Story

story_routes = Blueprint('stories', __name__)


def _purge_expired():
    try:
        Story.query.filter(Story.expires_at <= datetime.utcnow()).delete(synchronize_session=False)
        db.session.commit()
    except Exception:
        db.session.rollback()


@story_routes.route('/user/<int:user_id>', methods=['GET'])
@login_required
def user_stories(user_id):
    """Active (non-expired) stories for one user, oldest first (reel order)."""
    _purge_expired()
    stories = (Story.query
               .filter(Story.user_id == user_id, Story.expires_at > datetime.utcnow())
               .order_by(Story.created_at.asc())
               .all())
    return {'stories': [s.to_dict() for s in stories]}


@story_routes.route('', methods=['POST'])
@story_routes.route('/', methods=['POST'])
@login_required
def create_story():
    """Post a story. Body: { media_url, media_type, caption }."""
    data = request.get_json() or {}
    media_url = (data.get('media_url') or '').strip()
    if not media_url:
        return {'error': 'A photo or video is required'}, 400

    now = datetime.utcnow()
    story = Story(
        user_id=current_user.id,
        media_url=media_url,
        media_type='video' if data.get('media_type') == 'video' else 'image',
        caption=(data.get('caption') or '')[:200],
        created_at=now,
        expires_at=Story.expiry_from(now),
    )
    db.session.add(story)
    db.session.commit()
    return story.to_dict(), 201


@story_routes.route('/<int:story_id>', methods=['DELETE'])
@login_required
def delete_story(story_id):
    story = Story.query.get(story_id)
    if not story:
        return {'error': 'Not found'}, 404
    if story.user_id != current_user.id:
        return {'error': 'Forbidden'}, 403
    db.session.delete(story)
    db.session.commit()
    return {'id': story_id}
