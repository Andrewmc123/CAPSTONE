from flask.cli import AppGroup
from .users import seed_users, undo_users
from .post import seed_posts, undo_posts
from .comments import seed_comments, undo_comments
from .likes import seed_likes, undo_likes
from .notification import seed_notifications, undo_notifications
from .friend import seed_friends, undo_friends
from .follows import seed_follows, undo_follows
from .bookmarks import seed_bookmarks, undo_bookmarks
from .messages import seed_messages, undo_messages
from .products import seed_products, undo_products
from .groups import seed_groups, undo_groups

from app.models.db import db, environment, SCHEMA

# Creates a seed group to hold our commands
# So we can type `flask seed --help`
seed_commands = AppGroup('seed')


# Creates the `flask seed all` command
@seed_commands.command('all')
def seed():
    # Always clear existing data first so re-running `seed all` is idempotent.
    # Without this, dev re-seeds stack on top of each other and every post/photo
    # shows up twice ("double photos"). start.sh still guards the live deploy with
    # seed_if_empty, so user-generated content there is preserved across restarts.
    undo_groups()
    undo_products()
    undo_messages()
    undo_notifications()
    undo_bookmarks()
    undo_follows()
    undo_likes()
    undo_comments()
    undo_posts()
    undo_friends()
    undo_users()
    seed_users()
    seed_friends()
    seed_follows()
    seed_posts()
    seed_comments()
    seed_likes()
    seed_bookmarks()
    seed_notifications()
    seed_messages()
    seed_products()
    seed_groups()


# Creates the `flask seed undo` command
@seed_commands.command('undo')
def undo():
    undo_groups()
    undo_products()
    undo_messages()
    undo_notifications()
    undo_bookmarks()
    undo_follows()
    undo_likes()
    undo_comments()
    undo_posts()
    undo_friends()
    undo_users()
