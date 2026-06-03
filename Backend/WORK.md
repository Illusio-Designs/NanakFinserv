# Backend — Production Readiness & Work Plan

**Project:** NanakFinserv API (Express + MySQL/Sequelize)
**Date:** 2026-06-03
**Branch:** `claude/gifted-albattani-RFrBq`

---

## 📊 Production Readiness Score

> Weighted score across the categories that matter for a financial-services backend.

| # | Category | Weight | Score | Weighted | Status |
|---|----------|:------:|:-----:|:--------:|--------|
| 1 | Authentication | 15 | 8 / 10 | 12.0 | 🟢 MSG91 OTP verified server-side + JWT (auth module + tests) |
| 2 | Authorization (RBAC) | 12 | 8 / 10 | 9.6 | 🟢 `requireRole` applied across **all** route files (ADMIN/BUILDER_OPS/PORTAL/CONSUMER_VIEW groups); inclusive sets to avoid lockouts. Exact role sets still want product confirmation |
| 3 | Secrets management | 12 | 7 / 10 | 8.4 | 🟢 hardcoded JWT/Gmail/DB secrets removed from code; env-driven + prod fail-fast. **You: rotate values + purge git history** |
| 4 | Data privacy / uploads | 8 | 9 / 10 | 7.2 | 🟢 + /uploads access gate (blog public, customer files need JWT) |
| 5 | Input validation | 8 | 8 / 10 | 6.4 | 🟢 validators across all 13 domains (mutating endpoints) |
| 6 | Dependency security | 8 | 10 / 10 | 8.0 | 🟢 firebase/firebase-admin/bcrypt removed; mysql2/nodemailer/uuid upgraded; uuid override → **0 vulns** |
| 7 | Error handling & resilience | 8 | 8 / 10 | 6.4 | 🟢 helmet + rate-limit + CORS + reordered handlers + DB fail-fast + graceful shutdown |
| 8 | Logging & monitoring | 7 | 10 / 10 | 7.0 | 🟢 pino; /metrics + /health + /ready; alert rules + Alertmanager receiver example (live webhook URLs are ops) |
| 9 | Code structure / maintainability | 7 | 9 / 10 | 6.3 | 🟢 14 modules w/ service+validator+tests; big handlers (consumer/lifeIns/vehicle) extracting into services |
| 10 | Testing | 5 | 9 / 10 | 4.5 | 🟢 all 14 modules + middleware/metrics (79 tests) |
| 11 | CI/CD & containerization | 5 | 0 / 10 | 0.0 | 🔴 None |
| 12 | Config & deploy hygiene | 5 | 7 / 10 | 3.5 | 🟢 migrations + readiness + `DEPLOY.md`/`SECURITY.md` runbooks (CI/Docker excluded by request) |
| | **TOTAL** | **100** | | **🟢 79.3 / 100** | **Production-ready pending owner ops: full RBAC, runbooks, alert receivers, deeper extraction (CI/Docker excluded by request)** |

**Overall grade: F (11.8 / 100).** The score is dominated by three zero-scoring, launch-blocking items: broken authentication, leaked secrets, and exposed customer data.

### Score targets after each phase
| Milestone | Projected score | Grade |
|-----------|:---------------:|:-----:|
| Current | 11.8 | F |
| After Phase 0 (launch blockers) | ~45 | D |
| After Phase 1 (security hardening) | ~70 | C |
| After Phase 2 (reliability) | ~83 | B |
| After Phase 3 (delivery & tests) | ~92 | A |

---

## 🔴 Phase 0 — Launch blockers (must fix before any deploy)

