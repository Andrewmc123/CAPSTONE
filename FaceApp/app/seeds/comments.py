from app.models import db, Comment, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime

def seed_comments():
    comment1 = Comment(
        post_id=1,
        user_id=2,
        content="Omg this filter is *fireee* 🔥🔥",
        created_at=datetime(2025, 7, 16, 10, 30),
        updated_at=datetime(2025, 7, 16, 10, 30)
    )

    comment2 = Comment(
        post_id=1,
        user_id=3,
        content="No wayy I was at that same spot 😭 I think I saw u lol",
        created_at=datetime(2025, 7, 16, 11, 5),
        updated_at=datetime(2025, 7, 16, 11, 5)
    )

    comment3 = Comment(
        post_id=2,
        user_id=4,
        content="Drop the location 👀 that backdrop is insane",
        created_at=datetime(2025, 7, 15, 18, 42),
        updated_at=datetime(2025, 7, 15, 18, 42)
    )

    comment4 = Comment(
        post_id=3,
        user_id=1,
        content="Bro this pic goes HARD 🔥 might set it as my wallpaper 😩",
        created_at=datetime(2025, 7, 14, 9, 12),
        updated_at=datetime(2025, 7, 14, 9, 12)
    )

    comment5 = Comment(
        post_id=1,
        user_id=1,
        content="This app lowkey makin everyone look ✨ flawless ✨",
        created_at=datetime(2025, 7, 14, 9, 12),
        updated_at=datetime(2025, 7, 14, 9, 12)
    )

    comment6 = Comment(
        post_id=2,
        user_id=5,
        content="SLAYED. that's it. that’s the comment 💅",
        created_at=datetime(2025, 7, 13, 15, 22),
        updated_at=datetime(2025, 7, 13, 15, 22)
    )

    comment7 = Comment(
        post_id=5,
        user_id=6,
        content="Giving ✨ main character ✨ energy",
        created_at=datetime(2025, 7, 12, 17, 41),
        updated_at=datetime(2025, 7, 12, 17, 41)
    )

    comment8 = Comment(
        post_id=4,
        user_id=3,
        content="okayyy faceapp you ate with this filter 🤖💯",
        created_at=datetime(2025, 7, 11, 20, 55),
        updated_at=datetime(2025, 7, 11, 20, 55)
    )

    db.session.add_all([
        comment1, comment2, comment3, comment4,
        comment5, comment6, comment7, comment8
    ])
    db.session.commit()

def undo_comments():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.comments RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM comments"))

    db.session.commit()
