#!/usr/bin/env sh
# Container start script for Render (and any Docker host).
# Runs DB migrations every boot (idempotent), seeds demo data only on the
# first deploy (so restarts don't wipe content), then starts gunicorn.
set -e

echo "==> Running database migrations"
flask db upgrade

echo "==> Checking whether to seed demo data"
if python seed_if_empty.py; then
  echo "==> Empty database detected — seeding ABLN demo content"
  flask seed all
else
  echo "==> Database already has content — skipping seed"
fi

echo "==> Starting gunicorn"
exec gunicorn app:app --bind "0.0.0.0:${PORT:-8000}" --workers 2 --timeout 120
