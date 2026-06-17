"""comment replies (parent_id), carousel images on posts, community shop products

Revision ID: aura_rcs_0001
Revises: d2fc2db3a15e
Create Date: 2026-06-16 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'aura_rcs_0001'
down_revision = 'd2fc2db3a15e'
branch_labels = None
depends_on = None


def upgrade():
    # threaded comment replies
    op.add_column('comments', sa.Column('parent_id', sa.Integer(), nullable=True))

    # multi-image carousel posts (JSON array of urls, stored as text)
    op.add_column('posts', sa.Column('images', sa.Text(), nullable=True))

    # community shop listings
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price_cents', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('category', sa.String(length=40), nullable=True),
        sa.Column('link', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('products')
    op.drop_column('posts', 'images')
    op.drop_column('comments', 'parent_id')
