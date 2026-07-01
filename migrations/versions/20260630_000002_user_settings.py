"""user settings — privacy, comment/message gates, activity, notif prefs

Revision ID: aura_settings01
Revises: aura_story01
Create Date: 2026-06-30 00:00:02.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'aura_settings01'
down_revision = 'aura_story01'
branch_labels = None
depends_on = None


def upgrade():
    # In production, migrations/env.py sets search_path to SCHEMA before running,
    # so the plain 'users' table name resolves inside the schema (same as siblings).
    # server_default values backfill existing rows on both SQLite (dev) and Postgres (prod).
    op.add_column('users', sa.Column('is_private', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('allow_comments', sa.String(length=20), nullable=False, server_default='everyone'))
    op.add_column('users', sa.Column('allow_messages', sa.String(length=20), nullable=False, server_default='everyone'))
    op.add_column('users', sa.Column('show_activity', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('notif_prefs', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('users', 'notif_prefs')
    op.drop_column('users', 'show_activity')
    op.drop_column('users', 'allow_messages')
    op.drop_column('users', 'allow_comments')
    op.drop_column('users', 'is_private')
