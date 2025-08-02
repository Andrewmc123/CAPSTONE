from app.models import db, Notification, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime

def seed_notifications():
    notif1 = Notification(
        sender_id=2,
        receiver_id=1,
        type="comment",
        message="Jay commented on your post 👀",
        is_read=False,
        created_at=datetime(2025, 7, 31, 14, 15)
    )

    notif2 = Notification(
        sender_id=3,
        receiver_id=1,
        type="like",
        message="Alex liked your post 💯",
        is_read=False,
        created_at=datetime(2025, 7, 31, 14, 16)
    )

    notif3 = Notification(
        sender_id=4,
        receiver_id=1,
        type="friend_request",
        message="Luna sent you a friend request ",
        is_read=False,
        created_at=datetime(2025, 7, 30, 20, 45)
    )

    db.session.add_all([notif1, notif2, notif3])
    db.session.commit()

def undo_notifications():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.notifications RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM notifications"))
    db.session.commit()
