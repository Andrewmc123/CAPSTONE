from app.models import db, Product, User, environment, SCHEMA
from sqlalchemy.sql import text

# picsum gives reliable, always-rendering placeholder imagery
IMG = "https://picsum.photos/seed/{}/600/600"

PRODUCTS = [
    {"seller": 2, "title": "Aura Neon Hoodie", "price_cents": 4499, "category": "fashion",
     "image": IMG.format("aurahoodie"),
     "desc": "Oversized heavyweight hoodie with the Aura glow print. The fit everyone's asking about."},
    {"seller": 6, "title": "Glow Up Highlighter Set", "price_cents": 2299, "category": "beauty",
     "image": IMG.format("glowset"),
     "desc": "3-shade liquid highlighter trio for that main-character glow. Vegan + cruelty free."},
    {"seller": 8, "title": "RGB Streaming Mic", "price_cents": 7900, "category": "tech",
     "image": IMG.format("rgbmic"),
     "desc": "USB-C condenser mic with reactive RGB. Plug-and-play for streams, pods and voiceovers."},
    {"seller": 3, "title": "City Nights Art Print (A2)", "price_cents": 3200, "category": "art",
     "image": IMG.format("citynights"),
     "desc": "Limited-run giclée print of the skyline series. Signed and numbered."},
    {"seller": 10, "title": "Midnight Snack Hot Sauce", "price_cents": 1299, "category": "food",
     "image": IMG.format("hotsauce"),
     "desc": "Small-batch mango-habanero. Sweet first, then it hits. Goes on everything."},
    {"seller": 9, "title": "Afterglow Soy Candle", "price_cents": 1899, "category": "home",
     "image": IMG.format("candle"),
     "desc": "Amber + sandalwood. 50-hour burn. The cozy reset your room needs."},
    {"seller": 5, "title": "About Last Night — Vinyl", "price_cents": 2999, "category": "music",
     "image": IMG.format("vinyl"),
     "desc": "The anthem on translucent gold vinyl. Limited press of 500."},
    {"seller": 4, "title": "Gameday Snapback", "price_cents": 2499, "category": "fashion",
     "image": IMG.format("snapback"),
     "desc": "Structured 6-panel with embroidered crest. One size, fully adjustable."},
    {"seller": 12, "title": "Sticker Pack — Night Owls", "price_cents": 899, "category": "other",
     "image": IMG.format("stickers"),
     "desc": "12 weatherproof vinyl stickers. Slap 'em on a laptop, bottle, whatever."},
    {"seller": 2, "title": "Choreo Masterclass (Digital)", "price_cents": 1500, "category": "other",
     "image": IMG.format("choreo"),
     "desc": "90-min downloadable class — learn the transition from the viral clip step by step."},
]


def seed_products():
    undo_products()
    # only seed for sellers that actually exist in the DB
    valid_ids = {u.id for u in User.query.all()}
    rows = []
    for p in PRODUCTS:
        if p["seller"] not in valid_ids:
            continue
        rows.append(Product(
            seller_id=p["seller"],
            title=p["title"],
            description=p["desc"],
            price_cents=p["price_cents"],
            image_url=p["image"],
            category=p["category"],
        ))
    db.session.add_all(rows)
    db.session.commit()


def undo_products():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.products RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM products"))
    db.session.commit()
