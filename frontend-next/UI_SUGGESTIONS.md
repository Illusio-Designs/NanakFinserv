# UI / UX suggestions — Consumer & Vehicle (and shared)

Prioritised, practical ideas to lift the two core modules to a polished,
production-grade feel. Grouped by impact; ✅ = already done this round.

## Shared / done
- ✅ Serial column, "Show by" page size, always-visible pagination on every table.
- ✅ Popover flips up near the viewport bottom (dropdowns/calendar never clipped).
- ✅ Sticky sidebar, dashboard footer, sidebar no-flash + collapsible role-based groups.
- ✅ Token-protected file downloads via `fileUrl()`; per-area upload folders.

## High impact
1. **Status as colour-dot + label everywhere** (Running = green dot, Closed =
   grey/amber, Overdue = red). Consistent legend across tables + journey.
2. **Overdue treatment**: a current policy past expiry → red "Overdue" badge +
   sort to the top of Pending; a small red count on the Vehicle nav item.
3. **Empty states with a CTA** (e.g. "No policies yet — Add Vehicle Policy"),
   instead of a bare "No records".
4. **Sticky table header** on long lists so column titles stay visible while scrolling.
5. **Row click → View** (whole row clickable), not just the eye icon; keep the
   action icons for edit/extra.
6. **Toasts for every mutation** (add/edit/renew/delete) with an Undo where safe.

## Consumer
7. **Avatar + initials** in the Owner cell; show service chips inline in the row.
8. **Household quick-peek**: hover/expand a head row to see family members without
   opening the modal.
9. **KYC completeness meter** (e.g. "2/3 docs") on the consumer row + a filter for
   "missing KYC".
10. **Inline document drag-and-drop** in the Manage → Documents tab.

## Vehicle
11. **Journey on a single screen**: keep the timeline, add a compact "year rail"
    (2020 ─●─ 2021 ─●─ …) you can click to jump to a policy.
12. **TP vs OD dual progress bars** on the current policy (time elapsed / remaining)
    so the two timelines are visible at a glance.
13. **Renewal countdown** ("expires in 23 days") on Pending/Renewals rows.
14. **Quick filters as chips** above the vehicle table: Running / Closed / Due 30d.
15. **Document thumbnails** (PDF icon + filename) instead of plain links.

## Forms (Add/Edit stepper)
16. **Progress + validation per step** (green tick when a step is complete; block
    Next until required fields are valid) — fewer failed submits.
17. **Autofill from RC/PDF** later (OCR) — capture make/model/reg from the RC book.
18. **Sticky footer** with Back / Next / Save in the stepper modal on mobile.

## Polish
19. **Consistent date format** (e.g. "09 Jun 2026") app-wide via one helper.
20. **Keyboard**: `/` focuses search, `n` opens the primary "Add" action, `Esc`
    closes modals (Esc already works).
21. **Dark-mode pass** using the existing CSS tokens.
22. **Skeletons that match the real layout** (table rows, journey cards) for a
    smoother load.

## Suggested next 3 (best effort/impact)
- **(2) Overdue** surfacing — small backend status + red badge/filter.
- **(13) Renewal countdown** — pure frontend from existing expiry data.
- **(16) Per-step validation** in the stepper — reduces submit errors.
