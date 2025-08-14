from app.models import db, Like, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta
import random

def seed_likes():
    # I believe this is clearing existing likes first
    undo_likes()
    
    # Get all user IDs (assuming 9 users)
    user_ids = list(range(1, 10))  # IDs 1 through 9

    # Track how many likes each user has
    user_likes_count = {user_id: 0 for user_id in user_ids}

    # Fetch the max post ID to ensure we only like existing posts
    max_post_id = db.session.execute(text("SELECT MAX(id) FROM posts")).scalar() or 1

    likes = []

    # First, ensure each user has at least 1 like
    for user_id in user_ids:
        post_id = random.randint(1, max_post_id)
        time_offset = timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        created_at = datetime.utcnow() - time_offset

        likes.append(Like(
            user_id=user_id,
            post_id=post_id,
            created_at=created_at
        ))
        user_likes_count[user_id] += 1

    # Now add additional likes up to 10 per user
    for user_id in user_ids:
        max_additional = 10 - user_likes_count[user_id]
        # Only add if there's room for more likes
        if max_additional > 0:
            additional_likes = random.randint(0, max_additional)
            for _ in range(additional_likes):
                post_id = random.randint(1, max_post_id)
                time_offset = timedelta(
                    days=random.randint(0, 30),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
                created_at = datetime.utcnow() - time_offset

                likes.append(Like(
                    user_id=user_id,
                    post_id=post_id,
                    created_at=created_at
                ))
                user_likes_count[user_id] += 1

    # Commit all likes
    db.session.add_all(likes)
    db.session.commit()


def undo_likes():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.likes RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM likes"))
    db.session.commit()
