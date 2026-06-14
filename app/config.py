import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    FLASK_RUN_PORT = os.environ.get('FLASK_RUN_PORT')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # SQLAlchemy 1.4 no longer supports url strings that start with 'postgres'
    # (only 'postgresql') but heroku's postgres add-on automatically sets the
    # url in the hidden config vars to start with postgres.
    # so the connection uri must be updated here (for production)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL').replace('postgres://', 'postgresql://')
    # Echo SQL only when explicitly opted in via SQLALCHEMY_ECHO=true.
    # Defaulting this on in dev produced 30k+ log lines per seed and crashed
    # the Windows console on emoji in seed data (cp1252 UnicodeEncodeError).
    SQLALCHEMY_ECHO = os.environ.get('SQLALCHEMY_ECHO', 'false').lower() == 'true'
