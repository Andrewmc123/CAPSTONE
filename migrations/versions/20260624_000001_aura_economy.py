"""aura economy — bolts, glow, gift aura, live gifts

Revision ID: aura_econ01
Revises: aura_orders01
Create Date: 2026-06-24 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'aura_econ01'
down_revision = 'aura_orders01'
branch_labels = None
depends_on = None


def upgrade():
    # Wallet + clout columns on users. server_default backfills existing rows on
    # both SQLite (dev) and Postgres (prod).
    op.add_column('users', sa.Column('bolts', sa.Integer(), nullable=False, server_default='500'))
    op.add_column('users', sa.Column('glow', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('gift_aura', sa.Integer(), nullable=False, server_default='0'))
    # Tag a live chat message as a gift (drives the on-screen animation).
    op.add_column('live_messages', sa.Column('gift_key', sa.String(length=40), nullable=True))


def downgrade():
    op.drop_column('live_messages', 'gift_key')
    op.drop_column('users', 'gift_aura')
    op.drop_column('users', 'glow')
    op.drop_column('users', 'bolts')
