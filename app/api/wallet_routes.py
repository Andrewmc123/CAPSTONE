"""Wallet API — the Aura economy's coins (Bolts), clout (Aura) and cash (Glow).

Phase 1 keeps the keyless-demo property: buying Bolts credits instantly in demo
mode. A production build would return a Stripe checkout URL here, mirroring Shop.
"""
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from app.models import db
from app.gifts import GIFT_CATALOG, TIERS, GIFTS_UNLOCK_AURA, BOLT_PACKS

wallet_routes = Blueprint('wallet', __name__)


def wallet_state(user):
    tier = user.tier()
    return {
        'bolts': user.bolts,
        'glow': user.glow,
        'aura': user.aura_score(),
        'tier': tier['name'],
        'tier_key': tier['key'],
        'share': tier['share'],
        'gifts_unlocked': user.gifts_unlocked(),
        'unlock_aura': GIFTS_UNLOCK_AURA,
    }


@wallet_routes.route('/me')
@login_required
def my_wallet():
    """The signed-in user's balances, Aura, and tier."""
    return jsonify(wallet_state(current_user))


@wallet_routes.route('/gifts')
def gift_catalog():
    """Public — the gift shelf, creator tiers, and the gift-unlock threshold."""
    return jsonify({
        'gifts': GIFT_CATALOG,
        'tiers': TIERS,
        'unlock_aura': GIFTS_UNLOCK_AURA,
        'packs': BOLT_PACKS,
    })


@wallet_routes.route('/bolts', methods=['POST'])
@login_required
def buy_bolts():
    """Top up Bolts. Demo mode credits instantly (no key required)."""
    pack_key = (request.get_json() or {}).get('pack', 'starter')
    pack = BOLT_PACKS.get(pack_key) or BOLT_PACKS['starter']
    current_user.bolts = (current_user.bolts or 0) + pack['bolts']
    db.session.commit()
    return jsonify({'demo': True, 'added': pack['bolts'], **wallet_state(current_user)})
