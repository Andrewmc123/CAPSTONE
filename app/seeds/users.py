from app.models import db, User, environment, SCHEMA
from sqlalchemy.sql import text

def seed_users():
    users_data = [
        {"username":"demo", "email":"demo@aa.io", "password":"password", "firstname":"Demo", "lastname":"User", "profile_img":"/images/demo.jpg"},
        {"username":"queenShoy99", "email":"sho@aa.io", "password":"password", "firstname":"Shoy", "lastname":"Queen", "profile_img":"/images/shoyface.jpg"},
        {"username":"astro_boi", "email":"astro@aa.io", "password":"password", "firstname":"Astro", "lastname":"Boi", "profile_img":"/images/astro.jpg"},
        {"username":"John_Rangers21", "email":"jr21@aa.io", "password":"password", "firstname":"John", "lastname":"Rangers", "profile_img":"/images/kermit.jpg"},
        {"username":"nightcrawler", "email":"crawl@aa.io", "password":"password", "firstname":"Night", "lastname":"Crawler", "profile_img":"/images/johnwhick.jpg"},
        {"username":"pixiepop", "email":"pixie@aa.io", "password":"password", "firstname":"Pixie", "lastname":"Pop", "profile_img":"/images/girl2.jpg"},
        {"username":"fitking", "email":"fit@aa.io", "password":"password", "firstname":"Fit", "lastname":"King", "profile_img":"/images/fitking.jpg"},
        {"username":"dnd_lord", "email":"dnd@aa.io", "password":"password", "firstname":"Dnd", "lastname":"Lord", "profile_img":"/images/stinkface.jpg"},
        {"username":"plantmom", "email":"plant@aa.io", "password":"password", "firstname":"Plant", "lastname":"Mom", "profile_img":"/images/animephoto.jpg"},
    ]

    for u in users_data:
        existing_user = User.query.filter_by(email=u["email"]).first()
        if not existing_user:
            user = User(**u)
            db.session.add(user)

    db.session.commit()


def undo_users():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.users RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM users"))

    db.session.commit()
