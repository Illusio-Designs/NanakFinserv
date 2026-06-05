# NanakFinserv — Frontend (Web)

React 18 single-page app (built with **Vite 5**) for the NanakFinserv platform —
public site + role-based dashboards (loan, mediclaim, life/vehicle insurance,
builder/consumer management). Consumes the backend API.

## Tech stack
- **React 18** + **react-router-dom 6**, built with **Vite 5**
- **axios** API layer, **react-hot-toast** notifications, **js-cookie** session
- **MSG91** OTP login widget
- **vitest + @testing-library/react** tests, **ESLint (flat) + Prettier**

## Project structure
```
Frontend/
├── index.html                # Vite entry
├── vite.config.js            # Vite + vitest config
├── src/
│   ├── index.js / App.js      # entry + router (route-based code-splitting)
│   ├── config/                # apiConfig (env-driven), suppressConsole
│   ├── components/            # shared UI incl. ErrorBoundary
│   ├── pages/ , pages/dashboard/   # route components (lazy-loaded)
│   ├── serviceAPI/            # API layer: apiBase, authStorage, *Api, userAPI
│   └── styles/
└── public/                   # static assets served at /
```

## Setup
```bash
npm ci
cp .env.example .env     # set the API + MSG91 values for your environment
npm run dev              # Vite dev server (http://localhost:3000)
```

### Environment variables (`.env`, build-time)
| Var | Notes |
|-----|-------|
| `REACT_APP_API_URL` | backend API base, e.g. `https://api.nanakfinserv.com/api` |
| `REACT_APP_DOWNLOAD_URL` | file download base |
| `REACT_APP_BASE_URL` | backend origin |
| `REACT_APP_MSG91_WIDGET_ID` / `REACT_APP_MSG91_TOKEN_AUTH` | MSG91 OTP widget |
| `NODE_ENV` | `production` for prod builds |
| `GENERATE_SOURCEMAP` | `false` to skip source maps |

If env vars are unset, `apiConfig` falls back by hostname (localhost → dev API,
otherwise prod API).

## Scripts
| Script | Purpose |
|--------|---------|
| `npm run dev` / `npm start` | Vite dev server |
| `npm run build` | production build → `build/` |
| `npm run preview` | serve the built app |
| `npm test` / `test:watch` | vitest |
| `npm run lint` / `format` | ESLint / Prettier |

## Deployment
```bash
npm ci
npm run build            # outputs to build/
# deploy build/ to any static host (Apache .htaccess included for SPA routing,
# security headers (HSTS/CSP/X-Frame-Options), and asset caching)
```
Set `REACT_APP_API_URL` to the correct backend for the target environment
**before** building (values are inlined at build time).

## Notes
- **Auth/session:** the OTP is collected via the MSG91 widget; the resulting
  access-token is sent to the backend, which verifies it server-side and returns
  a JWT (stored in a `Secure`/`SameSite` cookie; the backend also sets an
  httpOnly cookie).
- **Resilience:** a top-level `ErrorBoundary` prevents white-screens; user
  messages use toasts.
- **Performance:** routes are lazy-loaded (code-split) to keep the initial bundle small.
