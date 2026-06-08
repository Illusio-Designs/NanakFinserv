# Vehicle Policy Management — user flow

How vehicle insurance is managed in the CRM (consumer-linked, TP/OD timelines,
year-by-year history). Page: **Dashboard → Vehicle** (`/vehicle`).

## Screen layout
- **Tabs:** **Policies** (all running policies) and **Renewals** (policies due / renew).
- **Add Vehicle Policy** button → multi-step form.
- Each row: **View** (read-only details) and **Edit** (full form prefilled).
- Search via the global header search; **Status** filter on Policies; **Expiry**
  date-range filter on Renewals.

## Add / Edit flow (stepper)
1. **Consumer** — type the mobile and press **Find**:
   - found → name/email prefilled (existing consumer, linked by mobile) and the
     **KYC on file** is shown (reused, not re-asked);
   - not found → enter name/email; a new consumer is created on submit.
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

## Renewals
- **Renewals** tab lists policies (filter by expiry range). **Renew** moves the
  current running policy into history and recomputes the timeline.
- A renewal can also be entered via the full form with **nature = Renewal** and the
  **Previous Policy** step (porting the old policy's data, incl. NCB).

## Past / older records
Enter them via **Renewal/Portability** with the **Previous Policy** step. They're
stored in history with status **running** (if today is still within the period) or
**completed** (if the expiry has passed) — set automatically from the dates.

## Backend reference
- Add: `POST /user/vehicle/user/add` · Update: `PUT /user/vehicle/user/update/:id`
- List: `POST /user/vehicle/user/list` · Renewals: `POST /user/vehicle/user/renewal/list`
- Renew: `POST /user/renewVehiclePolicy` · By id: `GET /user/vehicle/user/:id`
- Masters: `GET/POST /user/data/policytype`, `/user/data/policyplan`, `/user/data/company-type`
- Payload: `{ data: { …vehicle, runningPolicy, previousPolicy, documentsData }, head_user_id }`
  (JSON, or multipart with `data` JSON-string + file fields `rcbook`,
  `CurrentPolicyFile`, `PreviousCurrentPolicyFile`).
