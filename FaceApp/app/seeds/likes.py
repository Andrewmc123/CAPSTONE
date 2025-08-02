from app.models import db, Like, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime

def seed_likes():
    like1 = Like(user_id=2, post_id=1, created_at=datetime(2025, 7, 30, 15, 12))
    like2 = Like(user_id=3, post_id=1, created_at=datetime(2025, 7, 30, 15, 13))
    like3 = Like(user_id=1, post_id=2, created_at=datetime(2025, 7, 30, 16, 20))
    like4 = Like(user_id=4, post_id=3, created_at=datetime(2025, 7, 29, 11, 5))
    like5 = Like(user_id=2, post_id=4, created_at=datetime(2025, 7, 29, 12, 0))
    like6 = Like(user_id=1, post_id=4, created_at=datetime(2025, 7, 29, 12, 1))

    db.session.add_all([like1, like2, like3, like4, like5, like6])
    db.session.commit()

def undo_likes():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.likes RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM likes"))
    db.session.commit()
