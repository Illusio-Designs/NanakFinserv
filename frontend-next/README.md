# NanakFinserv CRM — Next.js

Production CRM frontend (Next.js App Router + JSX + Tailwind), built per
`Frontend/NEXTJS_CRM_PLAN.md` and `Frontend/PLAN.md`.

## Stack
- **Next.js 14** (App Router, JSX), **Tailwind CSS** (custom design tokens — no theme kit)
- **lucide-react** line icons (no 3D/filled), **framer-motion** micro-animations
- `axios` API client, `js-cookie` auth, `react-hot-toast`

## Run
```bash
cd frontend-next
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL + MSG91 keys
npm install
npm run dev                        # http://localhost:3000
```

## What's included (foundation — Phases 0–4)
- **Design tokens & unique CSS**: `src/app/globals.css` + `tailwind.config.js`
  (spacing/type/color/control sizing, slim scrollbar, shimmer skeletons, pop animations).
- **Common components** (`src/components/ui`): `Button`, `Input`, `Select`,
  `Badge`, `Card`/`StatCard`, `Modal`, **`StepperModal`** (multi-step),
  **`DataTable`** (search + filter + pagination + row actions + mobile card mode
  + skeletons), `EmptyState`, `Spinner`, `PageHeader`.
- **App shell** (`src/components/layout`): `AppShell` + `Sidebar` (lucide line
  icons, active state, mobile drawer) + `Header` (search, profile, logout).
- **Auth**: `/login` (MSG91 OTP) + `src/middleware.js` route guard + `src/lib/api.js`
  (token header + 401 handling).
- **Pages**: Dashboard (stat cards), **Consumers** (full demo: DataTable +
  search/filter + Add via StepperModal + Edit via Modal + validation), and
  stubs for loan/mediclaim/vehicle/life/builder/users/blog/settings.
- **Shared logic carried over**: `src/config/ids.js` (UUIDs — keep in sync with
  backend), `src/utils/validators.js` (mirrors the API validator).

## Conventions
- Line icons only (lucide). No inline magic px — use tokens / Tailwind scale.
- Every list screen uses `DataTable`; every form modal uses `Modal`/`StepperModal`.
- Selections submit UUIDs from fetched options; role/vertical gating via `ids.js`.

## Next (port remaining domains)
Follow `Frontend/PLAN.md` Phases 5–8: build out loan/mediclaim/vehicle/life,
builder/unit/users, settings (wire verticals API), blog + public pages, then cut
over from the Vite app.
