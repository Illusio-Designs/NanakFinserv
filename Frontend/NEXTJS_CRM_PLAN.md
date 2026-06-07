# NanakFinserv — Next.js Production CRM: Migration & Design Spec

This document is the single source of truth for converting the current
**Vite + React (CRA-style)** admin app into a **production-grade CRM on Next.js**
that is responsive, component-driven, uses our **own custom UI**, and uses
**line (outline) icons only** — no 3D / filled / coloured glyph icons.

> Scope: this is the plan + conventions. Implement incrementally (see §10),
> page by page, keeping the live API unchanged.

---

## 1. Goals

1. **Next.js (App Router)** instead of Vite/CRA — file-based routing, code
   splitting, image optimization, and a clean path to SSR/ISR for public pages.
2. **Production CRM UX** — consistent sizing, density, spacing, and a proper
   responsive layout (desktop → tablet → mobile).
3. **Reusable component library** — every screen is composed from shared
   primitives; no copy-pasted markup or one-off inline styles.
4. **Custom UI** — keep our own look & feel via design tokens. Do **not** adopt a
   heavy third-party theme kit (no MUI/AntD theme). A headless utility layer
   (Tailwind) is allowed, but the visual design is ours.
5. **Line icons only** — outline icon set, single stroke weight, currentColor.

---

## 2. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14/15, App Router** | `app/` dir, RSC where it helps |
| Language | JS (keep) or migrate to **TS** incrementally | TS recommended for CRM scale |
| Styling | **CSS variables (design tokens) + CSS Modules**; Tailwind optional | Keep custom UI |
| Icons | **lucide-react** (line icons) | Single source; no Fa*/3D icons |
| Data fetching | `axios` wrapper (existing) or `@tanstack/react-query` | react-query recommended for caching/retries |
| Forms | controlled components + small `useForm` helper | keep it custom/light |
| Notifications | `react-hot-toast` (keep) | |
| Auth | token cookie + Next middleware | see §7 |
| Tables | our `<DataTable>` (see §6) | responsive, paginated |

---

## 3. Icon policy (line icons only)

- **Library:** `lucide-react` (consistent 24px line icons, `stroke-width: 1.75`).
- **Rules:**
  - Outline only. **No** filled, duotone, gradient, emoji, or "3D" icons.
  - Icons inherit color via `currentColor`; size via a prop (`size={18}`).
  - One icon set across the whole app — do not mix `react-icons/fa`, emojis, etc.
- **Migration:** replace every `react-icons/fa` (`FaHome`, `FaUser`, …) and any
  emoji used as an icon with the lucide equivalent:
  | Old | New (lucide) |
  |---|---|
  | FaHome | `Home` |
  | FaUsers / 👨‍👩‍👧 | `Users` |
  | FaBuilding | `Building2` |
  | FaCar | `Car` |
  | FaShieldAlt | `ShieldCheck` |
  | FaHandHoldingUsd | `HandCoins` |
  | FiTrash2 | `Trash2` |
  | edit/eye | `Pencil` / `Eye` |
- Wrap in a tiny `<Icon name="..." size=.. />` only if we want a registry;
  otherwise import lucide icons directly.

---

## 4. Design tokens (sizing, spacing, type, color)

Defined once in `src/styles/tokens.css` as CSS variables and consumed everywhere.
**No magic pixel values in components.**

```css
:root {
  /* Spacing scale (4px base) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;

  /* Radius */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-pill: 999px;

  /* Typography (rem-based, fluid) */
  --font-sans: 'Poppins', system-ui, sans-serif;
  --fs-xs: 12px; --fs-sm: 13px; --fs-md: 14px; --fs-lg: 16px;
  --fs-xl: 20px; --fs-2xl: 24px;
  --lh-tight: 1.25; --lh-normal: 1.5;

  /* Color — brand + neutrals (single palette) */
  --c-primary: #4338ca; --c-primary-600: #4f46e5; --c-primary-50: #eef2ff;
  --c-text: #111827; --c-text-muted: #6b7280; --c-border: #e5e7eb;
  --c-bg: #ffffff; --c-bg-subtle: #f9fafb;
  --c-success: #15803d; --c-warning: #b45309; --c-danger: #ef4444;

  /* Elevation */
  --shadow-sm: 0 1px 2px rgba(16,24,40,.06);
  --shadow-md: 0 4px 12px rgba(16,24,40,.08);

  /* Control sizing (consistent CRM density) */
  --control-h: 40px;        /* inputs, buttons */
  --control-h-sm: 32px;
  --sidebar-w: 256px;
  --header-h: 60px;
}
```

