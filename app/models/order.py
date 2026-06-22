from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime
import json


class Order(db.Model):
    """A shop order. Items are snapshotted as JSON so the receipt is stable even
    if a product is later edited/removed. Payment is demo-only — we store the
    card's last 4 for the receipt and NEVER the full number."""
    __tablename__ = 'orders'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    items = db.Column(db.Text)  # JSON: [{product_id, title, price_cents, qty, image_url}]
    subtotal_cents = db.Column(db.Integer, default=0, nullable=False)
    shipping_cents = db.Column(db.Integer, default=0, nullable=False)
    total_cents = db.Column(db.Integer, default=0, nullable=False)
    ship_name = db.Column(db.String(120))
    ship_address = db.Column(db.String(255))
    ship_city = db.Column(db.String(80))
    ship_state = db.Column(db.String(40))
    ship_zip = db.Column(db.String(20))
    card_last4 = db.Column(db.String(4))
    status = db.Column(db.String(20), default='paid', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    buyer = db.relationship('User')

    def parsed_items(self):
        try:
            return json.loads(self.items) if self.items else []
        except (ValueError, TypeError):
            return []

    def to_dict(self):
        return {
            'id': self.id,
            'buyer_id': self.buyer_id,
            'items': self.parsed_items(),
            'subtotal_cents': self.subtotal_cents or 0,
            'shipping_cents': self.shipping_cents or 0,
            'total_cents': self.total_cents or 0,
            'subtotal': round((self.subtotal_cents or 0) / 100, 2),
            'shipping': round((self.shipping_cents or 0) / 100, 2),
            'total': round((self.total_cents or 0) / 100, 2),
            'ship_name': self.ship_name,
            'ship_address': self.ship_address,
            'ship_city': self.ship_city,
            'ship_state': self.ship_state,
            'ship_zip': self.ship_zip,
            'card_last4': self.card_last4,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
