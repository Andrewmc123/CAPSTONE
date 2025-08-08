from app.models import db, User, environment, SCHEMA
from sqlalchemy.sql import text


# Adds a demo user, you can add other users here if you want
def seed_users():
    users = [
        User(username="demo", email="demo@aa.io", password="password", firstname="Demo", lastname="User"),
        User(username="queenShoy99", email="sho@aa.io", password="password", firstname="Shoy", lastname="Queen"),
        User(username="astro_boi", email="astro@aa.io", password="password", firstname="Astro", lastname="Boi"),
        User(username="John_Rangers21", email="jr21@aa.io", password="password", firstname="John", lastname="Rangers"),
        User(username="nightcrawler", email="crawl@aa.io", password="password", firstname="Night", lastname="Crawler"),
        User(username="pixiepop", email="pixie@aa.io", password="password", firstname="Pixie", lastname="Pop"),
        User(username="fitking", email="fit@aa.io", password="password", firstname="Fit", lastname="King"),
        User(username="dnd_lord", email="dnd@aa.io", password="password", firstname="Dnd", lastname="Lord"),
        User(username="plantmom", email="plant@aa.io", password="password", firstname="Plant", lastname="Mom"),
    ]

    db.session.add_all(users)
    db.session.commit()


# Uses a raw SQL query to TRUNCATE or DELETE the users table. SQLAlchemy doesn't
# have a built in function to do this. With postgres in production TRUNCATE
# removes all the data from the table, and RESET IDENTITY resets the auto
# incrementing primary key, CASCADE deletes any dependent entities.  With
# sqlite3 in development you need to instead use DELETE to remove all data and
# it will reset the primary keys for you as well.
def undo_users():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.users RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM users"))
        
    db.session.commit()
