# NanakFinserv CRM — Next.js Migration: Execution Plan

Actionable, phased roadmap. Pairs with **[NEXTJS_CRM_PLAN.md](./NEXTJS_CRM_PLAN.md)**
(the design/spec). This file is the *order of work* + checklists.

- **Approach:** build the Next app in a `next/` workspace, port domain-by-domain,
  keep the **backend & live API unchanged**, cut over when at parity.
- **Rule:** no phase is "done" until its checklist passes at 360 / 768 / 1280 px
  and uses only `ui/` primitives + tokens + **lucide line icons**.
- **Legend:** `[ ]` todo · `[~]` in progress · `[x]` done.

---

## Phase 0 — Scaffold & foundations
**Goal:** runnable Next app with tokens, app shell, and the auth shell.

- [ ] Create Next 14/15 app (App Router) in `Frontend/next/` (TS recommended).
- [ ] Install deps: `lucide-react`, `axios`, `js-cookie`, `react-hot-toast`,
      `@tanstack/react-query` (optional).
- [ ] Port `src/config/ids.js` (keep in sync with `Backend/src/config/ids.js`).
- [ ] Add `src/styles/tokens.css` (spacing/type/color/control sizing) + global reset.
- [ ] Env: `.env.local` with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MSG91_WIDGET_ID`,
      `NEXT_PUBLIC_MSG91_TOKEN_AUTH`.
- [ ] API client (`lib/api.ts`): axios base + `token` header + 401 interceptor
      (don't bounce on auth endpoints).
- **Done when:** app boots, tokens load, API client compiles.

## Phase 1 — UI primitives (`components/ui`)
**Goal:** the custom component library everything else is built from.

- [ ] `Button` (primary/secondary/ghost/danger · sm/md)
- [ ] `Input`, `Textarea`, `Select` (searchable, line chevron), `Checkbox`, `Toggle`
- [ ] `Modal` (focus-trap, esc, mobile sheet)
- [ ] `DataTable` (columns, pagination, sort, row actions, **card-mode < md**,
      skeleton loading, empty state)
- [ ] `Badge`, `Avatar`, `Card`, `StatCard`, `Tabs`, `Drawer`, `Tooltip`,
      `Skeleton`, `EmptyState`, `PageHeader`
- [ ] `Icon` usage standard: import from `lucide-react`; size via prop.
- **Done when:** a Storybook-style demo page renders all primitives responsively.

## Phase 2 — App shell & navigation
**Goal:** the CRM frame.

- [ ] `AppShell` = `Sidebar` + `Header` + content area.
- [ ] `Sidebar`: nav groups, **lucide line icons**, collapsible; **drawer < lg**.
- [ ] `Header`: search, profile menu, notifications (line icons).
- [ ] Vertical gating: hide nav items for disabled verticals (incl. Builder).
- **Done when:** shell is responsive; sidebar pins ≥ lg, drawer below.

## Phase 3 — Auth
**Goal:** login + route protection mirroring current behaviour.

- [ ] Login page: MSG91 widget via `next/script`, OTP → `POST /api/user/login`.
- [ ] Store `token`/`user` cookies; attach `token` header on requests.
- [ ] `middleware.ts`: gate `(dashboard)` routes by token cookie → `/login`.
- [ ] Client guards: role + vertical (disabled vertical → `/dashboard`).
- **Done when:** admin (7600046416) logs in and lands on the dashboard; direct
      nav to a disabled vertical redirects.

## Phase 4 — Dashboard & Consumer (highest traffic)
- [ ] `dashboard/page` — stat cards + role-based view (consumer/building-mgr).
- [ ] `consumer/page` — `DataTable`, filters, Add/Edit Consumer modal,
      **Family modal** (roster cards + policy badges), **Family column** count,
      "+ Add Family Member" in the edit modal.
- **Done when:** consumer CRUD + family management work end-to-end on the live API.

## Phase 5 — Insurance & loan domains
- [ ] `vehicle-insurance` (+ renewal, policies) — incl. **policy-holder dropdown**
      (household members) when adding a policy.
- [ ] `mediclaim` (+ company, company/[id], renewal, all-policies).
- [ ] `loan` (+ interested, not-interested, cancelled, configuration, completed).
- [ ] `lifeinsurance` (+ renewal).
- [ ] `inquiries`.
- **Done when:** each vertical lists/creates/updates via `DataTable` + `ui/` forms,
      respects vertical toggles, and submits UUIDs from fetched options.

## Phase 6 — Builder, Unit, User, Settings, Blog
- [ ] `builder`, `builder/building`, `unit/[id]` (gated by Builder vertical).
- [ ] `user` (role management table — admin/staff).
- [ ] `settings` (vertical toggles incl. Builder, data wipe).
- [ ] `dashboard/blog` admin + public `blog`, `blog/[id]`.
- **Done when:** back-office screens at parity.

## Phase 7 — Public/marketing pages (SSR)
- [ ] `(public)`: Home, Services, About, Contact, Blog as Server Components (SEO).
- **Done when:** public pages render server-side and pass Lighthouse basics.

## Phase 8 — Cutover & cleanup
- [ ] Full QA at 360/768/1280; cross-check every page vs the old app.
- [ ] Replace **all** `react-icons/fa` + emoji icons with lucide (audit: grep).
- [ ] Configure deploy (Vercel/host) with `NEXT_PUBLIC_*` env vars.
- [ ] Remove the old Vite app; update READMEs.
- **Done when:** Next app is the only frontend, deployed, parity confirmed.

---

## Cross-cutting checklist (applies to every page)
- [ ] `ui/` primitives + tokens only — no inline styles, no magic px.
- [ ] Responsive (table→card on mobile); tested at 3 breakpoints.
- [ ] Line icons only (lucide), single stroke, `currentColor`.
- [ ] Loading skeleton + empty state + error toast.
- [ ] Role/vertical guards; selects submit UUIDs; `ids.js` in sync with backend.
- [ ] Accessible: labels, keyboard, visible focus. No console noise / dead code.

## Risks & mitigations
- **Big page files** (Consumer ~1.2k, Vehicle ~2k lines): port by extracting into
  `DataTable` + small components, not 1:1 copy.
- **MSG91 widget domain allow-list:** add the new domain(s) + localhost.
- **Env drift:** `REACT_APP_*` is ignored by Next — use `NEXT_PUBLIC_*`.
- **ids.js drift:** any new role/category/vertical must be updated on both
  backend and frontend constants together.

## Suggested order (fastest value first)
Phase 0 → 1 → 2 → 3 → **Consumer** → Vehicle → Mediclaim → Loan → Life →
Settings → Builder/Unit/User → public pages → cutover.
