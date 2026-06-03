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
| 1 | Build & config correctness | 14 | 7/10 | 9.8 | 🟢 env-driven API config; **prod build verified** (tooling cleanup pending) |
| 2 | Auth & token security | 13 | 6/10 | 7.8 | 🟢 cookies now Secure+SameSite=strict (full httpOnly needs backend) |
| 3 | Secrets / config hygiene | 10 | 7/10 | 7.0 | 🟢 `.env` untracked; MSG91 creds env-driven |
| 4 | Dependency security | 12 | 6/10 | 7.2 | 🟢 removed dead firebase/metismenu/gsap; `npm audit fix` → 66→31 (rest are CRA build-time transitive) |
| 5 | Code structure / maintainability | 10 | 3/10 | 3.0 | 🟠 47k lines; single files up to 6.8k |
| 6 | Error handling / UX resilience | 8 | 7/10 | 5.6 | 🟢 top-level ErrorBoundary (no more white-screen) + test |
| 7 | Testing | 7 | 4/10 | 2.8 | 🟡 jest/RTL wired (`setupTests.js`) + ErrorBoundary tests |
| 8 | Logging & noise | 6 | 6/10 | 3.6 | 🟢 console.* silenced in prod build; env dump removed |
| 9 | Performance / bundle | 10 | 8/10 | 8.0 | 🟢 route-based code-splitting → main bundle **537→64kB gz** |
| 10 | Accessibility / SEO | 5 | 3/10 | 1.5 | 🟠 minimal |
| 11 | Tooling consistency | 5 | 7/10 | 3.5 | 🟢 stray vite/webpack configs removed (CRA only) |
| | **TOTAL** | **100** | | **🟠 59.8 / 100** | **Phase 0–2 + perf code-splitting done** |

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
| ☐ | Add security headers via host/CDN | CSP, HSTS, X-Frame-Options (SPA served by Apache `.htaccess`) |
| ☐ | Validate/escape any `dangerouslySetInnerHTML` (blogs) | check XSS on rendered HTML content |
| ☐ | Centralize API base + token handling in one axios instance | currently spread across `userAPI.js` |

---

## 🟡 Phase 2 — Resilience & tests

| ☐ | Task | Notes |
|---|------|-------|
| ☑ | Add a top-level **ErrorBoundary** | `src/components/ErrorBoundary.js` wraps the app; render errors show a fallback + reload |
| 🟡 | Add tests (RTL + jest) | `setupTests.js` + ErrorBoundary tests (2). More component/page tests still to add |
| ☐ | Consistent loading/error states + 401 handling | redirect to login on token expiry (partially present) |
| ☐ | Replace `alert()` with the toast system already in use | |

---

## 🟢 Phase 3 — Structure, performance, tooling

| ☐ | Task | Notes |
|---|------|-------|
| ☐ | Split giant files | `VehicleInsurance.js` 6825, `MediclaimModal.js` 3474, `userAPI.js` 3186, `Mediclaim-popup.js` 2989 |
| ☑ | Route-based code-splitting (`React.lazy`) | done — every route lazy-loaded; main bundle 537→64kB gz |
| ☑ | Pick **one** build tool | removed stray `vite.config.js` + `webpack.config.js` (CRA is canonical) |
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
