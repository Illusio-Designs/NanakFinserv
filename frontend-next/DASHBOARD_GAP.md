# Dashboard — gap vs the old app

What the Next.js dashboard has today, and what's still missing for full parity
with the old Vite dashboard. (Public site parity is tracked separately.)

## ✅ Done
- **Shell**: dark sidebar (collapse/expand + tooltips), header (search, profile, logout), responsive drawer.
- **Dashboard**: live `GET /user/data/counts` (counts, loan pipeline, today's amounts).
- **Consumers**: list (DataTable + search/filter), Add (stepper modal), Edit (modal), validation. *(family modal + documents not yet ported)*
- **Lists wired to real APIs**: Loan, Mediclaim, Vehicle, Life, Users, Builder.
- **Settings**: live vertical toggles (`GET/PUT /admin/settings/verticals`).
- Shared components: Button, Input, Select, **Dropdown**, **PhoneInput (flag)**, **OtpInput**, Badge, Card/StatCard, Modal, **StepperModal**, **DataTable**, **Tooltip**, EmptyState, Spinner, Skeleton (see `/widgets`).

## ❌ Missing / to build (per module)

### Consumers
- [ ] Family / household modal (roster + add member) — backend ready (`/user/household/:mobile`, family add).
- [ ] Consumer KYC documents (view/upload, reuse) — backend ready (`/user/consumer/documents/*`).
- [ ] Per-vertical category assignment UI on edit.

### Vehicle (deepest)
- [ ] Full multi-step **policy form** (vehicle + nominee + running/previous policy + documents) → `POST /user/vehicle/user/add`.
- [ ] KYC reuse (load consumer docs by mobile, only ask missing) + RC book upload.
- [ ] Renewal sheet + renew flow (`/user/vehicle/user/renewal/list`, `/user/renewVehiclePolicy`).
- [ ] Row view/edit/delete + status.

### Loan
- [ ] Status pipelines (interested / not-interested / login / sanction / disbursement / part-payment / completed / cancelled) as tabs/pages.
- [ ] Loan detail view + status update + amount entry.
- [ ] Loan configuration (PDF templates).

### Mediclaim
- [ ] Mediclaim companies + products CRUD (`/user/mediclaim/company`, `/user/mediclaim/product`).
- [ ] Policy create (members/employees) + renewal list.

### Life Insurance
- [ ] Create/edit policy form (proposer / life-assured / nominee / policy / banking).
- [ ] Documents upload + renewal data.

### Users & Roles
- [ ] Add / edit role-user + assign verticals (`/user/data/role/add`, role list).

### Builder / Unit / Building Manager
- [ ] Builder add/edit, units + unit categories, building-manager assignment.

### Blog (admin)
- [ ] Admin blog CRUD (create/edit/delete) — currently only public list.

### Cross-cutting
- [ ] Notifications dropdown (real data).
- [ ] Role/vertical route guards on the client (hide disabled verticals in sidebar).
- [ ] Export (PDF/Excel) where the old app had it.
- [ ] Wire all create/edit forms through the shared validator + the universal upload helper pattern.

## Suggested order
Vehicle (full) → Consumers (family + docs) → Mediclaim → Loan pipelines → Life →
Users/Roles → Builder → Blog admin → notifications/export.
