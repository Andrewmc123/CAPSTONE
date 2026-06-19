from app.models import db, Group, GroupMember, GroupMessage, User, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime, timedelta
import random

GROUPS = [
    {"name": "Black-Owned Business Builders", "category": "business", "leader": 5, "public": True, "aura": 940,
     "desc": "Drop your brand, your idea, your hustle — we build together. 💼🖤"},
    {"name": "Side Hustle Sunday", "category": "business", "leader": 10, "public": True, "aura": 520,
     "desc": "What's everybody flipping this week? Ideas, wins and accountability."},
    {"name": "Real Talk Politics", "category": "politics", "leader": 4, "public": True, "aura": 760,
     "desc": "Civil debate only. Bring facts, leave the ego. 🗳️"},
    {"name": "Baddies Only 💅", "category": "baddies", "leader": 6, "public": False, "aura": 1310,
     "desc": "Soft life, hard launch. Invite only — ask the leader. ✨"},
    {"name": "Glow & Grow", "category": "baddies", "leader": 2, "public": True, "aura": 610,
     "desc": "Skincare, fits, confidence. We glow up as a team."},
    {"name": "NBA Hoops Talk 🏀", "category": "nba", "leader": 4, "public": True, "aura": 1020,
     "desc": "Hot takes, trade rumors and last night's box scores."},
    {"name": "Anime Nights 🌀", "category": "anime", "leader": 8, "public": True, "aura": 870,
     "desc": "Watch parties, recs and (mostly) no-spoiler zones."},
    {"name": "Late Night Vents", "category": "other", "leader": 9, "public": True, "aura": 430,
     "desc": "Can't sleep? Pull up. Judgment-free 2am thoughts."},
]

CHAT = {
    "business": ["just launched my Shopify, link in bio 🔥", "who's got a good supplier for tees?",
                 "reinvest the first $1k, don't touch it", "accountability check — everybody post today?",
                 "branding is everything fr", "got my first sale today!! 😭🙏", "LLC or sole prop to start?"],
    "politics": ["did everyone catch the debate last night?", "local elections matter more than people think",
                 "sources or it didn't happen 📑", "let's keep it civil y'all", "register to vote, takes 2 min"],
    "baddies": ["the fit was FITTING today 💅", "drop your skincare routine", "soft life loading…",
                "confidence is the best accessory", "we don't do drama in here, only glow ✨"],
    "nba": ["that buzzer beater was INSANE 🏀", "trade season about to be wild", "MVP race is tight this year",
            "defense wins championships, period", "who you got tonight?"],
    "anime": ["watch party friday, who's in? 🌀", "no spoilers for the new season pls 🙏",
              "best opening of all time, go", "manga > anime for this one imo", "rewatching a classic tonight"],
    "other": ["can't sleep again lol", "pull up, it's a vibe", "2am thoughts hitting different",
              "we got you, vent away", "anybody else up?"],
}


def seed_groups():
    undo_groups()
    random.seed(11)
    users = User.query.all()
    if not users:
        return
    uids = [u.id for u in users]
    now = datetime.utcnow()

    for spec in GROUPS:
        leader = spec["leader"]
        if leader not in uids:
            continue
        created = now - timedelta(days=random.randint(8, 90))
        g = Group(name=spec["name"], description=spec["desc"], category=spec["category"],
                  leader_id=leader, is_public=spec["public"], aura=spec["aura"], created_at=created)
        db.session.add(g)
        db.session.flush()

        db.session.add(GroupMember(group_id=g.id, user_id=leader, role='leader', joined_at=created))

        others = [u for u in uids if u != leader]
        random.shuffle(others)
        members = others[:min(10, len(others))]
        for i, uid in enumerate(members):
            role = 'mod' if i == 0 else 'member'  # one mod per group
            db.session.add(GroupMember(group_id=g.id, user_id=uid, role=role,
                                       joined_at=created + timedelta(hours=random.randint(1, 120))))

        speakers = [leader] + members
        span = max(1, int((now - created).total_seconds()))
        for _ in range(random.randint(6, 12)):
            ts = created + timedelta(seconds=random.randint(0, span))
            db.session.add(GroupMessage(group_id=g.id, user_id=random.choice(speakers),
                                        content=random.choice(CHAT.get(spec["category"], CHAT["other"])),
                                        media_type='text', created_at=ts))
    db.session.commit()


def undo_groups():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.group_messages RESTART IDENTITY CASCADE;")
        db.session.execute(f"TRUNCATE table {SCHEMA}.group_members RESTART IDENTITY CASCADE;")
        db.session.execute(f"TRUNCATE table {SCHEMA}.groups RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM group_messages"))
        db.session.execute(text("DELETE FROM group_members"))
        db.session.execute(text("DELETE FROM groups"))
    db.session.commit()
