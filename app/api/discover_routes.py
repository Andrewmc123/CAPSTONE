"""
Discover / Explore API — trending hashtags, sounds, creators, search,
category browsing for the Explore grid.
"""
from collections import Counter, defaultdict

from flask import Blueprint, request
from flask_login import current_user
from sqlalchemy import or_
from sqlalchemy.orm import joinedload, selectinload

from app.models import Post, User

discover_routes = Blueprint('discover', __name__)

POST_OPTS = lambda: (
    joinedload(Post.user),
    selectinload(Post.likes),
    selectinload(Post.comments),
    selectinload(Post.bookmarks),
)

# Built-in sound library for the Upload Studio (royalty-free SoundHelix tracks)
SOUND_LIBRARY = [
    {'id': 's1',  'name': 'About Last Night (Anthem)', 'artist': 'DJ Verde',          'emoji': '🌃', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'},
    {'id': 's2',  'name': 'Neon Nights',               'artist': 'ABLN House Band',   'emoji': '💚', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'},
    {'id': 's3',  'name': 'Midnight Drive',            'artist': 'Citrus Wave',       'emoji': '🚗', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'},
    {'id': 's4',  'name': 'Glow Up',                   'artist': 'The After Hours',   'emoji': '✨', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'},
    {'id': 's5',  'name': 'Last Call',                 'artist': 'Velvet Static',     'emoji': '🍹', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'},
    {'id': 's6',  'name': '2AM Energy',                'artist': 'MC Ember',          'emoji': '⚡', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'},
    {'id': 's7',  'name': 'Rooftop Sunrise',           'artist': 'Lone Disco',        'emoji': '🌅', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'},
    {'id': 's8',  'name': 'Bass in the Basement',      'artist': 'Subwoofer Society', 'emoji': '🔊', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'},
    {'id': 's9',  'name': 'Confetti Rain',             'artist': 'Party Theory',      'emoji': '🎉', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'},
    {'id': 's10', 'name': 'Strobe Light Heartbeat',    'artist': 'Nightcap',          'emoji': '🪩', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'},
    {'id': 's11', 'name': 'Dance Floor Gravity',       'artist': 'Orbit Club',        'emoji': '🕺', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3'},
    {'id': 's12', 'name': 'Afterglow',                 'artist': 'Sunset Karaoke',    'emoji': '🧡', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'},
    {'id': 's13', 'name': 'Golden Hour Groove',        'artist': 'Polaroid Funk',     'emoji': '📸', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3'},
    {'id': 's14', 'name': 'City Lights Lullaby',       'artist': 'Skyline Echo',      'emoji': '🌆', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3'},
    {'id': 's15', 'name': 'Weekend Forecast',          'artist': 'The Vibe Bureau',   'emoji': '🌦️', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'},
    {'id': 's16', 'name': 'Encore Encore',             'artist': 'Stagedive Social',  'emoji': '🎤', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'},
    {'id': 's17', 'name': 'Sunrise Cleanup Crew',      'artist': 'Morning After',     'emoji': '🧹', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3'},
]

# Explore category → caption keywords
CATEGORY_KEYWORDS = {
    'dance':   ['dance', 'dancing', 'moves', 'choreo', 'groove'],
    'comedy':  ['funny', 'lol', 'comedy', 'laugh', 'joke', 'meme', 'fail'],
    'animals': ['cat', 'dog', 'pet', 'animal', 'puppy', 'kitten', 'squirrel', 'penguin'],
    'food':    ['food', 'eat', 'yum', 'cook', 'recipe', 'snack', 'hungry', 'foodie'],
    'sports':  ['sport', 'game', 'goal', 'basketball', 'soccer', 'football', 'win', 'gym', 'fitness'],
    'gaming':  ['gaming', 'gamer', 'game', 'play', 'stream', 'win', 'console'],
    'music':   ['music', 'song', 'sound', 'beat', 'sing', 'dj', 'concert'],
    'films':   ['film', 'movie', 'cinema', 'short', 'animation', 'trailer'],
    'travel':  ['travel', 'trip', 'beach', 'city', 'adventure', 'sunset', 'nature'],
}


def viewer_id():
    return current_user.id if current_user.is_authenticated else None


@discover_routes.route('/trending')
def trending():
    """Trending hashtags, sounds and creators across ABLN — public."""
    posts = Post.query.options(*POST_OPTS()).all()

    tag_counts = Counter()
    tag_views = defaultdict(int)
    sound_counts = Counter()
    for p in posts:
        for tag in set(p.hashtags):
            tag_counts[tag.lower()] += 1
            tag_views[tag.lower()] += (p.views or 0)
        if p.sound_name:
            sound_counts[p.sound_name] += 1

    hashtags = [
        {'tag': tag, 'count': count, 'views': tag_views[tag]}
        for tag, count in tag_counts.most_common(12)
    ]
    sounds = [
        {'name': name, 'count': count}
        for name, count in sound_counts.most_common(8)
    ]

    creators = sorted(User.query.all(), key=lambda u: len(u.followers), reverse=True)[:8]

    return {
        'hashtags': hashtags,
        'sounds': sounds,
        'creators': [u.to_dict_basic() for u in creators],
    }


@discover_routes.route('/videos')
def explore_videos():
    """Explore grid — optionally filtered by category — public."""
    category = (request.args.get('category') or 'all').lower()
    posts = Post.query.options(*POST_OPTS()).all()

    if category != 'all' and category in CATEGORY_KEYWORDS:
        keywords = CATEGORY_KEYWORDS[category]
        posts = [
            p for p in posts
            if any(kw in (p.body or '').lower() for kw in keywords)
        ]

    posts.sort(key=lambda p: ((p.views or 0) + len(p.likes) * 50), reverse=True)
    uid = viewer_id()
    return {
        'posts': [p.to_dict(uid) for p in posts[:48]],
        'category': category,
        'categories': ['all'] + list(CATEGORY_KEYWORDS.keys()),
    }


@discover_routes.route('/hashtag/<string:tag>')
def hashtag_videos(tag):
    """All videos for a hashtag — public."""
    tag = tag.lstrip('#').lower()
    posts = Post.query.options(*POST_OPTS()).all()
    matched = [p for p in posts if tag in [t.lower() for t in p.hashtags]]
    matched.sort(key=lambda p: (p.views or 0), reverse=True)
    uid = viewer_id()
    return {
        'tag': tag,
        'video_count': len(matched),
        'total_views': sum(p.views or 0 for p in matched),
        'posts': [p.to_dict(uid) for p in matched],
    }


@discover_routes.route('/search')
def search():
    """Global search: users, videos and hashtags — public."""
    q = (request.args.get('q') or '').strip()
    if not q:
        return {'users': [], 'posts': [], 'hashtags': []}

    like = f'%{q}%'
    users = User.query.filter(or_(
        User.username.ilike(like),
        User.firstname.ilike(like),
        User.lastname.ilike(like),
    )).limit(12).all()

    posts = Post.query.options(*POST_OPTS()).filter(Post.body.ilike(like))\
        .order_by(Post.created_at.desc()).limit(24).all()

    tag_counts = Counter()
    for p in Post.query.all():
        for tag in p.hashtags:
            if q.lstrip('#').lower() in tag.lower():
                tag_counts[tag.lower()] += 1

    uid = viewer_id()
    return {
        'users': [u.to_dict_basic() for u in users],
        'posts': [p.to_dict(uid) for p in posts],
        'hashtags': [{'tag': t, 'count': c} for t, c in tag_counts.most_common(8)],
    }


@discover_routes.route('/sounds')
def sounds():
    """Built-in sound library for the Upload Studio — public."""
    return {'sounds': SOUND_LIBRARY}
