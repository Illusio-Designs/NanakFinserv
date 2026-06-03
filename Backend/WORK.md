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
| 2 | Authorization (RBAC) | 12 | 1 / 10 | 1.2 | 🔴 Token-only, no role checks |
| 3 | Secrets management | 12 | 4 / 10 | 4.8 | 🟡 `.env` untracked + env-driven config; rotation still pending |
| 4 | Data privacy / uploads | 8 | 7 / 10 | 5.6 | 🟢 Uploads untracked & gitignored (history purge pending) |
| 5 | Input validation | 8 | 1 / 10 | 0.8 | 🟠 Request bodies trusted directly |
| 6 | Dependency security | 8 | 3 / 10 | 2.4 | 🟠 Known-vulnerable versions |
| 7 | Error handling & resilience | 8 | 3 / 10 | 2.4 | 🟠 Misordered handlers, starts w/o DB |
| 8 | Logging & monitoring | 7 | 2 / 10 | 1.4 | 🟠 ~590 console.logs, leaks PII |
| 9 | Code structure / maintainability | 7 | 6 / 10 | 4.2 | 🟢 Monolith split into 14 per-domain modules (services/validators pending) |
| 10 | Testing | 5 | 2 / 10 | 1.0 | 🟡 Jest+supertest set up; auth module covered |
| 11 | CI/CD & containerization | 5 | 0 / 10 | 0.0 | 🔴 None |
| 12 | Config & deploy hygiene | 5 | 2 / 10 | 1.0 | 🟠 Runs via nodemon, schema unmanaged |
| | **TOTAL** | **100** | | **🟠 36.8 / 100** | **Not production ready (auth + full module split landed)** |

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
| 🟡 | Remove committed secrets from git & **rotate** them | `.env` untracked; `config/authConfig.js`, `config/db.config.js` still hold constants | `.env` removed from index. **Rotation of JWT secret / DB password / Gmail password is still required by you** (they remain in git history). |
| ☑ | Untrack the 208 uploaded PDFs | `Backend/uploads/*`, `app/uploads/*` | Removed from git index; now gitignored |
| ☑ | Fix `.gitignore` (add `.env`, `uploads/`, logs) | `Backend/.gitignore` (new, lowercase) | Old `.gitIgnore` (capital I) was never honoured by git |
| ☐ | Remove debug route | `routes/users.routes.js` → `/user/list/all-vehicle-users-debug` | Unauthenticated data exposure |
| ☐ | Add auth + path-traversal guard to file download | `routes/users.routes.js` → `/user/download/:filename` | Unauthenticated, `../` traversal risk |

---

## 🟠 Phase 1 — Security hardening

| ☐ | Task | Notes |
|---|------|-------|
| ☐ | Wire role-based authorization into routes | `adminAuth`/`adminUserAuth` middleware exist but are unused |
| ☐ | Add `helmet` security headers | |
| ☐ | Add `express-rate-limit` (esp. on login) | Brute-force protection |
| ☐ | Add input validation (`express-validator` or `zod`) | Bodies are trusted directly today |
| ☐ | Fix CORS | `app.options("*", cors())` opens preflight to all origins |
| ☐ | `npm audit fix` + upgrade deps | `axios@0.21.4`, old `jsonwebtoken` |
| ☐ | Remove bogus/duplicate deps | `fs`, `path` npm packages; drop one of `mysql`/`mysql2` |

---

## 🟡 Phase 2 — Reliability & correctness

| ☐ | Task | Notes |
|---|------|-------|
| ☐ | Reorder middleware/error handlers in `server.js` | Handlers are before routes → never fire |
| ☐ | Fail fast if DB init fails | Server currently starts anyway |
| ☐ | Fix token-save bug | Writes to misspelled `roken` col with `where:{id}` (PK is `user_id`) → silent no-op |
| ☐ | Re-enable managed migrations | Replace disabled `sync`/date-fix hacks with Sequelize migrations |
| ☐ | Replace `console.log` with leveled logger (`pino`/`winston`) | ~590 logs, some print tokens/PII |

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
| ☑ | ☑ | ☐ | ☐ | ☐ | `user` | 12 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `vehicle` | 11 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `loan` | 10 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `mediclaim` | 13 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `lifeInsurance` | 12 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `builder` | 9 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `consumer` | 5 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `buildingManager` | 7 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `blog` | 5 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `notification` | 4 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `inquiry` | 2 |
| ☑ | ☑ | ☐ | ☐ | ☐ | `dashboard` | 3 |
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
