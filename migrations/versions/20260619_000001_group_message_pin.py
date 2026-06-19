"""group chat: pinnable messages

Revision ID: aura_grp_pin01
Revises: aura_groups01
Create Date: 2026-06-19 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'aura_grp_pin01'
down_revision = 'aura_groups01'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('group_messages', sa.Column('is_pinned', sa.Boolean(), nullable=True))
    op.execute("UPDATE group_messages SET is_pinned = 0 WHERE is_pinned IS NULL")


def downgrade():
    op.drop_column('group_messages', 'is_pinned')
