# Backend — Production Readiness & Work Plan

**Project:** NanakFinserv API (Express + MySQL/Sequelize)
**Date:** 2026-06-03
**Branch:** `claude/gifted-albattani-RFrBq`

---

## 📊 Production Readiness Score

> Weighted score across the categories that matter for a financial-services backend.

| # | Category | Weight | Score | Weighted | Status |
|---|----------|:------:|:-----:|:--------:|--------|
| 1 | Authentication | 15 | 0 / 10 | 0.0 | 🔴 No password check on login |
| 2 | Authorization (RBAC) | 12 | 1 / 10 | 1.2 | 🔴 Token-only, no role checks |
| 3 | Secrets management | 12 | 0 / 10 | 0.0 | 🔴 Secrets committed to git |
| 4 | Data privacy / uploads | 8 | 1 / 10 | 0.8 | 🔴 208 customer PDFs in repo |
| 5 | Input validation | 8 | 1 / 10 | 0.8 | 🟠 Request bodies trusted directly |
| 6 | Dependency security | 8 | 3 / 10 | 2.4 | 🟠 Known-vulnerable versions |
| 7 | Error handling & resilience | 8 | 3 / 10 | 2.4 | 🟠 Misordered handlers, starts w/o DB |
| 8 | Logging & monitoring | 7 | 2 / 10 | 1.4 | 🟠 ~590 console.logs, leaks PII |
| 9 | Code structure / maintainability | 7 | 2 / 10 | 1.4 | 🟠 13.3k-line single controller |
| 10 | Testing | 5 | 0 / 10 | 0.0 | 🔴 No tests at all |
| 11 | CI/CD & containerization | 5 | 0 / 10 | 0.0 | 🔴 None |
| 12 | Config & deploy hygiene | 5 | 2 / 10 | 1.0 | 🟠 Runs via nodemon, schema unmanaged |
| | **TOTAL** | **100** | | **🔴 11.8 / 100** | **Not production ready** |

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
| ☐ | Implement real password auth (bcrypt hash + compare) on login | `controllers/user.controller.js` → `verifyUser` | Login matches mobile number only → total account takeover |
| ☐ | Delete the `process.env` dump endpoint | `user.controller.js` → `userChek`, `routes/users.routes.js` | `GET /api/user/check` leaks all secrets to anyone |
| ☐ | Remove committed secrets from git & rotate them | `.env`, `config/authConfig.js`, `config/db.config.js` | JWT secret, DB password, Gmail app password are in history |
| ☐ | Untrack the 208 uploaded PDFs | `Backend/uploads/*` | Customer documents (resumes, offers) in source control |
| ☐ | Fix `.gitignore` (add `.env`, `uploads/`, logs) | `Backend/.gitIgnore` | Only `node_modules/` is ignored today |
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
| ☐ | Split the 13,347-line `user.controller.js` into per-domain modules | See **Target architecture** below — controller + route + service + validator + test per domain |
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
Each module = its own controller + route + service + validator + **test file**.

| ☐ | Module | Owns these existing endpoints (from `users.routes.js`) | Test file |
|---|--------|--------------------------------------------------------|-----------|
| ☐ | `auth` | login, verify, token issue (rewritten w/ bcrypt) | `auth.test.js` |
| ☐ | `user` | user list (consumer/builder/roleWise), roles, add/update user | `user.test.js` |
| ☐ | `vehicle` | vehicle user CRUD, renewal, policies, vehicle/policyplan/policytype | `vehicle.test.js` |
| ☐ | `loan` | loan lists, detail, interested/disburse/cancel, status, configuration | `loan.test.js` |
| ☐ | `mediclaim` | company, product, user, renewal lists | `mediclaim.test.js` |
| ☐ | `lifeInsurance` | CRUD, documents, by-consumer, renewal | `lifeInsurance.test.js` |
| ☐ | `builder` | builder data, units, unit categories, verticals | `builder.test.js` |
| ☐ | `consumer` | consumer add/update, dashboard | `consumer.test.js` |
| ☐ | `buildingManager` | create/assign/list/stats/update/remove | `buildingManager.test.js` |
| ☐ | `blog` | blog CRUD + public list | `blog.test.js` |
| ☐ | `notification` | list, read, read-all, count | `notification.test.js` |
| ☐ | `inquiry` | inquiry add/list + public inquiry | `inquiry.test.js` |
| ☐ | `dashboard` | counts, stats, amount filters | `dashboard.test.js` |
| ☐ | `shared` | code, company-type, downloads | `shared.test.js` |

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
| Routes | ~120 (single `users.routes.js`) |
| Controller size | **13,347 lines** (single file) |
| Models | 50+ |
| `console.log` count | ~590 |
| Tests | 0 |
| Committed secrets | JWT secret, DB password, Gmail app password |
| Committed uploads | 208 PDFs |

---

### How to read the checkboxes
Each `☐` is an open task. As we complete items I'll flip them to `☑` and bump the score line so this file stays the single source of truth for backend production readiness.
