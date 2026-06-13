"""
GIF API — the heart of ABLN's GIF experience.

Proxies the Tenor v2 API (key configurable via TENOR_API_KEY env var) and
gracefully falls back to a curated, pre-verified GIF library so GIF search,
GIF comments and GIF posts always work — even with no API key or no internet.
"""
import os
import json
import urllib.request
import urllib.parse

from flask import Blueprint, request

from .gif_library import CURATED_GIFS

gif_routes = Blueprint('gifs', __name__)

# Tenor's public sample key (from Tenor's API docs) — replace with your own in .env
TENOR_KEY = os.environ.get('TENOR_API_KEY', 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ')
TENOR_BASE = 'https://tenor.googleapis.com/v2'


def normalize_tenor(results):
    gifs = []
    for res in results:
        mf = res.get('media_formats', {})
        gif = mf.get('gif') or mf.get('mediumgif') or {}
        tiny = mf.get('tinygif') or gif
        if not gif.get('url'):
            continue
        dims = gif.get('dims') or [220, 220]
        gifs.append({
            'id': res.get('id'),
            'title': (res.get('content_description') or '')[:80],
            'url': gif['url'],
            'preview': tiny.get('url', gif['url']),
            'width': dims[0],
            'height': dims[1],
        })
    return gifs


def tenor_fetch(endpoint, params):
    params['key'] = TENOR_KEY
    params['media_filter'] = 'gif,tinygif'
    params['contentfilter'] = 'high'  # family friendly — safe for all ages
    url = f"{TENOR_BASE}/{endpoint}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'ABLN/1.0'})
    with urllib.request.urlopen(req, timeout=6) as resp:
        return json.load(resp)


def curated(query=None, limit=24):
    items = CURATED_GIFS
    if query:
        terms = [t for t in query.lower().split() if t]
        scored = []
        for g in items:
            hits = sum(1 for t in terms if t in g['tags'])
            if hits:
                scored.append((hits, g))
        scored.sort(key=lambda x: x[0], reverse=True)
        items = [g for _, g in scored] or CURATED_GIFS
    return [
        {k: g[k] for k in ('id', 'title', 'url', 'preview', 'width', 'height')}
        for g in items[:limit]
    ]


@gif_routes.route('/trending')
def trending_gifs():
    """Trending GIFs (Tenor featured, curated fallback)."""
    limit = min(40, request.args.get('limit', 24, type=int))
    try:
        data = tenor_fetch('featured', {'limit': limit})
        gifs = normalize_tenor(data.get('results', []))
        if gifs:
            return {'gifs': gifs, 'source': 'tenor'}
    except Exception:
        pass
    return {'gifs': curated(limit=limit), 'source': 'curated'}


@gif_routes.route('/search')
def search_gifs():
    """Search GIFs by keyword (Tenor search, curated fallback)."""
    q = (request.args.get('q') or '').strip()
    limit = min(40, request.args.get('limit', 24, type=int))
    if not q:
        return trending_gifs()
    try:
        data = tenor_fetch('search', {'q': q, 'limit': limit})
        gifs = normalize_tenor(data.get('results', []))
        if gifs:
            return {'gifs': gifs, 'source': 'tenor'}
    except Exception:
        pass
    return {'gifs': curated(query=q, limit=limit), 'source': 'curated'}


@gif_routes.route('/categories')
def gif_categories():
    """Quick-pick GIF categories for the picker chips."""
    return {'categories': [
        'trending', 'reactions', 'love', 'laughing', 'dance', 'cat',
        'dog', 'fire', 'omg', 'party', 'food', 'sports', 'gaming', 'mood'
    ]}
