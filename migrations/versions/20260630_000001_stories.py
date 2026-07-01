"""stories — 24h ephemeral posts

Revision ID: aura_story01
Revises: aura_24h01
Create Date: 2026-06-30 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'aura_story01'
down_revision = 'aura_24h01'
branch_labels = None
depends_on = None


def upgrade():
    # In production, migrations/env.py sets search_path to SCHEMA before running,
    # so plain table/FK names resolve inside the schema (same as sibling tables).
    op.create_table('stories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('media_url', sa.String(), nullable=False),
        sa.Column('media_type', sa.String(length=10), nullable=True),
        sa.Column('caption', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('stories')
