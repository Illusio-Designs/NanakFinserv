# NanakFinserv CRM (Next.js) — project doc

Single source of truth: status, dashboard/notifications design, API-test results,
reliability + UI suggestions, and **pending work**. Module flow specifics live in
`VEHICLE.md` and `CONSUMER.md`.

Legend: ✅ done · 🟡 partial · ⬜ pending

---

## 1) Module status
| Area | Status | Notes |
|---|---|---|
| App shell (sidebar, header, global search) | ✅ | sticky sidebar; **collapsible role-based dropdown groups**; hides disabled verticals; no-flash (cached) + footer |
| Component library (`/widgets`) | ✅ | Button, Dropdown (searchable+creatable), PhoneInput, OtpInput, Calendar(range), DatePicker/DateRange, Tabs, Switch, Checkbox, Textarea, FileUpload, Tooltip, Modal, StepperModal, **DataTable (serial #, Show-by, pagination, filters, rowActions, CSV)** |
| Public site | ✅ | Home/Services/About/Contact/Blog + promo popup |
| Auth (login OTP) | ✅ | MSG91 widget; no dev bypass |
| Dashboard | ✅ | admin (counts/pipeline/amounts + pending tasks) + consumer variant; building-manager variant ⬜ |
| Notifications | ✅ | role-filtered feed, bell + count + read; fires on add/assign/renew/update; **daily renewal-due reminders (cron)**; **actor name shown** |
| **Activity Log** (`/logs`) | ✅ | Who / Module / Event / Action / time + filters + export |
| Consumers | ✅ | list, add (standalone/join), services+assignee, family, KYC, edit, **single-click full view**, service-name chips |
| Vehicle | ✅ | full add/edit, nature, TP/OD timelines, nominee, previous policy, docs, Policies/Pending/Renewals/Closed tabs, add-next, **single merged policy table (is_current)**, journey timeline |
| Settings | ✅ | vertical toggles + data wipe (keeps back-office users) |
| Users & Roles | ✅ | add/edit with vertical-manager roles; **role-update fixed** (roleId optional, UUID-safe categories) |
| Mediclaim | ✅ | Policies + create + Renewals + Pending + Companies/Products CRUD |
| Loan | ✅ | pipeline tabs + Pending + status update; loan config (PDF) ⬜ |
| Life | ✅ | add/edit + view + Pending + Renewals |
| Builder / Units | ✅ | add/edit + units; unit categories ⬜ |
| Blog admin · Inquiries · Support | ✅ | CRUD / list / page |
| **Uploads** | ✅ | per-area folders (`uploads/consumer-kyc/`, `uploads/vehicle/`); token-protected download via `fileUrl()` |

---

## 2) Dashboard (by role)
Role read from cookie `user`; render the matching variant.
- **Super Admin** — `GET /user/data/counts`: stat cards (Consumers/Loan/Vehicle/
  Mediclaim/Life/Builder), loan pipeline, today's amounts, renewals-due
  (`/user/vehicle/renewal/stats`), and a **pending-tasks** panel.
- **Consumer** — `GET /user/consumer/dashboard`: own policies/renewals/documents.
- **Building Manager** — `GET /user/building-manager/dashboard-stats` (variant ⬜).

## 3) Notifications & Activity Log
- Feed: `GET /user/notifications` (+ `/count`, `/:id/read`, `/read-all`),
  **recipient/role-filtered** (super admin sees all; others see theirs).
- Events fired: user/policy **added**, **assigned**, **renewed/updated**, and
  **renewal_due** (the in-process **scheduler** runs daily: refreshes vehicle
  statuses + reminds 7/3/1/0 days before expiry).
- Each notification resolves the **actor** (`actor_name`) — shown in the bell and
  the Activity Log "Who" column. "System" only for cron events.

---

## 4) API tests (curl, live API)
**Gating / validation** — `GET /public/blog/list` 200; invalid `/public/inquiry`
→ 400; protected routes without token → 401; bogus login → 401. ✅

**Authenticated E2E** (logged in via MSG91 OTP as seeded admin `7600046416`):
| Flow | Result |
|---|---|
| Consumer add + re-add (dedup) | ✅ same user_id, no duplicate |
| Join existing consumer (family) + household | ✅ `family_head_id` set |
| Vehicle add (TP/OD), duplicate-vehicle reject | ✅ created / 400 |
| Add-next / renewal archive (single table) | ✅ running current, rest history, **no dups** |
| Out-of-order multi-year reconcile | ✅ latest = current |
| Merge: running+previous → one table (`is_current`) | ✅ verified; old table dropped |
| Upload KYC → `consumer-kyc/`; download `?token=` | ✅ 200; without token → 401 |
| Multi-year past journey (2020→2027) | ✅ history Closed, current Running |

> Login needs a real MSG91 OTP (no dev bypass), so automated CLI E2E needs a
> browser token or a staging `TEST_OTP_TOKEN`. Test data is removable via the wipe.

---

## 5) Reliability — done & pending
✅ **Done:** single policy table + `is_current` (no cross-table row moves; ids
stable); idempotent reconcile; daily scheduler (status + reminders); per-area
upload folders + token downloads; activity log with actor; recipient-filtered
notifications; consumer-count excludes family; user role-update fix.

✅ **DB transactions / atomicity (done):**
- Consumer add — true DB transaction (user + mappings + per-vertical records commit together).
- Vehicle add — atomic via **rollback-on-failure** (deletes the orphan vehicle + policies/docs if a later step throws).
- Vehicle **update/renew** — wrapped in a DB transaction (user + vehicle + policy archive/update + docs + reconcile commit together; rolls back on any error).

✅ **Also done:** renewal **countdown** ("in N days" / "N days overdue") on Vehicle/
Mediclaim/Life; **Overdue** badge (red) for lapsed current vehicle policies; Pending
sorted overdue-first; renewal reminders extended to **Mediclaim + Life**; shared
`lib/format` date helper ("09 Jun 2026").

✅ Also: **OD vs TP separate reminders**; **per-step form validation** (vehicle Consumer/Vehicle/Policy + consumer Details).

✅ Also: dedicated **audit-log table** (`audit_logs`) + write hooks (consumer/vehicle/
user add-update, renew, wipe) + `/user/audit-logs` endpoint; Activity Log page now
reads it (Who / Action / Module / Detail).

✅ Also: **ISO date normalisation** on write (policy dates → YYYY-MM-DD); **unique DB
constraints** handled on the DB side by the owner. KYC-completeness meter — **not required**.

✅ Also: **per-manager scoping** — a vertical manager's Consumer list AND dashboard
counts (consumers + their vertical) show ONLY consumers assigned to them.

**Go-live prep done by owner:** unique DB constraints added + test data wiped. 🚀

✅ Also: **dark mode** (Auto = dark 6 PM–6 AM, + Light/Dark, persisted, no flash);
**document file-type icons** (PDF/image) in consumer KYC + vehicle journey.

⬜ **Optional (post-launch, infra/config — not blocking):**
1. **PDF versioning / backups** — move uploads to cloud object storage (S3/GCS) with
   versioning, or schedule an uploads-folder backup. Needs a storage choice + creds.
2. **Email/SMS** on renewal_due via MSG91 (needs send creds/templates).
7. Replicate full Pending/Closed + journey patterns to other verticals as they get data.

---

## 6) UI / UX suggestions (Consumer & Vehicle + shared)
**High impact:** colour-dot statuses + legend; Overdue badge/sort/nav-count;
empty-states with a CTA; sticky table header; whole-row click → View; mutation toasts.
**Consumer:** avatar+initials, inline service chips; household quick-peek; KYC
completeness meter + "missing KYC" filter; drag-and-drop docs.
**Vehicle:** clickable journey "year rail"; TP/OD dual progress bars; renewal
countdown ("expires in N days"); quick-filter chips (Running/Closed/Due 30d);
document thumbnails.
**Forms:** per-step validation (block Next until valid); sticky stepper footer;
future RC/PDF OCR autofill.
**Polish:** one date-format helper ("09 Jun 2026"); keyboard shortcuts (`/` search,
`n` add, Esc close); dark mode via existing tokens; layout-matching skeletons.

**Top 3 next:** Overdue surfacing · renewal countdown (frontend-only) · per-step validation.

---

## 7) Pending work (build order)
1. **Reliability**: DB transactions (consumer + vehicle) → Overdue surfacing → data-integrity constraints.
2. **Vehicle UX**: renewal countdown + Running/Closed/Due quick-filter chips + colour-dot status.
3. **Reminders**: extend the scheduler to Mediclaim/Life; OD-vs-TP split.
4. **Replicate** rich tabs (Pending/Closed) + journey patterns to Mediclaim/Loan/Life as they get data.
5. **Dashboards**: building-manager variant; hide disabled-vertical cards; per-manager scoping.
6. **Remaining modules**: loan config (PDF), mediclaim members/employees, unit categories.
7. **Audit log table** + PDF versioning; managers-create-masters; email/SMS notifications.
8. **Cross-cutting**: server-side pagination if a list grows large; route guards by role/vertical; staging `TEST_OTP_TOKEN` for automated E2E.

> Reuse established patterns: find/join consumer by mobile, services + working-person
> assignment, KYC reuse, creatable master dropdowns, DataTable (serial/Show-by/
> filters/rowActions), StepperModal forms, global header search, `fileUrl()` for downloads.
