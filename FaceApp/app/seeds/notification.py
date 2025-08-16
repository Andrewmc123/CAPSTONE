from app.models import db, Notification, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta
import random

def seed_notifications():
    # Clear existing notifications
    undo_notifications()
    
    # Get all user IDs (assuming 9 users from your seed data)
    user_ids = list(range(1, 10))  # IDs 1 through 9
    
    notifications = []
    
    # Generate post likes from random users
    for post_id in range(1, 21):  # Assuming 20 posts from your seed data
        likers = random.sample(user_ids, random.randint(1, 5))  # 1-5 random users like each post
        post_owner = random.choice(user_ids)
        
        for user_id in likers:
            if user_id != post_owner:  # Don't notify if liking own post
                time_offset = timedelta(
                    hours=random.randint(0, 24),
                    minutes=random.randint(0, 59)
                )
                notifications.append(Notification(
                    sender_id=user_id,
                    recipient_id=post_owner,
                    notification_type="post_like",
                    post_id=post_id,
                    created_at=datetime.utcnow() - time_offset
                ))
    
    # Generate comments and replies
    for comment_num in range(1, 21):  # 20 comment interactions
        commenter = random.choice(user_ids)
        post_id = random.randint(1, 20)
        post_owner = random.choice(user_ids)
        
        # Original comment notification
        if commenter != post_owner:
            time_offset = timedelta(
                hours=random.randint(0, 24),
                minutes=random.randint(0, 59)
            )
            notifications.append(Notification(
                sender_id=commenter,
                recipient_id=post_owner,
                notification_type="post_comment",
                post_id=post_id,
                comment_id=comment_num,
                created_at=datetime.utcnow() - time_offset
            ))
        
        # Generate some replies to comments
        if random.random() > 0.7:  # 30% chance of reply
            replier = random.choice([u for u in user_ids if u != commenter])
            time_offset = timedelta(
                minutes=random.randint(5, 120)
            )
            notifications.append(Notification(
                sender_id=replier,
                recipient_id=commenter,
                notification_type="comment_reply",
                post_id=post_id,
                comment_id=comment_num,
                created_at=datetime.utcnow() - time_offset
            ))
    
    # Generate friend requests
    for user_id in user_ids:
        # Each user sends 1-3 friend requests
        for _ in range(random.randint(1, 3)):
            recipient = random.choice([u for u in user_ids if u != user_id])
            time_offset = timedelta(
                days=random.randint(1, 7),
                hours=random.randint(0, 23)
            )
            notifications.append(Notification(
                sender_id=user_id,
                recipient_id=recipient,
                notification_type="friend_request",
                created_at=datetime.utcnow() - time_offset
            ))
            
            # 50% chance the request is accepted
            if random.random() > 0.5:
                accept_time = timedelta(
                    hours=random.randint(1, 72)
                )
                notifications.append(Notification(
                    sender_id=recipient,
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