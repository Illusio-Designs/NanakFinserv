# Frontend — Production Readiness & Work Plan

**Project:** NanakFinserv Web (React 18 / Create React App)
**Date:** 2026-06-03
**Branch:** `claude/gifted-albattani-RFrBq`
**Scope:** `Frontend/` SPA (consumes the backend API)

---

## 📊 Production Readiness Score

> Weighted across the categories that matter for a customer-facing financial SPA.
> CI/CD & containerization excluded by request.

| # | Category | Weight | Score | Weighted | Status |
|---|----------|:------:|:-----:|:--------:|--------|
| 1 | Build & config correctness | 14 | 2/10 | 2.8 | 🔴 API config hardcoded to **DEVELOPMENT** (localhost) |
| 2 | Auth & token security | 13 | 3/10 | 3.9 | 🔴 JWT in JS-readable cookie + localStorage (XSS) |
| 3 | Secrets / config hygiene | 10 | 3/10 | 3.0 | 🟠 MSG91 widget creds hardcoded; `.env` committed |
| 4 | Dependency security | 12 | 2/10 | 2.4 | 🔴 66 vulns (3 critical, 31 high) |
| 5 | Code structure / maintainability | 10 | 3/10 | 3.0 | 🟠 47k lines; single files up to 6.8k |
| 6 | Error handling / UX resilience | 8 | 2/10 | 1.6 | 🟠 No ErrorBoundary |
| 7 | Testing | 7 | 0/10 | 0.0 | 🔴 No tests |
| 8 | Logging & noise | 6 | 2/10 | 1.2 | 🟠 1072 `console.*` shipped to prod |
| 9 | Performance / bundle | 10 | 3/10 | 3.0 | 🟠 dead `firebase` dep, no code-splitting |
| 10 | Accessibility / SEO | 5 | 3/10 | 1.5 | 🟠 minimal |
| 11 | Tooling consistency | 5 | 3/10 | 1.5 | 🟠 CRA + stray vite/webpack configs |
| | **TOTAL** | **100** | | **🔴 23.9 / 100** | **Not production ready** |

### Targets after each phase
| Milestone | Projected | Grade |
|-----------|:---------:|:-----:|
| Current | 23.9 | F |
| After Phase 0 (launch blockers) | ~50 | D |
| After Phase 1 (security/deps) | ~68 | C |
| After Phase 2 (resilience/tests) | ~80 | B |
| After Phase 3 (structure/perf) | ~90 | A |

---

## 🔴 Phase 0 — Launch blockers

| ☐ | Task | File | Why |
|---|------|------|-----|
| ☐ | **Stop hardcoding the API base URL to localhost** | `src/config/apiConfig.js` (`const config = DEVELOPMENT_CONFIG`) | A production build currently points at `http://localhost:5001` → the deployed app can't reach the API. Drive from `process.env`/hostname. |
| ☐ | Move JWT out of JS-accessible storage / harden it | `src/serviceAPI/userAPI.js` (`Cookies.set('token'...)`), `NotificationCenter.js` (localStorage) | Token is readable by any script → XSS = account takeover. Use `Secure; SameSite` cookies (ideally httpOnly set by backend) and stop duplicating in localStorage. |
| ☐ | Move MSG91 `widgetId`/`tokenAuth` to env | `src/pages/Login.js` (3 occurrences) | Hardcoded per-env; can't rotate. Use `REACT_APP_MSG91_*`. |
| ☐ | Untrack `Frontend/.env`; ship only `.env.example` | `Frontend/.env` | Committed config; add to `.gitignore`. |
| ☐ | Strip `console.*` from production builds | 1072 calls | CRA keeps logs in the bundle → leaks data + noise. Add a babel transform / build step or a logger. |

---

## 🟠 Phase 1 — Security & dependencies

| ☐ | Task | Notes |
|---|------|-------|
| ☐ | `npm audit` triage | 66 vulns (3 critical/31 high), mostly via `react-scripts@5` transitive deps |
| ☐ | Remove dead `firebase` dependency | not imported anywhere → bundle bloat + vulns |
| ☐ | Add security headers via host/CDN | CSP, HSTS, X-Frame-Options (SPA served by Apache `.htaccess`) |
| ☐ | Validate/escape any `dangerouslySetInnerHTML` (blogs) | check XSS on rendered HTML content |
| ☐ | Centralize API base + token handling in one axios instance | currently spread across `userAPI.js` |

---

## 🟡 Phase 2 — Resilience & tests

| ☐ | Task | Notes |
|---|------|-------|
| ☐ | Add a top-level **ErrorBoundary** | one thrown render error currently white-screens the app |
| ☐ | Add tests (RTL + jest) | `react-scripts test` exists; 0 tests today |
| ☐ | Consistent loading/error states + 401 handling | redirect to login on token expiry (partially present) |
| ☐ | Replace `alert()` with the toast system already in use | |

---

## 🟢 Phase 3 — Structure, performance, tooling

| ☐ | Task | Notes |
|---|------|-------|
| ☐ | Split giant files | `VehicleInsurance.js` 6825, `MediclaimModal.js` 3474, `userAPI.js` 3186, `Mediclaim-popup.js` 2989 |
| ☐ | Route-based code-splitting (`React.lazy`) | single large bundle today |
| ☐ | Pick **one** build tool | remove stray `vite.config.js` + `webpack.config.js` (app uses CRA) or migrate off CRA (deprecated) |
| ☐ | Add ESLint + Prettier config | only the default CRA `eslintConfig` exists |
| ☐ | Accessibility pass | labels, alt text, focus management, color contrast |

---

## Frontend at a glance
| Metric | Value |
|--------|-------|
| Framework | React 18 (Create React App / react-scripts 5) |
| Source size | ~47,800 lines JS |
| Largest file | `VehicleInsurance.js` — 6,825 lines |
| `console.*` | 1,072 |
| Tests | 0 |
| Dependency vulns | 66 (3 critical, 31 high) |
| Token storage | js-cookie (not httpOnly) + localStorage |
| Build tools present | react-scripts (active) + vite + webpack (stray) |
| Dead deps | `firebase` (unused) |

> Biggest single launch-blocker: **`apiConfig.js` is hardcoded to `DEVELOPMENT_CONFIG`** — a production build talks to `localhost`, so the deployed app is non-functional until this is env-driven.