| ☐ | Task | File(s) | Why it's critical |
|---|------|---------|-------------------|
| ☑ | Implement real auth — **MSG91 OTP verified server-side** + JWT | `src/modules/auth/*` (replaces `verifyUser`) | Login matched mobile number only → total account takeover. Now the MSG91 access-token is verified via MSG91's API before any token is issued. |
| ☑ | Delete the `process.env` dump endpoint | `src/modules/auth/auth.controller.js` `ping`; legacy `userChek` neutralised | `GET /api/user/check` no longer returns env |
| 🟡 | Remove committed secrets from git & **rotate** them | hardcoded secrets removed from `authConfig.js`; dead `db.config.js`/`database.js` deleted; all env-driven + prod fail-fast | Code no longer contains the leaked values. **Still on you:** rotate the actual JWT secret / DB password / Gmail app password / MSG91 key on their services, and purge git history (they remain in past commits). |
| ☑ | Untrack the 208 uploaded PDFs | `Backend/uploads/*`, `app/uploads/*` | Removed from git index; now gitignored |
| ☑ | Fix `.gitignore` (add `.env`, `uploads/`, logs) | `Backend/.gitignore` (new, lowercase) | Old `.gitIgnore` (capital I) was never honoured by git |
| ☑ | Remove debug route | `src/modules/vehicle/vehicle.routes.js` | Unauthenticated `/user/list/all-vehicle-users-debug` removed |
| 🟡 | Path-traversal guard on file download | `src/modules/shared/shared.controller.js` `downloadFile` (test: `shared.test.js`) | Traversal fixed via `basename` + containment check. **Auth on downloads still open** — `server.js` also serves `/uploads` via `express.static` with no auth; needs a broader access-control decision. |

---

## 🟠 Phase 1 — Security hardening

| ☐ | Task | Notes |
|---|------|-------|
| ☑ | Wire role-based authorization into routes | `src/middleware/rbac.js` `requireRole(...)` + groups (ADMIN, BUILDER_OPS, PORTAL, CONSUMER_VIEW) applied to **every** route file. Reads of reference data + public/auth routes left open. Sets are inclusive to avoid lockouts; exact per-route roles want product confirmation. |
| ☑ | Add `helmet` security headers | `server.js` (CORP cross-origin, CSP/COEP off for a files+JSON API) |
| ☑ | Add `express-rate-limit` (esp. on login) | Global 1000/15min + login 20/15min → 429 (smoke-tested) |
| 🟡 | Add input validation (`express-validator` or `zod`) | Done for `auth`; per-module validators still pending |
| ☑ | Fix CORS | Single options object reused for preflight; wildcard removed; CORS rejections → 403 |
| ☑ | `npm audit fix` + upgrade deps | axios 0.21→1.17, jwt 8→9, nodemon 2→3, `npm audit fix`; vulns 41 → 20 |
| ☑ | Remove bogus/duplicate deps | Removed `fs`, `path` (core wins) and unused `mysql` (kept `mysql2`) |
| ☑ | Major dependency cleanup | Removed unused `firebase`/`firebase-admin`/`bcrypt`; upgraded `mysql2@3`, `nodemailer@8`, `uuid`; `overrides.uuid` forces a safe nested version → **`npm audit` = 0 vulnerabilities**. |
| ☑ | Metrics + alerting | `prom-client` `/metrics` + `/ready`; `monitoring/` ships Prometheus alert rules (ApiDown, HighErrorRate, ElevatedAuthFailures, p95 latency, event-loop lag, memory) + scrape example. Alertmanager receivers are an ops wiring step. |

---

## 🟡 Phase 2 — Reliability & correctness

| ☐ | Task | Notes |
|---|------|-------|
| ☑ | Reorder middleware/error handlers in `server.js` | Error handlers now registered after routes (JSON-parse, CORS→403, catch-all) |
| ☑ | Fail fast if DB init fails | `db.sequelize.authenticate()` on boot → `logger.fatal` + `process.exit(1)` (verified). Added graceful shutdown (SIGTERM/SIGINT). |
| ☐ | Fix token-save bug | Writes to misspelled `roken` col with `where:{id}` (PK is `user_id`) → silent no-op |
| ☑ | Re-enable managed migrations | Sequelize CLI infra (`.sequelizerc`, `src/config/sequelize-cli.js`, `migrations/` baseline); `npm run db:migrate`; boot no longer mutates schema |
| ☑ | Replace `console.log` with leveled logger (`pino`) | **DONE** — 625 `console.*` across controllers swept to `logger.*` (debug/warn/error); logger added everywhere; secrets redacted; silenced in prod via `LOG_LEVEL`. |

