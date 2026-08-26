"""user presence — status choice + last_seen

Revision ID: aura_presence01
Revises: aura_bdayloc01
Create Date: 2026-08-25 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'aura_presence01'
down_revision = 'aura_bdayloc01'
branch_labels = None
depends_on = None


def upgrade():
    # env.py sets search_path to SCHEMA in prod, so plain table names resolve there.
    op.add_column('users', sa.Column(
        'presence_status', sa.String(length=10),
        nullable=False, server_default='active'))
    op.add_column('users', sa.Column('last_seen', sa.DateTime(), nullable=True))

    # Backfill existing rows with a spread of states so the sidebar's presence
    # rail has something to show on an already-seeded database. New signups get
    # 'active' + a null last_seen and go green as soon as they make a request.
    op.execute("UPDATE users SET presence_status = 'dnd' WHERE id % 5 = 0")
    op.execute("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id % 3 != 0")


def downgrade():
    op.drop_column('users', 'last_seen')
    op.drop_column('users', 'presence_status')
