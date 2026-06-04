# Staging Validation & Smoke‑Test Checklist

Run this in a **staging environment with a real MySQL DB** before production, and
again before tackling the remaining big-file refactors. It validates the
production-readiness work in `Backend/WORK.md` and `Frontend/WORK.md`.

---

## 1. Backend — deploy & boot

```bash
cd Backend
npm ci
cp .env.example .env        # then fill REAL values (see below)
npm run db:migrate          # applies the baseline migration
npm test                    # 100 tests should pass
npm start                   # node ./server.js
```

**Required env (`Backend/.env`)** — use freshly ROTATED secrets (see `Backend/SECURITY.md`):
- `DB`, `HOST`, `USER`, `PASSWORD`, `DB_PORT`, `dialect`
- `PORT`, `NODE_ENV=production`
- `JWT_SECRET` (required — server refuses to boot without it)
- `MSG91_AUTH_KEY` (required — login returns 503 without it), `MSG91_WIDGET_ID`
- optional: `LOG_LEVEL=info`, `METRICS_TOKEN`, `SMTP_*`

**Boot checks**
- [ ] Server logs "Database connection established" then "Server is running".
- [ ] With a bad DB password it **fails fast** (FATAL + exit), does NOT serve.
- [ ] `GET /health` → `{status:"ok"}`
- [ ] `GET /ready` → `{status:"ready"}` (200) when DB up; 503 when DB down.
- [ ] `GET /metrics` → Prometheus text (or 401 if `METRICS_TOKEN` set and absent).

## 2. Backend — API smoke (use a REST client)
- [ ] `POST /api/user/login` with a valid `mobileNumber` + **no/!invalid `accessToken`** → 401 (server-side OTP check working).
- [ ] `POST /api/user/login` with a valid MSG91 `accessToken` → 200 + JWT.
- [ ] A protected route without a token → 401; with a consumer token hitting a staff route → 403 (RBAC).
- [ ] `GET /api/user/download/<validfile>` works; `..%2f..%2fetc%2fpasswd` does NOT escape uploads.
- [ ] `GET /uploads/blog-*.jpg` works without auth; `GET /uploads/<other>.pdf` → 401 without token.

## 3. Frontend — build & deploy

```bash
cd Frontend
npm ci
cp .env.example .env        # set REACT_APP_API_URL etc. for the environment
npm run build               # Vite -> build/
npm test                    # 12 tests should pass
# deploy build/ behind Apache (.htaccess included) or any static host
```

- [ ] Confirm the built app points at the **staging API URL** (not localhost).
      `grep -ro "api\.nanakfinserv\|localhost:5001" build/assets | head` should show the intended host.
- [ ] Response headers include `Strict-Transport-Security`, `Content-Security-Policy`,
      `X-Frame-Options`, `X-Content-Type-Options` (from `.htaccess`).
- [ ] `index.html` is served `no-cache`; hashed assets are `immutable`.

## 4. Frontend — manual flow smoke (browser)
- [ ] **OTP login**: enter mobile → receive OTP (MSG91) → verify → lands on dashboard.
      Confirm the `token` cookie is `Secure` + `SameSite=Strict` (DevTools → Application).
- [ ] A render error shows the **ErrorBoundary** fallback (not a white screen).
- [ ] Validation/error messages appear as **toasts** (no native `alert()` popups).
- [ ] Each role sees the right pages; a consumer cannot open staff dashboards.
- [ ] Per-domain flows work: Loan list/status, Mediclaim company/product, Vehicle add/renewal,
      Life-insurance create + document upload, Builder/Consumer onboarding, Blog, Inquiries.
- [ ] File upload + download work end-to-end (with the new `/uploads` auth gate).
- [ ] In production build, the browser console is quiet (no debug logs / no `process.env` dump).
- [ ] Network tab: route chunks load lazily as you navigate (code-splitting).

## 5. Known follow-ups (validate, then schedule)
- [ ] **httpOnly cookies**: coordinated FE+BE change (backend sets the cookie; FE stops reading it). Needs CSRF handling.
- [ ] **Remaining giant-file splits** (`VehicleInsurance.js`, `MediclaimModal.js`, rest of `userAPI.js`) — do incrementally **with the app running**, clicking each flow after every move.
- [ ] **Residual deps**: backend `npm audit` = 0; frontend = 8 (xlsx/dompurify/esbuild-dev — no safe npm fix; revisit when upstreams release fixes).
- [ ] Wire real Alertmanager receivers (`Backend/monitoring/`) and confirm alerts fire.

---
_Backend score: 87.4/100 · Frontend score: 73.1/100 (CI/CD excluded by request)._
