from app.models import db, User, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta

def seed_users():
    users_data = [
        {"username": "demo", "email": "demo@aa.io", "password": "password",
         "firstname": "Demo", "lastname": "User", "profile_img": "/images/demo.jpg",
         "bolts": 60000,
         "bio": "Just here for the vibes ✨ Tap follow and let's relive last night 🌃"},
        {"username": "queenShoy99", "email": "sho@aa.io", "password": "password",
         "firstname": "Shoy", "lastname": "Queen", "profile_img": "/images/shoyface.jpg",
         "gift_aura": 1250000,
         "bio": "Dance floor royalty 👑 | new moves every Friday | #dance"},
        {"username": "astro_boi", "email": "astro@aa.io", "password": "password",
         "firstname": "Astro", "lastname": "Boi", "profile_img": "/images/astro.jpg",
         "gift_aura": 240000,
         "bio": "Filming the city after dark 🌌 | drone shots & night drives"},
        {"username": "John_Rangers21", "email": "jr21@aa.io", "password": "password",
         "firstname": "John", "lastname": "Rangers", "profile_img": "/images/kermit.jpg",
         "bio": "Sports clips, game day energy, zero chill ⚽🏀"},
        {"username": "nightcrawler", "email": "crawl@aa.io", "password": "password",
         "firstname": "Night", "lastname": "Crawler", "profile_img": "/images/johnwhick.jpg",
         "gift_aura": 1050000,
         "bio": "If it happened after midnight, I posted it 🌙"},
        {"username": "pixiepop", "email": "pixie@aa.io", "password": "password",
         "firstname": "Pixie", "lastname": "Pop", "profile_img": "/images/girl2.jpg",
         "bio": "GIF queen 💖 reactions, memes & main character moments"},
        {"username": "fitking", "email": "fit@aa.io", "password": "password",
         "firstname": "Fit", "lastname": "King", "profile_img": "/images/fitking.jpg",
         "gift_aura": 88000,
         "bio": "Gym at 6, party at 10 💪 fitness & festival recaps"},
        {"username": "dnd_lord", "email": "dnd@aa.io", "password": "password",
         "firstname": "Dnd", "lastname": "Lord", "profile_img": "/images/stinkface.jpg",
         "bio": "Gaming, game nights & critical fails 🎲🎮"},
        {"username": "plantmom", "email": "plant@aa.io", "password": "password",
         "firstname": "Plant", "lastname": "Mom", "profile_img": "/images/animephoto.jpg",
         "bio": "Cozy nights in > loud nights out (sometimes) 🌿"},
        {"username": "chef_milo", "email": "milo@aa.io", "password": "password",
         "firstname": "Milo", "lastname": "Reyes", "profile_img": "https://i.pravatar.cc/300?img=12",
         "gift_aura": 12500,
         "bio": "Midnight snack scientist 🍜 | food videos that hit different"},
        {"username": "luna.films", "email": "luna@aa.io", "password": "password",
         "firstname": "Luna", "lastname": "Park", "profile_img": "https://i.pravatar.cc/300?img=47",
         "gift_aura": 35000,
         "bio": "Short films & animation picks 🎬 | watch parties every weekend"},
        {"username": "petsofabln", "email": "pets@aa.io", "password": "password",
         "firstname": "Penny", "lastname": "Barker", "profile_img": "https://i.pravatar.cc/300?img=32",
         "gift_aura": 920000,
         "bio": "The official unofficial pet page 🐶🐱 your daily serotonin"},
        # Demo creator with the 24-hour live feature unlocked (10K followers,
        # Icon-tier Aura). Log in as aria@aa.io / password to run a 24h live.
        {"username": "aria.live", "email": "aria@aa.io", "password": "password",
         "firstname": "Aria", "lastname": "Vega", "profile_img": "https://i.pravatar.cc/300?img=45",
         "gift_aura": 2500000, "extra_followers": 10000, "bolts": 5000,
         "bio": "24/7 good vibes ✨ your fav 24-hour livestreamer · #aura"},
    ]

    for u in users_data:
        existing_user = User.query.filter_by(email=u["email"]).first()
        if not existing_user:
            user = User(**u)
            db.session.add(user)

    db.session.commit()

    # Give the seeded crowd a spread of presence states so the sidebar's online
    # rail shows all three dots out of the box: a couple on do-not-disturb, a
    # third of them idle/offline, the rest green.
    now = datetime.utcnow()
    for user in User.query.all():
        if user.id % 5 == 0:
            user.presence_status = 'dnd'
        if user.id % 3 == 0:
            user.last_seen = now - timedelta(days=2)
        else:
            user.last_seen = now

    db.session.commit()


def undo_users():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.users RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM users"))

    db.session.commit()
