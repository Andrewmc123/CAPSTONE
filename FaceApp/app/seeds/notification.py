from app.models import db, Notification, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta

def seed_notifications():
    # Clear existing notifications
    undo_notifications()
    
    notifications = [
        # Post likes
        Notification(
            sender_id=2,
            recipient_id=1,
            notification_type="post_like",
            post_id=1,
            created_at=datetime.utcnow() - timedelta(minutes=15)
        ),
        Notification(
            sender_id=3,
            recipient_id=1,
            notification_type="post_like",
            post_id=1,
            created_at=datetime.utcnow() - timedelta(hours=2)
        ),
        
        # Comments
        Notification(
            sender_id=4,
            recipient_id=1,
            notification_type="post_comment",
            post_id=2,
            comment_id=1,
            created_at=datetime.utcnow() - timedelta(hours=1)
        ),
        
        # Comment replies
        Notification(
            sender_id=5,
            recipient_id=1,
            notification_type="comment_reply",
            post_id=3,
            comment_id=2,
            created_at=datetime.utcnow() - timedelta(minutes=30)
        ),
        
        # Friend requests
        Notification(
            sender_id=6,
            recipient_id=1,
            notification_type="friend_request",
            created_at=datetime.utcnow() - timedelta(days=1)
        ),
        
        # Accepted requests
        Notification(
            sender_id=7,
            recipient_id=1,
            notification_type="friend_request_accepted",
            created_at=datetime.utcnow() - timedelta(days=2)
        )
    ]
    
    db.session.add_all(notifications)
    db.session.commit()

def undo_notifications():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.notifications RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM notifications"))
    db.session.commit()