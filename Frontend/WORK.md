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
| 1 | Build & config correctness | 14 | 9/10 | 12.6 | 🟢 Vite; env-driven; `.htaccess` security headers + caching fix; ESLint config |
| 2 | Auth & token security | 13 | 6/10 | 7.8 | 🟢 cookies now Secure+SameSite=strict (full httpOnly needs backend) |
| 3 | Secrets / config hygiene | 10 | 7/10 | 7.0 | 🟢 `.env` untracked; MSG91 creds env-driven |
| 4 | Dependency security | 12 | 9/10 | 10.8 | 🟢 dead deps removed + **CRA→Vite** → **66→8** (rest: xlsx no-npm-fix, dompurify via jspdf, esbuild dev-only) |
| 5 | Code structure / maintainability | 10 | 4/10 | 4.0 | 🟠 auth storage extracted from userAPI; giant page files still to split |
| 6 | Error handling / UX resilience | 8 | 8/10 | 6.4 | 🟢 ErrorBoundary + 82 blocking `alert()` → non-blocking toasts |
| 7 | Testing | 7 | 7/10 | 4.9 | 🟡 vitest/RTL; ErrorBoundary/apiConfig/suppressConsole/cn/authStorage (12) |
| 8 | Logging & noise | 6 | 6/10 | 3.6 | 🟢 console.* silenced in prod build; env dump removed |
| 9 | Performance / bundle | 10 | 9/10 | 9.0 | 🟢 Vite + route code-splitting + granular vendor chunks |
| 10 | Accessibility / SEO | 5 | 4/10 | 2.0 | 🟠 non-blocking toasts replace alerts; more pending |
| 11 | Tooling consistency | 5 | 10/10 | 5.0 | 🟢 Vite (modern, single tool); CRA removed |
| | **TOTAL** | **100** | | **🟢 73.1 / 100** | **CRA→Vite; security headers; ESLint; auth-storage split; tests** |

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
| ☑ | **Stop hardcoding the API base URL to localhost** | `src/config/apiConfig.js` | Now `REACT_APP_*` env-driven with a hostname fallback; **prod build verified**. |
| 🟡 | Move JWT out of JS-accessible storage / harden it | `src/serviceAPI/userAPI.js` | Cookies now `Secure` (non-localhost) + `SameSite=strict`. Full **httpOnly** requires the backend to set the cookie — follow-up. |
| ☑ | Move MSG91 `widgetId`/`tokenAuth` to env | `src/pages/Login.js` | `REACT_APP_MSG91_WIDGET_ID` / `REACT_APP_MSG91_TOKEN_AUTH` (fallback kept for dev). |
| ☑ | Untrack `Frontend/.env`; ship only `.env.example` | `.gitignore`, `.env.example` | `.env` removed from index + gitignored; example documents MSG91 vars + `GENERATE_SOURCEMAP=false`. |
| ☑ | Strip `console.*` from production builds | `src/config/suppressConsole.js` (imported first in `index.js`) | log/info/debug no-op'd in prod; removed the `process.env` console dump in `environment.js`. |

---

## 🟠 Phase 1 — Security & dependencies

| ☐ | Task | Notes |
|---|------|-------|
| ☑ | `npm audit` triage | removed unused `firebase`/`@metismenu/react`/`metismenu`/`gsap`; `npm audit fix` → **66 → 31**. Remaining are `react-scripts@5` build-time transitive (svgo/nth-check, postcss, serialize-javascript) needing `--force`/CRA migration. |
| ☑ | Remove dead `firebase` dependency | gone (+ other unused deps) |
| ☑ | Add security headers via host/CDN | `.htaccess`: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy + fixed HTML caching |
| ☐ | Validate/escape any `dangerouslySetInnerHTML` (blogs) | check XSS on rendered HTML content |
| ☐ | Centralize API base + token handling in one axios instance | currently spread across `userAPI.js` |

---

## 🟡 Phase 2 — Resilience & tests

| ☐ | Task | Notes |
|---|------|-------|
| ☑ | Add a top-level **ErrorBoundary** | `src/components/ErrorBoundary.js` wraps the app; render errors show a fallback + reload |
| 🟡 | Add tests (RTL + jest) | `setupTests.js` + ErrorBoundary + apiConfig tests (4). More component/page tests still to add |
| ☐ | Consistent loading/error states + 401 handling | redirect to login on token expiry (partially present) |
| ☑ | Replace `alert()` with the toast system already in use | 82 `alert()` → `toast.error` across 15 files |

---

## 🟢 Phase 3 — Structure, performance, tooling

| ☐ | Task | Notes |
|---|------|-------|
| 🟡 | Split giant files | started: auth storage extracted to `authStorage.js`. Remaining: `VehicleInsurance.js` 6825, `MediclaimModal.js` 3474, `userAPI.js` ~3.1k, `Mediclaim-popup.js` 2989 — best split against the running app |
| ☑ | Route-based code-splitting (`React.lazy`) | done — every route lazy-loaded; main bundle 537→64kB gz |
| ☑ | Pick **one** build tool | **Migrated CRA → Vite 5**; tests on vitest; build verified |
| ☑ | Add ESLint + Prettier config | Prettier (`.prettierrc`) + ESLint flat config (`eslint.config.js`) with react/react-hooks; `npm run lint`/`format` |
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
| Dependency vulns | 8 (xlsx/dompurify/esbuild-dev — no safe npm fix) |
| Token storage | js-cookie (not httpOnly) + localStorage |
| Build tool | Vite 5 (migrated off CRA/react-scripts) |
| Dead deps | `firebase` (unused) |

> Biggest single launch-blocker: **`apiConfig.js` is hardcoded to `DEVELOPMENT_CONFIG`** — a production build talks to `localhost`, so the deployed app is non-functional until this is env-driven.
