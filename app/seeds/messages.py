from app.models import db, Message, User, Post, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta
import random


# A few believable back-and-forth DM lines for the demo experience.
SAMPLE_LINES = [
    "yo that last post was unreal",
    "wait how did you film that transition??",
    "collab this weekend?",
    "sending you the sound i used",
    "omg stop you're too talented",
    "did you see the duet i made",
    "lmk when you post next",
    "this is going viral i'm calling it",
    "ty ty means a lot",
    "haha appreciate you fr",
    "ok new video idea — hear me out",
    "let's gooo",
]


def seed_messages():
    """Seed 1:1 DM threads between the demo user and a few other creators."""
    undo_messages()
    random.seed(7)

    demo = User.query.filter_by(username='demo').first()
    if not demo:
        return
    others = [u for u in User.query.all() if u.id != demo.id]
    if not others:
        return

    partners = random.sample(others, min(5, len(others)))
    post_ids = [p.id for p in Post.query.limit(20).all()]

    messages = []
    for partner in partners:
        n = random.randint(3, 7)
        base = datetime.utcnow() - timedelta(days=random.randint(1, 6))
        for i in range(n):
            sender, recipient = (demo, partner) if i % 2 == 0 else (partner, demo)
            ts = base + timedelta(minutes=i * random.randint(3, 90))
            share = bool(post_ids) and random.random() < 0.25  # sometimes share a video
            messages.append(Message(
                sender_id=sender.id,
                recipient_id=recipient.id,
                content=None if share else random.choice(SAMPLE_LINES),
                post_id=random.choice(post_ids) if share else None,
                # leave the most recent incoming message unread for a demo badge
                is_read=not (recipient.id == demo.id and i == n - 1),
                created_at=ts,
                updated_at=ts,
            ))

    db.session.add_all(messages)
    db.session.commit()


def undo_messages():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.messages RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM messages"))

    db.session.commit()
