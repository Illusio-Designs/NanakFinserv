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
| Dashboard | 🟡 | admin counts/pipeline/amounts + **pending-tasks panel** + **NotificationCenter** live; consumer/building-manager role variants ⬜ |
| Notifications | 🟡 | **role-filtered feed**, bell + count + mark-read; fires on add/**assign**/**renew**; renewal-due generator ⬜ |
| Consumers | ✅ | list, add (standalone **or join existing**), services+**assignee**, family, KYC docs, edit, view, upload |
| Vehicle | ✅ | full add/edit, nature, TP/Full plan, **TP+OD timelines**, nominee, previous policy, docs, renewals, add-next, auto timeline reconcile |
| Settings | ✅ | vertical toggles + data wipe |
| Users & Roles | ✅ | list + **add/edit role-user** (role dropdown) |
| Inquiries | ✅ | list (`/user/data/inquiery`) |
| Mediclaim | 🟡 | **Policies + Companies CRUD + Products CRUD** (tabs); policy create + all-policies + renewals ⬜ |
| Loan | 🟡 | pipeline-as-tabs + view; **create + status actions + config** ⬜ |
| Life | 🟡 | list only; **create/edit + renewal** ⬜ |
| Builder / Unit / Building | ⬜ | list (builder) only |
| Blog admin / Support | ⬜ | public inquiry + public blog exist |

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

## 3a) Gap analysis (backend-verified)

**Notifications — what fires today (`createNotification` call sites):**
Only on **add/create**: consumer added, loan/vehicle/mediclaim/life user added,
builder consumer added, new role-user added, building-manager created & assigned.
Model: `notification` = { title, message, type(vehicle|mediclaim|loan|builder|
system), category(mostly `user_added`), user_id (actor), target_user_id (subject),
record_id, is_read }.

**Notification GAPS (clear):**
1. **Feed is NOT role/recipient-filtered.** `getNotifications` filters only by
   `type`/`is_read` from the query — it ignores `req.user`, so **every user sees
   every notification**. Needs filtering by `target_user_id` / role (staff → their
   assigned; consumer → their own).
2. **No "assigned" notification** when a working person is assigned/reassigned to a
   consumer service (only building-manager assign notifies). The "assign user"
   event you want isn't fired on consumer add/edit assignment.
3. **No renewal / expiry notifications.** Nothing fires for "policy due for
   renewal / expiring soon" — there's no scheduled job/cron. Renewal reminders
   are absent.
4. **No update / renew / status-change notifications** (renewVehiclePolicy, policy
   edits, status → completed don't notify).
5. **No pending-task generation** — unassigned consumers / expiring policies aren't
   surfaced; must be derived (client-side or new endpoints).
6. **Coarse categories** — almost everything is `user_added`; no `policy_added`,
   `assigned`, `renewal_due`, `user_updated` to drive per-type UI.

**Dashboard stats — what's provided today:**
`GET /user/data/counts` (admin: counts + loan pipeline + today's amounts),
`GET /user/consumer/dashboard`, `GET /user/building-manager/dashboard-stats`,
`GET /user/vehicle/renewal/stats`.

**Dashboard GAPS (clear):**
1. **counts is admin-only & global, not per-staff** — a staff user sees the whole
   org's numbers, not the consumers/policies assigned to them (`user_role_id`).
2. **Renewals due not in the main counts** — only Vehicle has renewal stats;
   Mediclaim/Life/Loan have no expiry/renewal counts.
3. **No pending-task counts** (unassigned consumers, expiring policies, new-to-assign).
4. **Notification count not surfaced** on the dashboard.
5. **Role variants not wired on the frontend** — backend has consumer &
   building-manager dashboards, but the UI renders only the admin counts.

**To close the gaps (backend + frontend):**
- Backend: filter `getNotifications` by recipient/role; add `createNotification`
  on **assign** (consumer service) and **renew/update**; add a **renewal-due**
  generator (cron or compute-on-read) emitting `renewal_due`; optionally extend
  `/user/data/counts` with renewals-due + pending-task counts (and a per-staff
  variant).
- Frontend: NotificationCenter bell (filtered feed + count), dashboard
  Pending-tasks panel (derive from counts/renewal/consumer endpoints), and the
  consumer / building-manager dashboard variants.

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
