from app.models import db, User, environment, SCHEMA
from sqlalchemy.sql import text

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
