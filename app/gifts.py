"""Aura economy — gift catalog, creator tiers, and Bolt packs.

Single source of truth for the reward system:
  • Aura  — clout, earned (likes + gifts received), never bought. Sets your tier.
  • Bolts — coins viewers buy with cash and spend on gifts.
  • Glow  — the creator's cashable share of the Bolts they're gifted.

Receiving gifts is GATED: a creator's lives only accept gifts once they reach the
Rising tier (Aura >= GIFTS_UNLOCK_AURA). Build clout first, then cash in.
"""

# Aura a creator needs before their lives accept gifts (Rising tier).
GIFTS_UNLOCK_AURA = 10_000

# Creator tiers by Aura. `share` = fraction of a gift's Bolt value the creator
# keeps as Glow (the platform funds itself with the rest). More Aura -> bigger cut.
TIERS = [
    {"key": "standard", "name": "Standard", "min": 0,         "share": 0.50},
    {"key": "rising",   "name": "Rising",   "min": 10_000,    "share": 0.55},
    {"key": "pro",      "name": "Pro",       "min": 100_000,   "share": 0.65},
    {"key": "icon",     "name": "Icon",      "min": 1_000_000, "share": 0.80},
]

# The gift shelf — sent live, animated on screen. `bolts` = sender's price,
# `aura` = clout awarded to the creator, `rarity` drives the on-screen effect,
# `takeover` = full-screen moment with the sender's name.
GIFT_CATALOG = [
    {"key": "spark",            "name": "Spark",            "icon": "bolt",     "bolts": 5,      "aura": 5,      "rarity": "common"},
    {"key": "glow_stick",       "name": "Glow Stick",       "icon": "flame",    "bolts": 25,     "aura": 30,     "rarity": "common"},
    {"key": "gold_chain",       "name": "Gold Chain",       "icon": "link",     "bolts": 100,    "aura": 120,    "rarity": "rare"},
    {"key": "crown",            "name": "Crown",            "icon": "crown",    "bolts": 500,    "aura": 650,    "rarity": "rare"},
    {"key": "halo",             "name": "Halo",             "icon": "sparkles", "bolts": 1_000,  "aura": 1_400,  "rarity": "epic"},
    {"key": "phoenix",          "name": "Phoenix",          "icon": "feather",  "bolts": 5_000,  "aura": 7_500,  "rarity": "epic"},
    {"key": "nebula",           "name": "Nebula",           "icon": "planet",   "bolts": 10_000, "aura": 16_000, "rarity": "legendary", "takeover": True},
    {"key": "superstar",        "name": "Superstar",        "icon": "star",     "bolts": 15_000, "aura": 24_000, "rarity": "legendary", "takeover": True},
    {"key": "rockstar",         "name": "Rockstar",         "icon": "guitar",   "bolts": 20_000, "aura": 33_000, "rarity": "legendary", "takeover": True},
    {"key": "black_excellence", "name": "Black Excellence", "icon": "fist",     "bolts": 25_000, "aura": 42_000, "rarity": "mythic",    "takeover": True},
    {"key": "supernova",        "name": "Supernova",        "icon": "rocket",   "bolts": 30_000, "aura": 50_000, "rarity": "mythic",    "takeover": True},
]

# Bolt packs viewers can buy (cents illustrative). Demo mode credits instantly.
BOLT_PACKS = {
    "starter": {"bolts": 500,    "cents": 649},
    "pro":     {"bolts": 3_000,  "cents": 2999},
    "whale":   {"bolts": 20_000, "cents": 19999},
}

# Daily free gift — every user can send ONE of these every 24h with no Bolts
# spent. It credits the creator Aura (clout) only, never Glow (cash), so it
# can't be farmed for real money.
FREE_GIFT_KEY = "spark"
FREE_GIFT_COOLDOWN_HOURS = 24

# 24-hour live feature — unlocked once a creator has both enough followers and
# enough Aura. After the stream ends, the top supporters get a thank-you in Bolts.
LIVE_24H_MIN_FOLLOWERS = 2_000
LIVE_24H_MIN_AURA = 10_000
LIVE_24H_HOURS = 24
LIVE_24H_REWARDS = [500, 300, 200]   # Bolts for the 1st / 2nd / 3rd top supporter

_GIFTS_BY_KEY = {g["key"]: g for g in GIFT_CATALOG}


def gift_by_key(key):
    """Return the catalog entry for a gift key, or None."""
    return _GIFTS_BY_KEY.get(key)


def tier_for(aura):
    """Return the tier dict an Aura score falls into."""
    current = TIERS[0]
    for t in TIERS:
        if aura >= t["min"]:
            current = t
    return current