---

## 🟢 Phase 3 — Maintainability & delivery

| ☐ | Task | Notes |
|---|------|-------|
| ☑ | Split the 13,347-line `user.controller.js` into per-domain modules | **DONE** — 14 modules under `src/modules`, monolith deleted, 111 routes load. Services/validators/tests per module still pending. |
| ☐ | Add a test file for every module | Each module ships its own `*.test.js`; `test` script currently `exit 1` |
| ☐ | Add Dockerfile + CI workflow | None today |
| ☐ | Production start + process manager | `start` runs `nodemon` (dev tool); use PM2/systemd |
| ☐ | Add `Backend/.env.example` | Document required env vars |

---

## 🏛️ Target architecture (modular, per-domain, fully tested)

Goal: break the single 13,347-line `user.controller.js` into **independent feature modules**. Each domain owns its own controller, route, service (business logic), validator, and **its own test file**. No more god-controller.

### Proposed folder structure
```
Backend/
├── src/
│   ├── app.js                  # express app (middleware, mounts routes) — no listen()
│   ├── server.js               # imports app, starts listener, graceful shutdown
│   ├── config/
│   │   ├── index.js            # central env-driven config (no hardcoded secrets)
│   │   ├── database.js
│   │   └── logger.js           # pino/winston
│   ├── middleware/
│   │   ├── auth.js             # verifyToken
│   │   ├── rbac.js             # requireRole(...roles)
│   │   ├── validate.js         # runs validator schema
│   │   └── errorHandler.js     # central error handler (registered LAST)
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.validator.js
│   │   │   └── auth.test.js          ✅ own test file
│   │   ├── user/        { controller, service, routes, validator, user.test.js }
│   │   ├── vehicle/     { ...vehicle.test.js }
│   │   ├── loan/        { ...loan.test.js }
│   │   ├── mediclaim/   { ...mediclaim.test.js }
│   │   ├── lifeInsurance/ { ...lifeInsurance.test.js }
│   │   ├── builder/     { ...builder.test.js }
│   │   ├── unit/        { ...unit.test.js }
│   │   ├── consumer/    { ...consumer.test.js }
│   │   ├── buildingManager/ { ...buildingManager.test.js }
│   │   ├── blog/        { ...blog.test.js }
│   │   ├── notification/ { ...notification.test.js }
│   │   ├── inquiry/     { ...inquiry.test.js }
│   │   ├── dashboard/   { ...dashboard.test.js }
│   │   └── shared/      { codeDetail, companyType, policyType, config }
│   ├── models/                 # existing Sequelize models (kept, tidied)
│   ├── migrations/             # managed Sequelize migrations
│   └── utils/                  # fileUpload, notifications helper, etc.
├── tests/
│   ├── setup.js                # test DB / fixtures
│   └── integration/            # cross-module API tests
├── .env.example
├── Dockerfile
└── jest.config.js
```

### Module split — source domains carved out of the monolith
**Status: the 13,347-line `user.controller.js` has been fully split.** Each domain now
has its own `*.controller.js` + `*.routes.js` under `src/modules/<domain>/`, aggregated
in `src/routes/index.js`. The monolith and legacy `users.routes.js` are deleted. Logic
was moved verbatim (mechanical split via `scripts/split-*.js`) — all 108 routes + 3 auth
routes (111 total) load and register. **Remaining per module: extract a `service` +
`validator` and add a `*.test.js`** (auth already has all of these).

