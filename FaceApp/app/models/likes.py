from .db import db, environment, SCHEMA, add_prefix_for_prod

class Like(db.Model):
    __tablename__ = 'likes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship('User', back_populates='likes')
    post = db.relationship('Post', back_populates='likes')
