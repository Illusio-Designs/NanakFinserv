# NanakFinserv — Production Readiness Report

**Date:** 2026-06-03
**Reviewed branch:** `claude/gifted-albattani-RFrBq`
**Scope:** Full-stack review of `Backend/` (Express + MySQL/Sequelize) and `Frontend/` (React)

## Verdict

🔴 **NOT production ready.** The application contains **critical authentication and secrets-management flaws** that would expose customer financial data immediately if deployed as-is. These must be fixed before any production launch. A prioritized action plan is at the end.

---

## 1. Critical security issues (must fix before launch)

### 1.1 Authentication is completely bypassed — no password check
`Backend/app/controllers/user.controller.js` → `verifyUser` (login) looks up a user **by mobile number only** and immediately issues a signed JWT. There is no password, OTP, or any credential verification.

```js
exports.verifyUser = async (req, res) => {
    User.findOne({ where: { [Op.or]: [{ mobileNumber: req.body.mobileNumber }] } })
        .then(async (user) => {
            if (!user) { /* not found */ }
            else {
                const token = jwt.sign(jwtObj, authConfig.secret, { expiresIn: 86400 });
                return res.send({ token, user: userData, message: "valid" });
            }
        })
}
```
**Impact:** Anyone who knows (or guesses) a registered mobile number gets a full admin/user token. This is a total account-takeover vulnerability. `bcrypt` is a dependency but is never used to compare a password on login.

### 1.2 Full environment dump exposed over the public API
The `userChek` endpoint (`GET /api/user/check`, unauthenticated) returns the entire `process.env`:
```js
exports.userChek = async (req, res) => {
    return res.send({ messge: "Api test", env: process?.env });
};
```
**Impact:** Leaks DB credentials, secrets, and all runtime config to any anonymous caller.

### 1.3 Hardcoded secrets committed to the repository
- `Backend/app/config/authConfig.js` — hardcoded **JWT signing secret** and a **Gmail app password** in plaintext.
- `Backend/app/config/db.config.js` — hardcoded MySQL password (`***REMOVED***`).
- `Backend/.env` and `Frontend/.env` are **committed to git** (only `node_modules/` is gitignored on the backend) and contain production DB credentials.

**Impact:** All secrets are in version history. Even if removed now, they must be **rotated** (new JWT secret, new DB password, new Gmail app password) because they are already compromised.

### 1.4 208 user-uploaded PDFs committed to git
`Backend/uploads/` contains 208 tracked PDF files (resumes, admission offers, brochures — i.e. **personal/customer documents**). These should never be in source control and may constitute a privacy/data-protection breach.

### 1.5 Unauthenticated/debug endpoints
- `GET /user/list/all-vehicle-users-debug` — debug route exposing vehicle users, **no auth middleware**.
- `GET /user/download/:filename` — file download with no auth and a path that should be checked for **path-traversal** (`../`).

---

## 2. High-priority issues

| # | Issue | Detail |
|---|-------|--------|
| 2.1 | **No authorization (RBAC)** | Every protected route uses only `verifyToken`; there is no role check. The `adminAuth`/`adminUserAuth` middleware exist but are not wired into routes. Any valid token can hit any endpoint. |
| 2.2 | **Vulnerable dependencies** | Backend uses `axios@0.21.4` (known SSRF/ReDoS CVEs), `jsonwebtoken@8.x` (old), `mysql` *and* `mysql2` both present, plus junk deps `fs` and `path` (npm packages shadowing Node built-ins). Run `npm audit` and upgrade. |
| 2.3 | **CORS misconfiguration** | `app.options("*", cors())` with default config allows all origins for preflight, partially defeating the allow-list. |
| 2.4 | **Error handlers misordered** | The JSON-syntax and global error handlers are registered *before* the routes in `server.js`, so they never catch route errors. The global handler also belongs at the very end. |
| 2.5 | **DB sync disabled** | `db.sequelize.sync` is commented out and migrations are partially disabled "to avoid date issues" — schema state is unmanaged and the server starts even if the DB fails to initialize. |
| 2.6 | **Token stored in a misnamed column** | Login writes the JWT to a `roken` field (typo) and updates `where: { id }` while the model PK is `user_id` — the update likely silently no-ops. |

---

## 3. Architecture & code quality

