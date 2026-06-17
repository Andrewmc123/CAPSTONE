"""
Community Shop API — users post products for sale and market them,
TikTok-Shop style. Listings are public; creating/deleting requires auth.
"""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.models import db, Product

shop_routes = Blueprint('shop', __name__)


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
