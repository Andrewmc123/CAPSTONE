FROM python:3.9.18-alpine3.18

RUN apk add build-base

RUN apk add postgresql-dev gcc python3-dev musl-dev

ARG FLASK_APP
ARG FLASK_ENV
ARG DATABASE_URL
ARG SCHEMA
ARG SECRET_KEY

WORKDIR /var/www

COPY requirements.txt .

RUN pip install -r requirements.txt
RUN pip install psycopg2

COPY . .

# Migrations and the (first-deploy-only) seed run at container start, once the
# live DATABASE_URL is available — see start.sh. gunicorn binds to $PORT.
CMD ["sh", "start.sh"]