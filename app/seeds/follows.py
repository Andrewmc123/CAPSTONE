from app.models import db, Follow, User, Notification, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta
import random


def seed_follows():
    """Build the follower graph — every user follows a handful of creators."""
    undo_follows()
    random.seed(42)

    user_ids = [u.id for u in User.query.all()]

    follows = []
    seen = set()
    for follower_id in user_ids:
        others = [uid for uid in user_ids if uid != follower_id]
        for followed_id in random.sample(others, random.randint(4, min(9, len(others)))):
            key = (follower_id, followed_id)
            if key in seen:
                continue
            seen.add(key)
            created = datetime.utcnow() - timedelta(days=random.randint(0, 60))
            follows.append(Follow(
                follower_id=follower_id,
                followed_id=followed_id,
                created_at=created,
            ))

    db.session.add_all(follows)
    db.session.commit()

    # A few "started following you" notifications for the demo user
    demo = User.query.filter_by(username='demo').first()
    if demo:
        recent = Follow.query.filter_by(followed_id=demo.id).all()[:3]
        for f in recent:
            db.session.add(Notification(
                recipient_id=demo.id,
                sender_id=f.follower_id,
                notification_type='new_follower',
                is_read=False,
                message=f'{f.follower.username} started following you',
                created_at=f.created_at,
            ))
        db.session.commit()


def undo_follows():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.follows RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM follows"))

    db.session.commit()