**Density rule:** default control height **40px**, table row **48px**, page
gutter `var(--space-6)`. Use the scale — never hardcode `padding: 13px`.

---

## 5. Responsive system

Mobile-first. Breakpoints (match tokens):

| Name | Min width | Layout behaviour |
|---|---|---|
| `sm` | 640px | base mobile → small |
| `md` | 768px | sidebar becomes a slide-over drawer below this |
| `lg` | 1024px | sidebar pinned; 2-col forms |
| `xl` | 1280px | max content width, comfortable density |

Rules:
- **Sidebar:** pinned ≥ `lg`; a hamburger-triggered **drawer** below `lg`.
- **Tables:** horizontal scroll container by default; on `< md` render the
  `<DataTable>` in **card mode** (one card per row) — never a squished table.
- **Forms:** `form-row` is `grid-template-columns: 1fr 1fr` ≥ `md`, single column
  below.
- **Modals:** max-width with `width: min(640px, 92vw)`; full-height sheet on `< sm`.
- Use container queries where a component must adapt to its slot, not the viewport.

---

## 6. Component library (`src/components/ui`)

Single home for primitives. Each is custom, token-driven, accessible, and has
**no business logic**.

```
src/components/ui/
  Button.tsx        variants: primary | secondary | ghost | danger; sizes sm|md
  Input.tsx         label, hint, error, leading/trailing icon
  Select.tsx        custom dropdown (searchable), line chevron icon
  Textarea.tsx
  Checkbox.tsx / Toggle.tsx   (vertical on/off toggles like Settings)
  Modal.tsx         focus-trap, esc-close, responsive sheet on mobile
  DataTable.tsx     columns, data, pagination, row actions, card-mode on mobile,
                    loading skeleton, empty state
  Badge.tsx         status/policy badges (line style)
  Avatar.tsx        initials fallback
  Card.tsx, StatCard.tsx
  Tabs.tsx, Drawer.tsx, Tooltip.tsx, Skeleton.tsx, EmptyState.tsx
  Icon usage: import { Home, Users } from 'lucide-react'
```

Layout components (`src/components/layout`):
```
AppShell  (sidebar + header + content)
Sidebar   (nav, line icons, collapsible groups, drawer on mobile)
Header    (search, profile, notifications)
PageHeader (title + actions row)
```

**DataTable** is the CRM workhorse — replaces the current `common/Table`. It must
support: column defs, server/client pagination, sort, row actions
(`onEdit/onView/...`), custom cell renderers, sticky header, responsive card
mode, loading skeletons, and an empty state.

Conventions:
- No inline `style={{…}}` except truly dynamic values; use CSS Modules + tokens.
- Every interactive element keyboard-accessible; visible focus ring.
- Props typed (TS) or PropTypes (JS).

---

## 7. Auth, API & env in Next.js

Carry over the existing model (do **not** change the backend):

- **Login:** MSG91 widget OTP → `POST /api/user/login` → returns `{ token, user }`.
- **Token storage:** keep the JS-readable `token` cookie (js-cookie) for the
  `token` request header **and** the backend httpOnly cookie. The API client
  attaches `headers: { token }` (existing `authHeaders`).
- **Route protection:** add `middleware.ts` to gate `/dashboard/**` etc. by the
  presence of the token cookie; redirect to `/login` otherwise. Keep the
  client-side role/vertical guards too (see §8).
- **401 handling:** axios interceptor logs out (existing behaviour) — keep the
  "don't bounce on auth endpoints" fix.
- **Env vars:** Vite's `process.env.REACT_APP_*` / `import.meta.env` → Next's
  **`NEXT_PUBLIC_*`** (client) and server-only vars without the prefix.
  | Old | New |
  |---|---|
  | `REACT_APP_API_URL` | `NEXT_PUBLIC_API_URL` |
  | `REACT_APP_MSG91_WIDGET_ID` | `NEXT_PUBLIC_MSG91_WIDGET_ID` |
  | `REACT_APP_MSG91_TOKEN_AUTH` | `NEXT_PUBLIC_MSG91_TOKEN_AUTH` |
