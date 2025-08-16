from app.models import db, Comment, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta
import random

def seed_comments():
    undo_comments()
    
    # Sample trendy comments
    TRENDY_COMMENTS = [
        "This is fire! 🔥",
        "You snapped! 💯",
        "No way! I was there too! 😭",
        "Drop the location 👀",
        "This goes hard! 🚀",
        "SLAYED. 💅",
        "Main character energy ✨",
        "Filter game strong! 🤳",
        "I need this outfit! 👗",
        "Vibes immaculate 🌈"
    ]
    
    user_ids = list(range(1, 10))  # 9 users
    post_ids = list(range(1, 21))  # 20 posts
    
    comments = []
    
    # Generate 3-5 comments per post
    for post_id in post_ids:
        num_comments = random.randint(3, 5)
        commenters = random.sample(user_ids, num_comments)
        
        for i, user_id in enumerate(commenters):
            # Stagger comment times
            time_offset = timedelta(
                hours=random.randint(0, 24),
                minutes=random.randint(0, 59)
            )
            
            # Mix trendy comments with some custom ones
            if random.random() > 0.6:  # 40% custom comments
                body = random.choice([
                    f"Photo {i+1} goes crazy!",
                    f"User {user_id} popping in!",
                    "This reminds me of last summer",
                    "How did you get this shot?",
                    "The vibes are everything"
                ])
            else:
                body = random.choice(TRENDY_COMMENTS)
                
            comments.append(Comment(
                post_id=post_id,
                user_id=user_id,
                body=body,
                created_at=datetime.utcnow() - time_offset,
                updated_at=datetime.utcnow() - time_offset
            ))
    
    db.session.add_all(comments)
    db.session.commit()

def undo_comments():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.comments RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM comments"))
    db.session.commit()