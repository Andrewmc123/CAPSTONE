"""24-hour live + daily free gift + base followers

Revision ID: aura_24h01
Revises: aura_econ01
Create Date: 2026-06-26 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'aura_24h01'
down_revision = 'aura_econ01'
branch_labels = None
depends_on = None


def upgrade():
    # Users: a base/seeded follower count + the daily-free-gift timestamp.
    op.add_column('users', sa.Column('extra_followers', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('free_gift_used_at', sa.DateTime(), nullable=True))

    # Live sessions: 24-hour mode + the stats it tracks. rewards_paid guards the
    # top-supporter payout so it can only ever happen once per session.
    op.add_column('live_sessions', sa.Column('is_24h', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('live_sessions', sa.Column('ends_at', sa.DateTime(), nullable=True))
    op.add_column('live_sessions', sa.Column('peak_viewers', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('live_sessions', sa.Column('start_aura', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('live_sessions', sa.Column('start_followers', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('live_sessions', sa.Column('rewards_paid', sa.Boolean(), nullable=False, server_default='0'))

    # Gift messages: mark the ones sent via the daily free gift, so they don't
    # count as paid support in the 24h reward ranking.
    op.add_column('live_messages', sa.Column('free', sa.Boolean(), nullable=False, server_default='0'))


def downgrade():
    op.drop_column('live_messages', 'free')
    op.drop_column('live_sessions', 'rewards_paid')
    op.drop_column('live_sessions', 'start_followers')
    op.drop_column('live_sessions', 'start_aura')
    op.drop_column('live_sessions', 'peak_viewers')
    op.drop_column('live_sessions', 'ends_at')
    op.drop_column('live_sessions', 'is_24h')
    op.drop_column('users', 'free_gift_used_at')
    op.drop_column('users', 'extra_followers')