- **MSG91 widget script:** load via `next/script` (`strategy="afterInteractive"`).

---

## 8. Roles, categories & verticals (unchanged business rules)

- Keep **`src/config/ids.js`** verbatim (the stable UUID constants for
  `ROLE_IDS`, `CATEGORY_IDS`, `UNIT_CATEGORY_IDS`, `DOCUMENT_IDS`). It must stay
  in sync with `Backend/src/config/ids.js`.
- Role/category checks use the named constants (never magic numbers/strings).
- **Vertical on/off**: fetch settings once (when logged in) and gate both the
  sidebar items and the routes; disabled vertical → redirect to `/dashboard`.
  Builder is also a toggleable vertical.
- Selections (role/category/unit/document) are **dynamic** — fetch options from
  the API and submit the chosen UUID; constants are only for code-decided values
  and permission gating.

---

## 9. Routing map (current → Next App Router)

```
app/
  (public)/
    page.tsx                      ->  HomePage
    services/page.tsx
    about/page.tsx
    contact/page.tsx
    blog/page.tsx, blog/[id]/page.tsx
    login/page.tsx
  (dashboard)/
    layout.tsx                    ->  AppShell (sidebar+header), guarded
    dashboard/page.tsx
    consumer/page.tsx
    builder/page.tsx, builder/building/page.tsx
    unit/[id]/page.tsx
    user/page.tsx
    loan/page.tsx, loan/interested, loan/not-interested, loan/cancelled,
      loan/configuration, loan/completed
    mediclaim/page.tsx, mediclaim/company, mediclaim/company/[id],
      mediclaim/renewal, mediclaim/all-policies
    vehicle-insurance/page.tsx, .../renewal, vehicle-policies
    lifeinsurance/page.tsx, lifeinsurance/renewal
    inquiries/page.tsx
    settings/page.tsx
    dashboard/blog/page.tsx
```

- Most dashboard pages are interactive → mark `'use client'`.
- Public/marketing pages can be Server Components (SEO + speed).
- Group routes with route groups `(public)` / `(dashboard)` so the dashboard
  layout (shell + guard) wraps only the app.

---

## 10. Migration strategy (incremental, low-risk)

1. **Scaffold** a Next app (`app/` router, TS optional) alongside; copy
   `config/ids.js`, `serviceAPI/*`, `styles/tokens.css`.
2. **Foundations first:** tokens, `AppShell`, `Sidebar` (line icons, drawer),
   `Header`, and the `ui/` primitives (`Button`, `Input`, `Select`, `Modal`,
   `DataTable`, `Badge`, `Toggle`).
3. **Auth flow:** login page + MSG91 + middleware guard + API client.
4. **Port pages by domain**, highest-traffic first: Dashboard → Consumer →
   Vehicle → Mediclaim → Loan → Life → Settings → Builder/Unit → Blog/marketing.
   Each page must use `DataTable` + `ui/` primitives (no legacy markup).
5. **Delete** the old Vite app once parity is verified.

Keep the backend and routes identical throughout; this is a frontend-only change.

---

## 11. Definition of done (per screen)

- [ ] Uses `ui/` primitives + tokens (no inline styles, no magic px).
- [ ] Responsive: works at 360px, 768px, 1280px (table → card on mobile).
- [ ] Line icons only (lucide), single stroke weight, `currentColor`.
- [ ] Loading skeletons + empty states + error toasts.
- [ ] Role/vertical guards applied; selections submit UUIDs.
- [ ] Keyboard accessible; visible focus; labelled inputs.
- [ ] No `console.log` noise; no dead/commented blocks.

---

## 12. Do / Don't

**Do:** reuse `ui/` components, use tokens, line icons, fetch options for
selects, keep `ids.js` in sync with backend, test at 3 breakpoints.

**Don't:** add MUI/AntD themes, mix icon sets, use emoji/3D/filled icons,
hardcode colors/spacing, put business logic in `ui/` primitives, or duplicate
table/modal markup.
