# Suggestions — what else to add / do (before & after go-live)

Consumer + Vehicle are functionally complete and tested with real data. This is a
prioritised list of what would make the system more reliable and complete.

## Go-live blockers / high priority
1. **DB transactions** on consumer add (consumer + family + mappings) and vehicle
   add/update (vehicle + running + previous + documents) so a mid-failure can't
   leave half-written/duplicate rows.
2. **One policy table + `is_current` flag** instead of moving rows between the
   running/previous tables (moving = new id, which can orphan linked docs). Keeps
   the journey + document links stable. *(Biggest reliability refactor.)*
3. **Overdue surfacing** — a current policy past its expiry = urgent (lapsed
   cover). Add an "Overdue" badge/filter + push it to the top of Pending.
4. **Wipe the test data** before go-live (Settings → data wipe keeps back-office users).

## Notifications (mostly done)
- ✅ role-filtered feed, bell, assign/renew events, daily renewal-due reminders (7/3/1/0d).
- Add reminders for **Mediclaim / Life** too (currently vehicle only in the cron).
- Optional: email/SMS on `renewal_due` (MSG91 is already integrated for OTP).

## Vehicle
- **Separate OD vs TP renewal reminders** (OD renews yearly while long-term TP runs).
- `getVehicleRenewalSheet` exists but is **unwired** — wire it to a route or delete.
- **Audit log** per policy change (who/when) + **PDF versioning/backups**.
- **Bulk import** of historical policies (CSV) for onboarding 10-year journeys.

## Consumer
- Edit family member + remove-from-household.
- Bulk KYC upload; document expiry tracking (e.g. licence/PUC).

## Cross-cutting / polish
- **Replicate** rich columns + Pending/Closed pattern to **Mediclaim / Loan / Life**
  once those verticals have data.
- **Role-scoped dashboards** for each vertical manager (Loan/Mediclaim/Vehicle/Life)
  showing only their vertical's counts + pending.
- **Building-manager** dashboard variant (consumer + admin done).
- **Exports**: server-side PDF/Excel for renewal sheets (CSV export already on tables).
- **Global search** wired to cross-module results.
- **Data validation**: unique (vehicle, policy no); from < to date checks; pincode/PAN format.
- **Tests**: a staging `TEST_OTP_TOKEN` to enable automated E2E (login is OTP-gated).

## Done (for reference)
Consumers (add/join/family/KYC/services+assignee/single-click view), Vehicle
(full add/edit, TP+OD timelines, nature, nominee, previous policy, docs, renewals,
add-next, **out-of-order reconcile → latest = current**, journey timeline with
View/Download, Pending/Closed tabs), role-based notifications + daily scheduler,
vertical-manager roles, data-wipe (keeps back-office users), CSV exports.
