# Deploy runbook (Backend)

> CI/CD and containerization are intentionally out of scope. This is the manual
> sequence for a server / PaaS deploy.

## 1. Environment variables
Copy `.env.example` → `.env` (or set these in your platform's config). Required:

| Var | Notes |
|-----|-------|
| `DB`, `HOST`, `USER`, `PASSWORD`, `DB_PORT`, `dialect` | MySQL connection |
| `PORT` | listen port |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | **required in production** (boot fails without it). See SECURITY.md |
| `MSG91_AUTH_KEY` | **required** — login fails closed (503) without it |
| `MSG91_WIDGET_ID` | MSG91 widget id |
| `LOG_LEVEL` | `info` recommended in prod |
| `METRICS_TOKEN` | optional — guards `GET /metrics` |
| `SMTP_USER`/`SMTP_PASS`/`SMTP_HOST`/`SMTP_PORT` | only if email is used |

## 2. Install & migrate
```bash
npm ci                 # install exact deps
npm run db:migrate     # apply schema migrations (no longer done on boot)
npm test               # optional: run the suite
```

## 3. Run
```bash
npm start              # node ./server.js
```
Run under a process manager (systemd / PM2) for restarts. The server
**fails fast** if the DB is unreachable, and shuts down gracefully on
SIGTERM/SIGINT.

## 4. Health & monitoring
- `GET /health` — liveness
- `GET /ready` — readiness (checks the DB) — wire to your load balancer
- `GET /metrics` — Prometheus (see `monitoring/`)

## 5. Rollback
Migrations are reversible where a `down` is defined:
```bash
npm run db:migrate:undo
```
