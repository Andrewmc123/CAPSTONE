from app.models import db, Comment, CommentLike, Post, User, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta
import random

TRENDY_COMMENTS = [
    "This is fire! 🔥",
    "You snapped! 💯",
    "No way! I was there too! 😭",
    "Drop the location 👀",
    "This goes hard! 🚀",
    "OKAYY PERIOD. 💅",
    "Main character energy ✨",
    "The transition?? CLEAN 😮‍💨",
    "watched this 14 times and counting",
    "Vibes immaculate BRO 😭",
    "That party looks crazyyyyy!!",
    "LOL WHERE WAS I !!",
    "this is why I open ABLN every morning",
    "sound name?? I need it 🎵",
    "teach me this PLEASE",
    "nahhh this one's going viral 📈",
    "the way I RAN to the comments",
    "petition to make this the app intro",
    "POV: you found the best side of ABLN",
    "screaming crying throwing confetti 🎉",
]

# Verified Tenor CDN GIF reactions (mirrors the curated picker library)
REACTION_GIFS = [
    "https://media.tenor.com/K15sk3AFCL0AAAAC/laughing-laughing-hysterically.gif",
    "https://media.tenor.com/BmCbsCskdA4AAAAC/omg-oh-my-god.gif",
    "https://media.tenor.com/q4a9EWnUPQcAAAAC/glass-red-heart-fire.gif",
    "https://media.tenor.com/wqAMgX_ZBM8AAAAC/lit-content.gif",
    "https://media.tenor.com/c5aQbgiFfz4AAAAC/friday-happydance.gif",
    "https://media.tenor.com/RyWAaP5mSwIAAAAC/table-mess-lmao.gif",
    "https://media.tenor.com/IpTsTettfjAAAAAC/love-i-love-you.gif",
    "https://media.tenor.com/U-DLoCq_anoAAAAC/ace-ventura-pet-detective-ace-ventura.gif",
]

GIF_COMMENT_CAPTIONS = ["", "literally me", "my exact reaction", "POV: me watching this", "no words needed", ""]


def seed_comments():
    undo_comments()
    random.seed(2026)

    user_ids = [u.id for u in User.query.all()]
    post_ids = [p.id for p in Post.query.all()]

    comments = []
    for post_id in post_ids:
        num_comments = random.randint(3, 7)
        commenters = random.sample(user_ids, min(num_comments, len(user_ids)))

        for user_id in commenters:
            time_offset = timedelta(
                days=random.randint(0, 5),
                hours=random.randint(0, 24),
                minutes=random.randint(0, 59)
            )
            created = datetime.utcnow() - time_offset

            # ~25% of comments are GIF reactions — GIFs are the ABLN love language
            if random.random() < 0.25:
                comments.append(Comment(
                    post_id=post_id,
                    user_id=user_id,
                    body=random.choice(GIF_COMMENT_CAPTIONS),
                    gif_url=random.choice(REACTION_GIFS),
                    created_at=created,
                    updated_at=created
                ))
            else:
                comments.append(Comment(
                    post_id=post_id,
                    user_id=user_id,
                    body=random.choice(TRENDY_COMMENTS),
                    created_at=created,
                    updated_at=created
                ))

    db.session.add_all(comments)
    db.session.commit()

    # Sprinkle comment likes (TikTok-style hearted comments)
    comment_likes = []
    seen = set()
    for comment in Comment.query.all():
        for user_id in random.sample(user_ids, random.randint(0, min(5, len(user_ids)))):
            key = (user_id, comment.id)
            if key not in seen and user_id != comment.user_id:
                seen.add(key)
                comment_likes.append(CommentLike(user_id=user_id, comment_id=comment.id))

    db.session.add_all(comment_likes)
    db.session.commit()


def undo_comments():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.comment_likes RESTART IDENTITY CASCADE;")
        db.session.execute(f"TRUNCATE table {SCHEMA}.comments RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM comment_likes"))
        db.session.execute(text("DELETE FROM notifications WHERE comment_id IS NOT NULL"))
        db.session.execute(text("DELETE FROM comments"))

    db.session.commit()
