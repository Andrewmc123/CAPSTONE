from app.models import db, Friend, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime

def seed_friends():
    friend1 = Friend(
        user_id=1,
        friend_id=2,
        status='friends',
        created_at=datetime(2025, 7, 10, 14, 30),
        updated_at=datetime(2025, 7, 10, 14, 30)
    )  # OG FaceApp duo 😎📸

    friend2 = Friend(
        user_id=4,
        friend_id=5,
        status='friends',
        created_at=datetime(2025, 7, 11, 9, 15),
        updated_at=datetime(2025, 7, 11, 9, 15)
    )  # met in comments, now BFFs 💬❤️

    friend3 = Friend(
        user_id=3,
        friend_id=1,
        status='friends',
        created_at=datetime(2025, 7, 12, 18, 45),
        updated_at=datetime(2025, 7, 12, 18, 45)
    )  # filter twins 👯‍♀️✨

    friend4 = Friend(
        user_id=4,
        friend_id=6,
        status='friends',
        created_at=datetime(2025, 7, 13, 20, 0),
        updated_at=datetime(2025, 7, 13, 20, 0)
    )  # added after a 🔥 story collab

    friend5 = Friend(
        user_id=2,
        friend_id=3,
        status='friends',
        created_at=datetime(2025, 7, 13, 20, 0),
        updated_at=datetime(2025, 7, 13, 20, 0)
    )  # duo challenge kings 👑📷

    friend6 = Friend(
        user_id=5,
        friend_id=6,
        status='friends',
        created_at=datetime(2025, 7, 13, 20, 0),
        updated_at=datetime(2025, 7, 13, 20, 0)
    )  # made a filter trend together 🧃🎨

    friend7 = Friend(
        user_id=1,
        friend_id=4,
        status='friends',
        created_at=datetime(2025, 7, 10, 20, 0),
        updated_at=datetime(2025, 7, 10, 20, 0)
    )  # saw them in explore, hit add ✨

    friend8 = Friend(
        user_id=1,
        friend_id=5,
        status='friends',
        created_at=datetime(2025, 7, 11, 20, 0),
        updated_at=datetime(2025, 7, 11, 20, 0)
    )  # collab coming soon 👀

    # Incoming friend requests 🚨
    friend9 = Friend(
        user_id=6,
        friend_id=1,
        status='pending',
        created_at=datetime(2025, 7, 12, 20, 0),
        updated_at=datetime(2025, 7, 12, 20, 0)
    )  # added after fire comment 🔥

    friend10 = Friend(
        user_id=7,
        friend_id=1,
        status='pending',
        created_at=datetime(2025, 7, 12, 20, 0),
        updated_at=datetime(2025, 7, 12, 20, 0)
    )  # “Let’s start a streak?” 📸🔥

    friend11 = Friend(
        user_id=8,
        friend_id=1,
        status='pending',
        created_at=datetime(2025, 7, 12, 20, 0),
        updated_at=datetime(2025, 7, 12, 20, 0)
    )  # saw your pic, HAD to add 🫶

    friend12 = Friend(
        user_id=9,
        friend_id=1,
        status='pending',
        created_at=datetime(2025, 7, 12, 20, 0),
        updated_at=datetime(2025, 7, 12, 20, 0)
    )  # “Bro this app is wild, be my friend 😂”

    db.session.add_all([
        friend1, friend2, friend3, friend4, friend5, friend6,
        friend7, friend8, friend9, friend10, friend11, friend12
    ])
    db.session.commit()

def undo_friends():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.friends RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM friends"))

    db.session.commit()
