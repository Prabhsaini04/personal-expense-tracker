# Personal Expense Tracker

Single-user expense tracker. Flask JSON API + vanilla JS/HTML/CSS frontend
(served by Flask), MySQL storage. Runs locally only via Docker Compose,
behind an nginx reverse proxy — see
`.ai-team/project/ARCHITECTURE.md` and `DECISIONS/ADR-PET-001` in the org
repo for the accepted design (no authentication, local-only hosting).

## Running locally

```
cp .env.example .env         # fill in real local passwords if you want
docker compose up -d db
# wait for `docker compose ps` to show db as healthy, then:
docker compose run --rm -e FLASK_APP=wsgi.py \
  -v "$(pwd)/backend/migrations:/app/migrations" app flask db upgrade
docker compose up -d
```

Open http://127.0.0.1:8081/ in a browser. This is the only port published
to the host (loopback-only); Flask and MySQL are reachable only from other
containers on the internal `pet-net` network.

## Running tests

```
docker build -f backend/Dockerfile -t personal-expense-tracker-app:dev .
docker run --rm personal-expense-tracker-app:dev python -m pytest -v
```

Tests run against an in-memory SQLite database (isolated, deterministic)
and do not require the Docker stack to be running.

## Project layout

- `backend/` — Flask API (`app/`), migrations (`migrations/`), tests (`tests/`)
- `frontend/` — vanilla JS/HTML/CSS, served by Flask
- `nginx/` — reverse-proxy config, the only published port
- `docker-compose.yml`, `backend/Dockerfile` — local container packaging

## Status

Implements ENG-PET-001 through ENG-PET-012 (schema, categories/expenses/
reporting APIs, and their frontend views) and ENG-PET-013 (Docker Compose
packaging) from the accepted implementation plan. See the handoff in the
org repo's `07-Projects/personal-expense-tracker/DEVELOPMENT/` folder for
test evidence, assumptions, and open items before this is reviewed.
