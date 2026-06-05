# NanakFinserv — Backend API

Node.js / Express REST API (MySQL via Sequelize) for the NanakFinserv platform —
loans, mediclaim, life & vehicle insurance, builders/consumers, and admin.

## Tech stack
- **Express 4**, **Sequelize 6** (MySQL via `mysql2`)
- **JWT** auth with **MSG91** OTP (verified server-side)
- **pino** logging, **helmet**, **express-rate-limit**, **prom-client** metrics
- **Jest + supertest** tests, **Sequelize CLI** migrations

## Project structure
```
Backend/
├── server.js                 # app bootstrap (middleware, security, listen)
├── src/
│   ├── config/               # central config, logger, metrics, sequelize-cli cfg
│   ├── middleware/            # rbac, asyncHandler, uploadsAccess
│   ├── routes/index.js        # aggregates all per-domain routers
│   └── modules/<domain>/      # auth, user, loan, mediclaim, lifeInsurance,
│                              # vehicle, builder, consumer, buildingManager,
│                              # blog, notification, inquiry, dashboard, shared
│                              #   each: *.controller / *.routes / *.service /
│                              #         *.validator / *.test
├── app/                      # legacy: Sequelize models + JWT middleware
├── migrations/               # Sequelize CLI migrations
└── monitoring/               # Prometheus rules + Alertmanager example (see its README)
```

## Setup
```bash
npm ci
cp .env.example .env     # fill in real values (see below)
npm run db:migrate       # apply schema migrations
npm run dev              # nodemon, or: npm start
```

### Environment variables (`.env`)
| Var | Notes |
|-----|-------|
| `DB`, `HOST`, `USER`, `PASSWORD`, `DB_PORT`, `dialect` | MySQL connection |
| `PORT`, `NODE_ENV` | server |
| `JWT_SECRET` | **required in production** — server refuses to boot without it |
| `JWT_EXPIRES_IN` | token lifetime (seconds, default 86400) |
| `MSG91_AUTH_KEY` | **required** — login returns 503 without it |
| `MSG91_WIDGET_ID` | MSG91 widget id |
| `LOG_LEVEL` | `info` recommended in prod |
| `METRICS_TOKEN` | optional — guards `GET /metrics` |
| `SMTP_USER/PASS/HOST/PORT` | only if email is used |

Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Scripts
| Script | Purpose |
|--------|---------|
| `npm start` / `npm run dev` | run the server (node / nodemon) |
| `npm test` / `test:coverage` | Jest test suite |
| `npm run db:migrate` / `db:migrate:undo` | Sequelize migrations |
| `npm run migration:generate -- <name>` | scaffold a migration |

## API surface
- All routes under `/api`. Health: `GET /health` (liveness), `GET /ready` (DB readiness).
- Metrics: `GET /metrics` (Prometheus; optional `METRICS_TOKEN`).
- Auth: `POST /api/user/login` (MSG91 access-token verified server-side → JWT + httpOnly cookie), `POST /api/user/logout`.

## Security model
- **AuthN:** MSG91 OTP verified server-side before issuing a JWT; token accepted via `Authorization`/`token` header **or** httpOnly cookie.
- **AuthZ:** `requireRole` (role groups) + `requireCategory` (verticals: loan=2, mediclaim=4, life=5, vehicle=6) + `requireSelfOrRoles` (object-level). Mirrors the frontend's route guards.
- **Hardening:** helmet, rate limiting (global + stricter on login), CORS allow-list, central error handler, `asyncHandler` on every route, path-traversal-safe downloads, auth-gated `/uploads` (blog images public).
- **Uploads & `.env` are gitignored.** Logger redacts secrets.

## Deployment
```bash
npm ci
npm run db:migrate          # run migrations (boot no longer alters schema)
NODE_ENV=production npm start
```
Run under a process manager (PM2/systemd). The server **fails fast** if the DB
is unreachable and shuts down gracefully on SIGTERM/SIGINT. Put it behind HTTPS.

## ⚠️ Secret rotation (one-time, required)
Earlier git history contained secrets (now purged via `git filter-repo`). Because
they were committed, they are **compromised and must be rotated** on their services:
- **JWT secret** → set a new `JWT_SECRET`
- **DB password** → change in MySQL, update `PASSWORD`
- **Gmail app password** → revoke/recreate, update `SMTP_PASS`
- **MSG91 auth key** → regenerate, update `MSG91_AUTH_KEY`

## Monitoring
Prometheus alert rules + scrape/Alertmanager examples live in `monitoring/`
(see `monitoring/README.md`). Scrape `/metrics`; wire Alertmanager receivers.
