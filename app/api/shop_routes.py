"""
Community Shop API — users post products for sale and market them,
TikTok-Shop style. Listings are public; creating/deleting requires auth.
"""
import json

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.models import db, Product, Order

shop_routes = Blueprint('shop', __name__)

FREE_SHIP_THRESHOLD_CENTS = 5000   # free shipping over $50
FLAT_SHIP_CENTS = 599              # otherwise $5.99


@shop_routes.route('/')
def list_products():
    """All shop listings, newest first. Optional ?category= and ?seller_id=."""
    q = Product.query
    category = request.args.get('category')
    seller_id = request.args.get('seller_id', type=int)
    if category and category != 'all':
        q = q.filter(Product.category == category)
    if seller_id:
        q = q.filter(Product.seller_id == seller_id)
    products = q.order_by(Product.created_at.desc()).all()
    return jsonify({'products': [p.to_dict() for p in products]})


@shop_routes.route('/<int:product_id>')
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(product.to_dict())


@shop_routes.route('/', methods=['POST'])
@login_required
def create_product():
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'error': 'A product title is required'}), 400

    # accept either price (dollars) or price_cents
    price_cents = data.get('price_cents')
    if price_cents is None and data.get('price') is not None:
        try:
            price_cents = int(round(float(data['price']) * 100))
        except (ValueError, TypeError):
            price_cents = 0
    try:
        price_cents = max(0, int(price_cents or 0))
    except (ValueError, TypeError):
        price_cents = 0

    try:
        product = Product(
            seller_id=current_user.id,
            title=title[:120],
            description=(data.get('description') or '').strip() or None,
            price_cents=price_cents,
            image_url=(data.get('image_url') or '').strip() or None,
            category=(data.get('category') or '').strip() or None,
            link=(data.get('link') or '').strip() or None,
        )
        db.session.add(product)
        db.session.commit()
        return jsonify(product.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@shop_routes.route('/<int:product_id>', methods=['DELETE'])
@login_required
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    if product.seller_id != current_user.id:
        return jsonify({'error': 'Not allowed'}), 403
    db.session.delete(product)
    db.session.commit()
    return jsonify({'id': product_id})


# ---------- cart checkout / orders ----------

@shop_routes.route('/orders', methods=['POST'])
@login_required
def place_order():
    """Place an order. Totals are computed SERVER-SIDE from real product prices
    (never trust the client). Demo payment — no real charge; we keep only the
    card's last 4 for the receipt and never the full number."""
    data = request.get_json() or {}
    raw_items = data.get('items') or []
    ship = data.get('shipping') or {}

    if not raw_items:
        return jsonify({'error': 'Your cart is empty'}), 400
    for field in ('name', 'address', 'city', 'state', 'zip'):
        if not (ship.get(field) or '').strip():
            return jsonify({'error': 'Please complete your shipping details'}), 400

    snapshot, subtotal = [], 0
    for it in raw_items:
        product = Product.query.get(it.get('product_id'))
        if not product:
            continue
        qty = max(1, min(20, int(it.get('qty') or 1)))
        subtotal += (product.price_cents or 0) * qty
        snapshot.append({
            'product_id': product.id,
            'title': product.title,
            'price_cents': product.price_cents or 0,
            'qty': qty,
            'image_url': product.image_url,
        })

    if not snapshot:
        return jsonify({'error': 'None of those products are available anymore'}), 400

    shipping_cents = 0 if subtotal >= FREE_SHIP_THRESHOLD_CENTS else FLAT_SHIP_CENTS
    last4 = ''.join(ch for ch in str(data.get('card_last4') or '') if ch.isdigit())[-4:]

    order = Order(
        buyer_id=current_user.id,
        items=json.dumps(snapshot),
        subtotal_cents=subtotal,
        shipping_cents=shipping_cents,
        total_cents=subtotal + shipping_cents,
        ship_name=ship.get('name', '').strip()[:120],
        ship_address=ship.get('address', '').strip()[:255],
        ship_city=ship.get('city', '').strip()[:80],
        ship_state=ship.get('state', '').strip()[:40],
        ship_zip=ship.get('zip', '').strip()[:20],
        card_last4=last4 or None,
        status='paid',
    )
    db.session.add(order)
    db.session.commit()
    return jsonify(order.to_dict()), 201


@shop_routes.route('/orders')
@login_required
def my_orders():
    orders = Order.query.filter_by(buyer_id=current_user.id).order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]})
