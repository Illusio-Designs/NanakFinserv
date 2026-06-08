# NanakFinserv CRM (Next.js) — status, dashboard & pending work

Single source of truth for the Next.js migration: what's done, the dashboard /
notification design, and what's pending. (Module specifics: see `VEHICLE.md`,
`CONSUMER.md`.)

Legend: ✅ done · 🟡 partial · ⬜ pending

---

## 1) Module status
| Area | Status | Notes |
|---|---|---|
| App shell (dark sidebar, collapse, header, **global search**) | ✅ | sidebar hides disabled verticals |
| Component library (`/widgets`) | ✅ | Button, Input, Select, **Dropdown (searchable+creatable)**, **PhoneInput (flag)**, **OtpInput**, **Calendar (range)**, DatePicker/DateRange, Tabs, Switch, Checkbox, Textarea, Avatar, **FileUpload**, **Tooltip**, Modal, **StepperModal**, **DataTable (filters+rowActions)**, EmptyState, Spinner |
| Public site | ✅ | Home/Services/About/Contact/Blog + promo popup, real content/logo/colors |
| Auth (login OTP) | ✅ | MSG91 widget; OTP boxes |
| Dashboard | 🟡 | admin counts/pipeline/amounts live; role variants + pending-tasks panel ⬜ |
| Consumers | ✅ | list, add (standalone **or join existing**), services+**assignee**, family, KYC docs, edit, view, upload |
| Vehicle | ✅ | full add/edit, nature, TP/Full plan, **TP+OD timelines**, nominee, previous policy, docs, renewals, add-next, auto timeline reconcile |
| Settings | ✅ | vertical toggles + data wipe |
| Loan | 🟡 | pipeline-as-tabs + view; **create + status actions + config** ⬜ |
| Mediclaim | 🟡 | list only; **company/product CRUD → policy → all-policies → renewals** ⬜ |
| Life | 🟡 | list only; **create/edit + renewal** ⬜ |
| Users & Roles | 🟡 | list only; **add/edit role-user + verticals** ⬜ |
| Builder / Unit / Building | ⬜ | list (builder) only |
| Inquiries / Blog admin / Support | ⬜ | public inquiry + public blog exist |

---

## 2) Dashboard — what shows, by role
Role is read from the logged-in user (cookie `user`). Render the matching variant:

**Super Admin / Staff** — `GET /user/data/counts`
- Stat cards: Consumers, Loan, Vehicle, Mediclaim, Life, Builder.
- **Loan pipeline**: interested / not-interested / not-assigned / login / sanction /
  disbursement / part-payment / completed (with counts).
- **Today's amounts**: loaned, disbursed, part-payment.
- **Renewals due** (Vehicle): `GET /user/vehicle/renewal/stats` — expiring this
  week / month / overdue.
- **Pending tasks panel** (see §3).

**Consumer** — `GET /user/consumer/dashboard`
- Their own policies/counts across verticals; upcoming renewals; documents status.

**Building Manager** — `GET /user/building-manager/dashboard-stats`
- Assigned buildings/units stats.

**How it's managed:** all numbers come from the real endpoints (no mock). Cards +
pipeline + amounts + renewal buckets. The sidebar already hides disabled verticals,
so the dashboard should also hide cards for disabled verticals.

---

## 3) Notifications & pending tasks (design)
Backend already provides a notification feed and fires events
(`createNotification`, e.g. `user_added`).

**Notification feed (wire the header bell):**
- `GET /user/notifications` (list) · `GET /user/notifications/count` (badge)
- `PUT /user/notifications/:id/read` · `PUT /user/notifications/read-all`
- Events to surface: **new user added**, **user assigned** to a working person,
  **policy added**, **renewal due**. (Add `createNotification` calls on assign /
  policy-add / nearing-expiry where missing.)

**Pending-tasks list (derived per role, shown on the dashboard):**
- **Renewals due / overdue** — from vehicle renewal list/stats (and the same per
  vertical as those modules land).
- **Unassigned consumers** — consumers with a service but no `user_role_id`
  (working person) → "Assign a working person".
- **New consumers to action** — recently added without policies.
- **Expiring policies** — status `running` with expiry within N days → "Renew".
- Each item links to the relevant row/action (assign, add policy, renew).

**Role-based:** Admin sees all; Staff sees items for consumers/policies assigned to
them (`user_role_id` = their id); Consumer sees their own renewals/documents.

**To build:** `NotificationCenter` (bell dropdown) + a `PendingTasks` dashboard
card; a small helper to derive tasks from the counts/renewal/consumer endpoints.

---

## 4) Pending work (build order)
1. **Dashboard**: role variants (consumer / building-manager) + **Pending-tasks
   panel** + **NotificationCenter** (bell) + hide disabled-vertical cards.
2. **Mediclaim**: company + product CRUD (creatable dropdowns) → policy create
   (members/employees) → all-policies → renewal sheet.
3. **Loan**: create (with join-existing-consumer) → status actions on pipeline →
   loan-details + disburse popups → configuration (PDF templates).
4. **Life**: create/edit + documents → renewal sheet.
5. **Users & Roles**: add/edit role-user + assign verticals.
6. **Builder / Unit / Building**: builder add/edit, units + unit categories,
   building-manager assignment.
7. **Inquiries / Blog admin / Support**: inquiries list, blog CRUD, support page.
8. **Cross-cutting**: exports (PDF/Excel), client role/vertical route guards,
   public Blog detail / Reviews / FAQ, document uploads on the remaining verticals.

> Reuse the established patterns: find/join consumer by mobile, services +
> working-person assignment, KYC reuse, creatable master dropdowns, DataTable with
> auto-filters + rowActions, StepperModal forms, global header search.

---

## 5) Recently added (addons)
- Global header search drives all tables; auto-derived filters; table polish + row
  custom actions (upload/add-next) on desktop + mobile.
- Creatable dropdowns (add policy type / plan / company inline).
- Vehicle: full form, TP/OD timelines (backend columns + date-derived status),
  auto year-by-year reconcile, add-next-policy, document uploads, renewals tab.
- Consumers: join an existing consumer (household), services + assignee in
  add/edit, family modal, KYC documents, view/upload row actions.
- Settings data-wipe; sidebar respects vertical settings; header hydration fix;
  dev cache fix (in-memory webpack cache).
