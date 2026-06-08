# Vehicle Policy Management — user flow

> **Completeness: ~95% (functionally complete).** Done: full add/edit, nature
> (Fresh/Renewal/Portability), Policy Type + Plan (TP/Comprehensive/Full) +
> Company as creatable dropdowns, **TP & OD/Full timelines**, nominee, previous
> (past) policy, document uploads (RC + running/previous PDF), renewals tab +
> renew + add-next, and **auto year-by-year reconcile** with date-derived status.
> Pending: renewal-sheet bulk export, and richer history-timeline display in the
> view modal. Requires the backend deployed (TP/OD columns + reconcile).


How vehicle insurance is managed in the CRM (consumer-linked, TP/OD timelines,
year-by-year history). Page: **Dashboard → Vehicle** (`/vehicle`).

## Screen layout
- **Tabs:** **Policies** (all running policies) and **Renewals** (policies due / renew).
- **Add Vehicle Policy** button → multi-step form.
- Each row actions: **View** (read-only details), **Edit** (full form prefilled),
  and **Add next policy / renew** (file-plus). Renewals rows also have a **Renew**
  button. Edit/Add-next are available on **both** tabs.
- Search via the global header search; **Status** filter on Policies; **Expiry**
  date-range filter on Renewals; the toolbar shows a live **record count**.

## Add / Edit flow (stepper)
1. **Consumer** — type the mobile and press **Find**:
   - found → name/email prefilled (existing consumer, linked by mobile) and the
     **KYC on file** is shown (reused, not re-asked);
   - not found → enter name/email; a new consumer is created on submit, and you
     can optionally **Join an existing consumer** (link the new user into that
     household via `head_user_id`).
   *(In Edit the consumer is fixed; details are prefilled.)*
2. **Vehicle** — vehicle number, type, make, model, manufacturing year, engine no, chassis no.
3. **Policy** — the core:
   - **Policy nature:** **Fresh / Renewal / Portability** (Renewal & Portability reveal the Previous-Policy step).
   - **Policy Type**, **Plan (TP / Comprehensive / Full)**, **Company** — chosen from
     dropdowns; if a value isn't listed, type it and **“Add …”** creates it inline
     (Policy Type → `/user/data/policytype`, Plan → `/user/data/policyplan`,
     Company → `/user/data/company-type`).
   - Premium, NCB, IDV, vendor, From/To, Issued date.
   - **TP & OD/Full timelines:** TP tenure + TP expiry, and OD/Full tenure + OD expiry
     (Indian market: long-term TP — 3 yr car / 5 yr two-wheeler — bundled with 1 yr OD).
   - Agent name / code / contact.
   - **Status** is auto-derived (running while within the period, completed once expired).
4. **Nominee** — toggle; if on: name, relation, DOB, **auto-calculated age**.
5. **Previous Policy** *(only for Renewal / Portability)* — the older policy's full
   details incl. its own TP/OD timelines; its **status is auto-set from the expiry**.
6. **Documents** *(optional)* — **RC Book**, **Running Policy PDF**, and (for
   Renewal/Portability) **Previous Policy PDF**. Uploaded as multipart. KYC
   (Aadhar/PAN/GST) lives on the consumer and is reused.
7. **Review → Submit.**

## What happens on submit (backend)
- Consumer is created/linked by mobile and mapped to the Vehicle vertical.
- Vehicle + running policy (+ previous policy, if any) + documents are saved.
- **Auto timeline reconcile** (`reconcileVehiclePolicies`): the most recent policy
  stays as **running**; any older running rows are **archived into history
  (previous policies)**; every record's **status is recomputed from its expiry vs
  today** (running / completed). Runs after **add, update, and renew** — so adding
  data from anywhere keeps the year-by-year history consistent.

## TP vs OD/Full (timeline)
A policy carries two expiry dates: `tp_expiry_date` (long-term TP) and
`od_expiry_date` (1-yr OD/Full). Status uses the **OD/Full expiry first**, then
`ExpiryDate` / `PolicyTo`. `tp_tenure` / `od_tenure` store the years.

## Renewals — display, renew, edit/update

**Where:** Vehicle page → **Renewals** tab.

**How upcoming renewals are displayed**
- The tab loads `POST /user/vehicle/user/renewal/list` and shows each policy's
  **owner, mobile, vehicle number, expiry date** and a **Renew** button.
- Use the **Expiry** date-range filter (a single calendar, start→end) to narrow to
  policies expiring in a window (e.g. this month / next 30–60 days); type in the
  **header search** to find by name/mobile/vehicle number.
- Status is date-derived: **running** while still within the period, **completed**
  once the expiry has passed (computed from OD/Full expiry, else ExpiryDate/PolicyTo).

**Three ways to act on a renewal row**
1. **Renew** (the button in the row / the ↻ action) → `POST /user/renewVehiclePolicy`
   `{ vehicle_user_id }`: the **current running policy is moved to history
   (previous)** and the timeline is reconciled. Quick, no data entry.
2. **Add next policy / renew** (the “file-plus” row action) → opens the **full
   form pre-filled with the consumer + vehicle**, with a **blank new policy** and
   nature = Renewal. You enter the new policy (type/plan/company/dates/TP-OD/
   premium…); on save it goes through **`PUT /user/vehicle/user/update/:id`**,
   which **archives the old running policy to previous** and makes this the new
   running one. Use this to record the actual new policy (vs the one-click renew).
   *(This is also how you add the next year's record once a policy is **completed** —
   you don't re-create the vehicle; you add the next policy to the existing one.)*
3. **Edit** (✎) → opens the full form pre-filled with the existing policy so you
   can correct/update fields; saves via `PUT /user/vehicle/user/update/:id`.

**After any of these**, `reconcileVehiclePolicies` runs: the newest policy stays
**running**, older ones are archived to **history**, and every record's status is
recomputed from its dates — keeping the year-by-year timeline correct.

> Editing is available from **both** the Policies tab and the Renewals tab (same
> full form, prefilled). A renewal can also be entered from scratch on the
> Policies tab via **Add Vehicle Policy** with nature = Renewal + the Previous
> Policy step.

## Past / older records & "add the next one"
- Enter historical policies via **Renewal/Portability** with the **Previous
  Policy** step. They're stored in history with status **running** (if today is
  still within the period) or **completed** (if expired) — set automatically.
- When a policy is **completed**, you don't create the vehicle again — use **Add
  next policy / renew** on that row to add the next period's policy to the same
  vehicle. The old one is archived to history and the new one becomes running.

## Backend reference
- Add: `POST /user/vehicle/user/add` · Update: `PUT /user/vehicle/user/update/:id`
- List: `POST /user/vehicle/user/list` · Renewals: `POST /user/vehicle/user/renewal/list`
- Renew: `POST /user/renewVehiclePolicy` · By id: `GET /user/vehicle/user/:id`
- Masters: `GET/POST /user/data/policytype`, `/user/data/policyplan`, `/user/data/company-type`
- Payload: `{ data: { …vehicle, runningPolicy, previousPolicy, documentsData }, head_user_id }`
  (JSON, or multipart with `data` JSON-string + file fields `rcbook`,
  `CurrentPolicyFile`, `PreviousCurrentPolicyFile`).
