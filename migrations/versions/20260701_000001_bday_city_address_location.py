"""birthdate, city, address on users + location on posts

Revision ID: aura_bdayloc01
Revises: aura_settings01
Create Date: 2026-07-01 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'aura_bdayloc01'
down_revision = 'aura_settings01'
branch_labels = None
depends_on = None


def upgrade():
    # env.py sets search_path to SCHEMA in prod, so plain table names resolve there.
    op.add_column('users', sa.Column('city', sa.String(length=80), nullable=True))
    op.add_column('users', sa.Column('birthdate', sa.String(length=10), nullable=True))
    op.add_column('users', sa.Column('address', sa.String(length=200), nullable=True))
    op.add_column('posts', sa.Column('location', sa.String(length=120), nullable=True))


def downgrade():
    op.drop_column('posts', 'location')
    op.drop_column('users', 'address')
    op.drop_column('users', 'birthdate')
    op.drop_column('users', 'city')
