from app.models import db, Like, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta
import random

def seed_likes():
    # Clear existing likes
    undo_likes()
    
    # Get all user IDs (assuming you have 9 users from your users seed)
    user_ids = list(range(1, 10))  # IDs 1 through 9
    
    # Create a dictionary to track likes per user
    user_likes_count = {user_id: 0 for user_id in user_ids}
    
    # Create likes ensuring each user has 1-10 likes
    likes = []
    post_id = 1  # Starting post ID
    
    while True:
        # Select a random user who has less than 10 likes
        available_users = [uid for uid in user_ids if user_likes_count[uid] < 10]
        if not available_users:
            break  # All users have at least 10 likes
            
        user_id = random.choice(available_users)
        
        # Generate random timestamp within past month
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
        post_id += 1  # Move to next post
        
        # Ensure each user has at least 1 like
        if all(count >= 1 for count in user_likes_count.values()):
            break  # Minimum requirement met
    
    # Now add additional random likes up to 10 per user
    for user_id in user_ids:
        remaining_likes = random.randint(0, 9 - user_likes_count[user_id])
        
        for _ in range(remaining_likes):
            time_offset = timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            created_at = datetime.utcnow() - time_offset
            
            likes.append(Like(
                user_id=user_id,
                post_id=random.randint(1, post_id-1),  # Like existing posts
                created_at=created_at
            ))
    
    db.session.add_all(likes)
    db.session.commit()

def undo_likes():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.likes RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM likes"))
    db.session.commit()