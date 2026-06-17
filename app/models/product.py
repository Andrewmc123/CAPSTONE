from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class Product(db.Model):
    """A community-shop listing — a user marketing a product for sale,
    TikTok-Shop style. Price is stored in cents to avoid float issues."""
    __tablename__ = 'products'

    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    price_cents = db.Column(db.Integer, nullable=False, default=0)
    image_url = db.Column(db.String)
    category = db.Column(db.String(40))
    link = db.Column(db.String)            # optional external buy link
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seller = db.relationship('User', backref='products')

    def to_dict(self):
        return {
            'id': self.id,
            'seller_id': self.seller_id,
            'title': self.title,
            'description': self.description,
            'price_cents': self.price_cents or 0,
            'price': round((self.price_cents or 0) / 100, 2),
            'image_url': self.image_url,
            'category': self.category,
            'link': self.link,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'seller': self.seller.to_dict_basic() if self.seller else None,
        }
