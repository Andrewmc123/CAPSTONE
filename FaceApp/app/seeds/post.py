from app.models import db, Post, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime

def seed_posts():
    posts = [
        Post(user_id=4, image_url="/images/bustdown.jpg", body="Drunk asl.. JW trya slide on his opps, I just needed a ride Home 😭", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=3, image_url="/images/whotookthis.jpg", body="who took this pic 😭 ??? BROO i was GONE! 💀📸", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=2, image_url="/images/dyehairgirl.jpg", body="just dyed my hair for this party downtown tonight, what ya think? 🌈✨", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=3, image_url="/images/partycrowd.jpg", body="WHATTHEHELLLY??", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=7, image_url="/images/cuttingup.gif", body="Why uber when you got JW behind the wheel 😎😭", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=4, image_url="/images/Tesla.jpeg", body="Yea...after what happend lastnight this would be a good investment 😭", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=1, image_url="/images/weoutside.gif", body="All i gotta say is...we outsiiiiiiide!! 🌃 #latevibes", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=1, image_url="/images/feltcute.jpg", body="heyyy IM NEW HERE!! 👀👋", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=7, image_url="/images/neveragain.gif", body="IM NEVER GETTIG IN THAT CAR AGAIN!!", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=2, image_url="/images/Sowhat.gif", body="LastNights Memories OMG!! i LOVE THIS APP!😭", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=9, image_url="/images/cat1.jpg", body="I was finally let into my OWN house for coming in late after 12pm 😭", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=4, image_url="/images/lastnightmovie.jpg", body="yooo last night was a movie 🍾🪩", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=6, image_url="/images/rooftop.jpg", body="pulling up to the rooftop in 10 😎", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=7, image_url="/images/bestiedance.gif", body="Me and the Homie showing the yougins how its done Lastnight !😭🔥", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=8, image_url="/images/preame.jpg", body="someone said pregame at mine then head to the function? lmk", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=9, image_url="/images/thesquad2.jpg", body="me and the squad showing OUT last night 😎 ", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=5, image_url="/images/newfriends.jpg", body=" met some productive good civilian friends last night, my new name is   🕺", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=5, image_url="/images/metthecity.jpg", body="i met half the city last night lol", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=5, image_url="/images/weoutside.gif", body="we outsiiiiiiide!! 🌃 #latevibes", created_at=datetime.utcnow(), updated_at=datetime.utcnow()),
        Post(user_id=1, image_url="/images/hungover-britney.gif", body="Yea... i woke up with a hangover 😭", created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        
    ]    

    db.session.add_all(posts)
    db.session.commit()

def undo_posts():
    if environment == "production":
     db.session.execute(f"TRUNCATE table {SCHEMA}.posts RESTART IDENTITY CASCADE;")
    else:
     db.session.execute(text("DELETE FROM posts"))
     db.session.commit() 
