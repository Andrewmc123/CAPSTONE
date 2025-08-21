from app.models import db, Notification, Comment, Post, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta
import random

def seed_notifications():
    # Clear existing notifications
    undo_notifications()
    
    # Fetch all user IDs and posts
    user_ids = list(db.session.execute("SELECT id FROM users").scalars())
    posts = db.session.execute("SELECT id, user_id FROM posts").all()
    comments = Comment.query.all()  # Use actual seeded comments

    notifications = []

 
    for post_id, post_owner in posts:
        likers = random.sample(user_ids, random.randint(1, min(5, len(user_ids))))
        for liker_id in likers:
            if liker_id != post_owner:
                time_offset = timedelta(
                    hours=random.randint(0, 24),
                    minutes=random.randint(0, 59)
                )
                notifications.append(Notification(
                    sender_id=liker_id,
                    recipient_id=post_owner,
                    notification_type="post_like",
                    post_id=post_id,
                    created_at=datetime.utcnow() - time_offset
                ))

   
    for comment in comments:
        commenter_id = comment.user_id
        post_owner_id = comment.post.user_id if hasattr(comment, 'post') else random.choice(user_ids)

        # Original comment notification
        if commenter_id != post_owner_id:
            time_offset = timedelta(
                hours=random.randint(0, 24),
                minutes=random.randint(0, 59)
            )
            notifications.append(Notification(
                sender_id=commenter_id,
                recipient_id=post_owner_id,
                notification_type="post_comment",
                post_id=comment.post_id,
                comment_id=comment.id,
                created_at=datetime.utcnow() - time_offset
            ))

        # 30% chance of a reply
        if random.random() > 0.7:
            replier_id = random.choice([u for u in user_ids if u != commenter_id])
            time_offset = timedelta(minutes=random.randint(5, 120))
            notifications.append(Notification(
                sender_id=replier_id,
                recipient_id=commenter_id,
                notification_type="comment_reply",
                post_id=comment.post_id,
                comment_id=comment.id,
                created_at=datetime.utcnow() - time_offset
            ))

    #  Friend requests
    for user_id in user_ids:
        for _ in range(random.randint(1, 3)):
            recipient_id = random.choice([u for u in user_ids if u != user_id])
            time_offset = timedelta(days=random.randint(1, 7), hours=random.randint(0, 23))
            notifications.append(Notification(
                sender_id=user_id,
                recipient_id=recipient_id,
                notification_type="friend_request",
                created_at=datetime.utcnow() - time_offset
            ))

            # 50% chance of acceptance
            if random.random() > 0.5:
                accept_time = timedelta(hours=random.randint(1, 72))
                notifications.append(Notification(
                    sender_id=recipient_id,
                    recipient_id=user_id,
                    notification_type="friend_request_accepted",
                    created_at=datetime.utcnow() - time_offset - accept_time
                ))

    # Add all notifications at once
    db.session.add_all(notifications)
    db.session.commit()

def undo_notifications():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.notifications RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM notifications"))
    db.session.commit()
