"""
Exit 0 if the database has no posts yet (so the caller should seed), or
exit 1 if content already exists (skip seeding).

Used by start.sh so that a fresh Render deploy gets demo data once, while
later container restarts keep whatever content exists instead of wiping it.
"""
import sys

from app import app
from app.models import Post

with app.app_context():
    try:
        is_empty = Post.query.count() == 0
    except Exception:
        # Tables may not exist yet on a brand-new database — treat as empty.
        is_empty = True

sys.exit(0 if is_empty else 1)