| Area | Finding |
|------|---------|
| **Monolithic controller** | `user.controller.js` is **13,347 lines** in a single file with ~590 `console.log` statements. No separation into services/controllers per domain. Very hard to maintain or test. |
| **Frontend bloat** | `Frontend/src` is ~47k lines. Single files up to **6,825 lines** (`VehicleInsurance.js`). 817 `console.log` calls across the frontend. |
| **Conflicting build tooling** | Three build systems coexist: `react-scripts` (CRA), `vite.config.js`, and `webpack.config.js` (outputs to `./Final`). Unclear which is canonical; this will confuse CI and deploys. |
| **Hardcoded API config** | `Frontend/src/config/apiConfig.js` force-sets `const config = DEVELOPMENT_CONFIG` (localhost:5001), ignoring environment detection. A production build would point at localhost. |
| **No tests** | Backend `test` script is `exit 1`. No test files anywhere. No coverage. |
| **No CI/CD or containerization** | No Dockerfile, docker-compose, or CI workflow. No reproducible build/deploy pipeline. |
| **Noisy logging** | Verbose emoji `console.log` in request paths and JWT middleware (logs token fragments and decoded payloads) — leaks data and hurts performance. Use a real logger with levels. |

---

## 4. Operational / production-hardening gaps

- **No rate limiting / brute-force protection** (critical given login is by phone number).
- **No security headers** (no `helmet`).
- **No input validation layer** (e.g. `express-validator`/`zod`); request bodies are trusted directly.
- **No HTTPS enforcement / HSTS** at the app layer.
- **No health/readiness separation, no graceful shutdown, no process manager config** (only `nodemon`, which is a dev tool — `start` script runs `nodemon`).
- **File uploads:** 50MB in-memory uploads with no MIME/type validation and predictable static serving.
- **No structured monitoring/alerting, no log aggregation, no `.env.example` for the backend.**

---

## 5. Prioritized remediation plan

### Phase 0 — Stop the bleeding (do immediately)
1. **Implement real authentication**: verify a bcrypt-hashed password (or OTP) in `verifyUser`; remove the find-by-mobile-only flow.
2. **Delete the `userChek` env dump** endpoint.
3. **Remove `.env`, `authConfig.js` secrets, and `Backend/uploads/*` from git**; add proper `.gitignore` entries.
4. **Rotate all leaked secrets**: JWT secret, DB password, Gmail app password.
5. **Remove/secure debug & download routes** (add auth + path-traversal guard).

### Phase 1 — Core security hardening
6. Move all secrets to environment variables / a secrets manager; add `helmet`, `express-rate-limit`, and input validation.
7. Add **role-based authorization** middleware to every route.
8. Fix CORS preflight; tighten the allow-list.
9. `npm audit fix`; upgrade `axios`, `jsonwebtoken`; drop bogus `fs`/`path`/duplicate `mysql` deps.

### Phase 2 — Reliability & correctness
10. Fix `server.js` middleware/error-handler ordering; fail fast if DB init fails.
11. Re-enable managed migrations (Sequelize migrations, not `sync({alter})`); fix the `roken`/`user_id` token-save bug.
12. Replace `console.log` with a leveled logger (e.g. `pino`/`winston`); strip token/PII logging.

### Phase 3 — Maintainability & delivery
13. Split the 13k-line controller and the largest React files into domain modules.
14. Pick **one** frontend build tool; fix `apiConfig.js` to use env-driven config.
15. Add tests (unit + a few integration) and wire CI; add a Dockerfile + deployment pipeline; run via a process manager (PM2/systemd) not nodemon.

---

## 6. Summary scorecard

| Category | Status |
|----------|--------|
| Authentication & Authorization | 🔴 Broken (no password, no RBAC) |
| Secrets management | 🔴 Secrets committed & must be rotated |
| Data privacy (uploads in repo) | 🔴 Customer PDFs in git |
| Dependency security | 🟠 Known-vulnerable versions |
| Error handling & resilience | 🟠 Misordered, DB-failure tolerant in a bad way |
| Code structure / maintainability | 🟠 Monolithic, very large files |
| Testing | 🔴 None |
| CI/CD & containerization | 🔴 None |
| Logging & monitoring | 🟠 Noisy console logs, no monitoring |
| Build/config hygiene | 🟠 Conflicting tools, hardcoded dev config |

**Overall: 🔴 Not production ready.** Phase 0 items are launch-blockers.
