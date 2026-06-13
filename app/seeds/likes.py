from app.models import db, Like, User, Post, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta
import random


def seed_likes():
    undo_likes()
    random.seed(13)

    user_ids = [u.id for u in User.query.all()]
    post_ids = [p.id for p in Post.query.all()]

    likes = []
    seen = set()
    # Every user hearts a healthy chunk of the feed (no duplicates)
    for user_id in user_ids:
        liked_posts = random.sample(post_ids, random.randint(6, min(16, len(post_ids))))
        for post_id in liked_posts:
            key = (user_id, post_id)
            if key in seen:
                continue
            seen.add(key)
            created_at = datetime.utcnow() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            likes.append(Like(
                user_id=user_id,
                post_id=post_id,
                created_at=created_at
            ))

    db.session.add_all(likes)
    db.session.commit()


def undo_likes():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.likes RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM likes"))
    db.session.commit()
