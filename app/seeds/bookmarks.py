from app.models import db, Bookmark, User, Post, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta
import random


def seed_bookmarks():
    """Everyone saves a few favorites."""
    undo_bookmarks()
    random.seed(7)

    user_ids = [u.id for u in User.query.all()]
    post_ids = [p.id for p in Post.query.all()]

    bookmarks = []
    seen = set()
    for user_id in user_ids:
        for post_id in random.sample(post_ids, random.randint(3, min(8, len(post_ids)))):
            key = (user_id, post_id)
            if key in seen:
                continue
            seen.add(key)
            bookmarks.append(Bookmark(
                user_id=user_id,
                post_id=post_id,
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            ))

    db.session.add_all(bookmarks)
    db.session.commit()


def undo_bookmarks():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.bookmarks RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM bookmarks"))

    db.session.commit()
