from app.models import db, Post, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime

def seed_posts():
    posts = [
        Post(user_id=2, image_url="/images/dyehairgirl.jpg", caption="just dyed my hair for this party downtown tonight, what ya think? 🌈✨", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=3, image_url="/images/partycrowd.jpg", caption="WHATTHEHELLLY??", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=5, image_url="/images/weoutside.gif", caption="we outsiiiiiiide!! 🌃 #latevibes", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=1, image_url="/images/feltcute.jpg", caption="hey im new ,just testing features felt cute 👀👋", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=9, image_url="/images/cat1.jpg", caption="I feel like i got caught coming in late at my parents house again 😭", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=4, image_url="/images/lastnightmovie.jpg", caption="yooo last night was a movie 🍾🪩", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=6, image_url="/images/rooftop.jpg", caption="pulling up to the rooftop in 10 😎 who’s already there?", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=7, image_url="/images/bestiedance.gif", caption="the way we danced ALL night 💃🔥", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=8, image_url="/images/preame.jpg", caption="someone said pregame at mine then head to the function? lmk", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=9, image_url="/images/thesquad2.jpg", caption="me and the squad showing OUT last night 😎 ", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=3, image_url="/images/whotookthis.jpg", caption="who took this pic??? i was GONE 💀📸", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=2, image_url="/images/uzi.jpg", caption="ig me and bro partying til sunrise again DAMNNNNN!!!!! ☀️🕺", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=5, image_url="/images/metthecity.jpg", caption="i met half the city last night lol", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=1, image_url="/images/hungover-britney.gif", caption="Yea... i woke up with a hangover 😭", created_at=datetime.utcnow(), updated_at=datetime.utcnow())
    ]

    db.session.add_all(posts)
    db.session.commit()

def undo_posts():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.posts RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM posts"))
    db.session.commit()
