"""tiktok transform: video fields on posts, gif comments, follows, bookmarks, comment_likes, user bio

Revision ID: b41f20c9d3aa
Revises: ec31076c7ba7
Create Date: 2026-06-12 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa
import os

environment = os.getenv("FLASK_ENV")
SCHEMA = os.environ.get("SCHEMA")

# revision identifiers, used by Alembic.
revision = 'b41f20c9d3aa'
down_revision = 'ec31076c7ba7'
branch_labels = None
depends_on = None


def upgrade():
    # --- posts: video / sound / engagement columns ---
    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('video_url', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('media_type', sa.String(length=10), nullable=True, server_default='image'))
        batch_op.add_column(sa.Column('sound_name', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('sound_url', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('views', sa.Integer(), nullable=True, server_default='0'))
        batch_op.add_column(sa.Column('shares', sa.Integer(), nullable=True, server_default='0'))
        batch_op.add_column(sa.Column('edit_data', sa.Text(), nullable=True))

    # --- comments: optional gif attachment ---
    with op.batch_alter_table('comments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('gif_url', sa.String(), nullable=True))

    # --- users: profile bio ---
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('bio', sa.String(length=255), nullable=True, server_default=''))

    # --- follows (asymmetric follower graph) ---
    op.create_table('follows',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('follower_id', sa.Integer(), nullable=False),
        sa.Column('followed_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['follower_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['followed_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('follower_id', 'followed_id', name='uq_follower_followed')
    )

    # --- bookmarks (favorites) ---
    op.create_table('bookmarks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'post_id', name='uq_user_post_bookmark')
    )

    # --- comment likes ---
    op.create_table('comment_likes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('comment_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['comment_id'], ['comments.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'comment_id', name='uq_user_comment_like')
    )

    if environment == "production":
        op.execute(f"ALTER TABLE follows SET SCHEMA {SCHEMA};")
        op.execute(f"ALTER TABLE bookmarks SET SCHEMA {SCHEMA};")
        op.execute(f"ALTER TABLE comment_likes SET SCHEMA {SCHEMA};")


def downgrade():
    op.drop_table('comment_likes')
    op.drop_table('bookmarks')
    op.drop_table('follows')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('bio')

    with op.batch_alter_table('comments', schema=None) as batch_op:
        batch_op.drop_column('gif_url')

    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.drop_column('edit_data')
        batch_op.drop_column('shares')
        batch_op.drop_column('views')
        batch_op.drop_column('sound_url')
        batch_op.drop_column('sound_name')
        batch_op.drop_column('media_type')
        batch_op.drop_column('video_url')
