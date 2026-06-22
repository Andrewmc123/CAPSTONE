"""shop orders (cart checkout)

Revision ID: aura_orders01
Revises: aura_grp_pin01
Create Date: 2026-06-20 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'aura_orders01'
down_revision = 'aura_grp_pin01'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('buyer_id', sa.Integer(), nullable=False),
        sa.Column('items', sa.Text(), nullable=True),
        sa.Column('subtotal_cents', sa.Integer(), nullable=False),
        sa.Column('shipping_cents', sa.Integer(), nullable=False),
        sa.Column('total_cents', sa.Integer(), nullable=False),
        sa.Column('ship_name', sa.String(length=120), nullable=True),
        sa.Column('ship_address', sa.String(length=255), nullable=True),
        sa.Column('ship_city', sa.String(length=80), nullable=True),
        sa.Column('ship_state', sa.String(length=40), nullable=True),
        sa.Column('ship_zip', sa.String(length=20), nullable=True),
        sa.Column('card_last4', sa.String(length=4), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['buyer_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('orders')
