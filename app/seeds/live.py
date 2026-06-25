from app.models import db, User, LiveSession, environment, SCHEMA
from sqlalchemy.sql import text


# A couple of always-on demo broadcasts hosted by unlocked (1M+ Aura) creators,
# so a single demo viewer can open Live and send gifts end-to-end.
DEMO_LIVES = [
    ("queenShoy99", "Get ready with me 💜 sending love to my top Aura"),
    ("nightcrawler", "Late-night Q&A 🌙 drop a gift, I'll shout you out"),
]


def seed_lives():
    for username, title in DEMO_LIVES:
        host = User.query.filter_by(username=username).first()
        if not host:
            continue
        existing = LiveSession.query.filter_by(host_id=host.id, is_live=True).first()
        if not existing:
            db.session.add(LiveSession(host_id=host.id, title=title))
    db.session.commit()


def undo_lives():
    if environment == "production":
        db.session.execute(text(f"TRUNCATE table {SCHEMA}.live_sessions RESTART IDENTITY CASCADE;"))
    else:
        db.session.execute(text("DELETE FROM live_messages"))
        db.session.execute(text("DELETE FROM live_viewers"))
        db.session.execute(text("DELETE FROM live_sessions"))
    db.session.commit()