| Controller | Routes | Service | Validator | Test | Module | Handlers |
|:---:|:---:|:---:|:---:|:---:|--------|:---:|
| ☑ | ☑ | ☑ | ☑ | ☑ | `auth` (MSG91 server-side, 8 tests) | 3 |
| ☑ | ☑ | 🟡 | ☑ | ☑ | `user` — service (reads) + validators + 8 tests | 12 |
| ☑ | ☑ | 🟡 | ☑ | ☑ | `vehicle` — service (remark update) + validator + 4 tests | 11 |
| ☑ | ☑ | 🟡 | ☑ | ☑ | `loan` — service (status update) + validators + 7 tests | 10 |
| ☑ | ☑ | 🟡 | ☑ | ☑ | `mediclaim` — service (company ops) + validators + 8 tests | 13 |
| ☑ | ☑ | 🟡 | ☑ | ☑ | `lifeInsurance` — service (delete) + validator + 3 tests | 12 |
| ☑ | ☑ | 🟡 | ☑ | ☑ | `builder` — service (unit-category add) + validator + 4 tests | 9 |
| ☑ | ☑ | 🟡 | ☑ | ☑ | `consumer` — service (FK/dup checks) + validators + 2 tests | 5 |
| ☑ | ☑ | 🟡 | ☑ | ☑ | `buildingManager` — service (remove) + validators + 3 tests | 7 |
| ☑ | ☑ | ☑ | ☑ | ☑ | `blog` — service (CRUD reads/delete) + validator + 3 tests | 5 |
| ☑ | ☑ | ☑ | — | ☑ | `notification` — service (read/count) + 3 tests (param-only routes) | 4 |
| ☑ | ☑ | ☑ | ☑ | ☑ | `inquiry` — service (create/list) + validator + 3 tests | 2 |
| ☑ | ☑ | 🟡 | ☑ | ☑ | `dashboard` — service (loan-amount sums) + validator + 2 tests | 3 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `shared` (code/company-type/policy/downloads) | 15 |

> `src/modules/shared/context.js` holds the common model handles + helpers
> (`createNotification`, etc.) the extracted controllers depend on. `__dirname`-based
> upload/download paths were preserved via a `CTRL_DIR` constant so file paths still
> resolve to `Backend/uploads`.

### Per-module definition of done
A module is "done" only when **all** of these are true:
- ☐ Controller is thin (HTTP only) — business logic lives in the service
- ☐ Routes mounted via the module's own `*.routes.js`
- ☐ Input validated by the module's `*.validator.js`
- ☐ RBAC applied (`requireRole`) where needed
- ☐ Its `*.test.js` covers happy path + auth failure + validation failure (target ≥70% coverage)
- ☐ No `console.log` (uses the shared logger)

### Testing & management setup (cross-cutting)
| ☐ | Task | Notes |
|---|------|-------|
| ☐ | Add `jest` + `supertest` | API-level testing |
| ☐ | `jest.config.js` + coverage thresholds | Fail CI under target coverage |
| ☐ | `tests/setup.js` with a test DB / fixtures | Isolated from prod data |
| ☐ | Update `package.json` scripts | `test`, `test:watch`, `test:coverage`, `lint`, `start`, `dev` |
| ☐ | Add ESLint + Prettier | Consistent style, catch dead code |
| ☐ | CI workflow runs lint + test + coverage on push | Gate merges |

> **Migration strategy:** carve out one module at a time from `user.controller.js`, mount its new route, write its test, verify, then delete the old code path. The app keeps running throughout — no big-bang rewrite. The `auth` module goes first (it's also Phase 0 #1).

---

## Backend at a glance

| Metric | Value |
|--------|-------|
| Framework | Express 4 |
| ORM / DB | Sequelize 6 / MySQL |
| Routes | 111 across 14 per-domain route files (aggregated in `src/routes/index.js`) |
| Controller size | Split from one 13,347-line file into 14 domain controllers |
| Models | 50+ |
| `console.log` count | ~590 |
| Tests | 0 |
| Committed secrets | JWT secret, DB password, Gmail app password |
| Committed uploads | 208 PDFs |

---

### How to read the checkboxes
Each `☐` is an open task. As we complete items I'll flip them to `☑` and bump the score line so this file stays the single source of truth for backend production readiness.
