from app.models import db, Friend, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime

def seed_friends():
    friend1 = Friend(
        requester_id=1,
        receiver_id=2,
        status='friends',
        created_at=datetime(2025, 7, 10, 14, 30),
        updated_at=datetime(2025, 7, 10, 14, 30)
    )  # OG FaceApp duo 😎📸

    friend2 = Friend(
        requester_id=4,
        receiver_id=5,
        status='friends',
        created_at=datetime(2025, 7, 11, 9, 15),
        updated_at=datetime(2025, 7, 11, 9, 15)
    )  # met in comments, now BFFs 💬❤️

    friend3 = Friend(
        requester_id=3,
        receiver_id=1,
        status='friends',
        created_at=datetime(2025, 7, 12, 18, 45),
        updated_at=datetime(2025, 7, 12, 18, 45)
    )  # filter twins 👯‍♀️✨

    friend4 = Friend(
        requester_id=4,
        receiver_id=6,
        status='friends',
        created_at=datetime(2025, 7, 13, 20, 0),
        updated_at=datetime(2025, 7, 13, 20, 0)
    )  # added after a 🔥 story collab

    friend5 = Friend(
        requester_id=2,
        receiver_id=3,
        status='friends',
        created_at=datetime(2025, 7, 13, 20, 0),
        updated_at=datetime(2025, 7, 13, 20, 0)
    )  # duo challenge kings 👑📷

    friend6 = Friend(
        requester_id=5,
        receiver_id=6,
        status='friends',
        created_at=datetime(2025, 7, 13, 20, 0),
        updated_at=datetime(2025, 7, 13, 20, 0)
    )  # made a filter trend together 🧃🎨

    friend7 = Friend(
        requester_id=1,
      receiver_id=4,
        status='friends',
        created_at=datetime(2025, 7, 10, 20, 0),
        updated_at=datetime(2025, 7, 10, 20, 0)
    )  # saw them in explore, hit add ✨

    friend8 = Friend(
       requester_id=1,
       receiver_id=5,
        status='friends',
        created_at=datetime(2025, 7, 11, 20, 0),
        updated_at=datetime(2025, 7, 11, 20, 0)
    )  # collab coming soon 👀

    # Incoming friend requests 🚨
    friend9 = Friend(
       requester_id=6,
       receiver_id=1,
        status='pending',
        created_at=datetime(2025, 7, 12, 20, 0),
        updated_at=datetime(2025, 7, 12, 20, 0)
    )  # added after fire comment 🔥

    friend10 = Friend(
       requester_id=7,
       receiver_id=1,
        status='pending',
        created_at=datetime(2025, 7, 12, 20, 0),
        updated_at=datetime(2025, 7, 12, 20, 0)
    )  # “Let’s start a streak?” 📸🔥

    friend11 = Friend(
        requester_id=8,
        receiver_id=1,
        status='pending',
        created_at=datetime(2025, 7, 12, 20, 0),
        updated_at=datetime(2025, 7, 12, 20, 0)
    )  # saw your pic, HAD to add 🫶

    friend12 = Friend(
        requester_id=9,
        receiver_id=1,
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
