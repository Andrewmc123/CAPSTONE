from datetime import datetime, timedelta
from app.models import db, User, LiveSession, environment, SCHEMA
from app.gifts import LIVE_24H_HOURS
from sqlalchemy.sql import text


# Always-on demo broadcasts hosted by unlocked (1M+ Aura) creators, so a single
# demo viewer can open Live and send gifts end-to-end.
DEMO_LIVES = [
    ("queenShoy99", "Get ready with me 💜 sending love to my top Aura"),
    ("nightcrawler", "Late-night Q&A 🌙 drop a gift, I'll shout you out"),
]


def seed_lives():
    for username, title in DEMO_LIVES:
        host = User.query.filter_by(username=username).first()
        if not host:
            continue
        if not LiveSession.query.filter_by(host_id=host.id, is_live=True).first():
            db.session.add(LiveSession(host_id=host.id, title=title))

    # Aria's always-on 24-HOUR live, already mid-run so the stats look alive.
    aria = User.query.filter_by(username="aria.live").first()
    if aria and not LiveSession.query.filter_by(host_id=aria.id, is_live=True).first():
        db.session.add(LiveSession(
            host_id=aria.id,
            title="24-HOUR LIVE 🔴 let's set a new Aura record together",
            is_24h=True,
            ends_at=datetime.utcnow() + timedelta(hours=LIVE_24H_HOURS - 6),   # ~18h left
            start_aura=max(0, aria.aura_score() - 40000),        # ~40K Aura gained so far
            start_followers=max(0, aria.follower_count() - 250),  # ~250 followers gained
            peak_viewers=7,
        ))
    db.session.commit()


def undo_lives():
    if environment == "production":
        db.session.execute(text(f"TRUNCATE table {SCHEMA}.live_sessions RESTART IDENTITY CASCADE;"))
    else:
        db.session.execute(text("DELETE FROM live_messages"))
        db.session.execute(text("DELETE FROM live_viewers"))
        db.session.execute(text("DELETE FROM live_sessions"))
    db.session.commit()
