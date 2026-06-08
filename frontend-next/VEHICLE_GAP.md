# Vehicle module — what's missing vs the old form

Audit of the new `VehicleFormModal` vs the old `VehicleInsurance.js` (6,862 lines),
focused on **policy nature (Fresh/Renewal/Portability)**, **TP vs Full plan**, and
**previous/older policy (past data)**.

Legend: ✅ have · ❌ missing

---

## 1) Policy nature — `policyRadio` (❌ missing entirely)
The old form has a 3-way selector that drives the whole flow:
- **Fresh** — brand-new policy (no previous policy).
- **Renewal** — renewing an existing policy; the current/running policy details carry over and the old one becomes "previous".
- **Portability** — moving from another insurer; **previous policy section becomes required** (porting NCB/history from the old insurer).

➡️ New form: none. Needs a Fresh / Renewal / Portability radio that conditionally requires the Previous-Policy section (for Renewal & Portability).

## 2) Policy **Plan Type** = TP vs Full (❌ missing)
This is the **TP / Comprehensive / Full / SAOD** distinction — a master list:
- Endpoint: `GET /user/data/policyplan` → `{ policy_plan_id, policy_name }` (e.g. Third Party, Comprehensive/Full, Stand-alone OD).
- Old fields: **Policy Plan Type** (dropdown) + **Policy Plan Name** (free text).
- Sent as `runningPolicy.PolicyPlanTypeId` (+ previous: `previousPolicy.PolicyPlanTypeId`).

➡️ New form: only has **Policy Type** (`/user/data/policytype`). Missing the **Policy Plan Type (TP/Full)** dropdown from `/user/data/policyplan`, on both running and previous policy.

## 3) Running (current) policy — fields present vs missing
| Field | New | Notes |
|---|---|---|
| Policy Number | ✅ | |
| Policy Type (master) | ✅ | `/user/data/policytype` |
| Company | ✅ | `/user/data/company-type` (CompanyId) |
| **Policy Plan Type (TP/Full)** | ❌ | `/user/data/policyplan` |
| Policy Plan Name | ❌ | free text |
| Issue / Expiry date | ✅ | |
| **Policy Tenure** | ❌ | |
| **Premium Amount** | ❌ | |
| **From / To** (cover period) | ❌ | separate from issue/expiry |
| **NCB** (no-claim bonus) | ❌ | |
| **IDV** | ❌ | |
| **Vendor** | ❌ | |
| Agent name/code/contact | ✅ | |
| **Upload Running Policy PDF** | ❌ | document upload |

## 4) Nominee section (❌ missing entirely)
- Nominee Name, Nominee Relation, Nominee DOB, **Nominee Age (auto-calculated from DOB)**.
- Old form has a `nomineeRadio` / `isNomineeFlag` toggle (whether a nominee exists).

## 5) Previous / older policy — "past data" (❌ missing entirely)
The whole **Previous Policy Details** section (used for Renewal & Portability, i.e. managing the older policy):
- Previous Policy Number, Previous Policy Type, **Previous Policy Plan Type (TP/Full)**,
  Previous Company, Previous Vendor, Previous Policy Issued Date, Previous From, Previous To,
  Previous Policy Tenure, **Previous Premium**, **Previous IDV**, **Previous NCB**,
  **Previous Nominee Name**, and **Upload Previous Policy PDF**.
- Sent as the `previousPolicy` object (currently I send `previousPolicy: {}`).

## 6) Documents (❌ mostly missing)
- **RC Book** upload, **Running Policy PDF**, **Previous Policy PDF** → `documentsData` (currently `[]`).
- KYC reuse: ✅ I look up consumer KYC by mobile and show what's on file (but don't upload RC/policy PDFs).

## 7) Renewal flow specifics (🟡 partial)
- New: a Renewals tab + one-click Renew (`/user/renewVehiclePolicy`). 
- Old renewal (`VehicleRenewalSheet`, 2,809 lines) also supports **editing the renewal** with the full form pre-filled, moving running→previous, and a **renewal details popup**. Missing the edit-on-renew flow.

---

## What to build (proposed order)
1. **Policy nature radio** (Fresh / Renewal / Portability) controlling section visibility/requirements.
2. **Policy Plan Type (TP/Full)** dropdown from `/user/data/policyplan` — running + previous.
3. **Complete running-policy fields**: tenure, premium, from/to, NCB, IDV, vendor, plan name.
4. **Nominee section** (name, relation, DOB, auto-age) + nominee toggle.
5. **Previous Policy section** (all fields above) — shown/required for Renewal & Portability.
6. **Document uploads**: RC Book + Running Policy PDF + Previous Policy PDF → `documentsData` (multipart).
7. **Renewal edit flow**: open the full form pre-filled from a renewal row (running→previous), submit renew/update.

> The current form covers Fresh policies with core fields. The above adds full
> Renewal/Portability + TP/Full plan + past-policy management to match the old app.

---

## 8) Indian TP/OD timeline + status-by-date (backend check)

**What the backend actually stores** (models in `app/models/vehicle_details/`):
- `vehcileRunningPolicy` / `vehiclePreviousPolicy`: `policy_type_id`, `company_id`,
  **`policy_plan_id`** (this is the TP / Comprehensive / SAOD plan — from
  `GET /user/data/policyplan`), **`PolicyTenure`** (INTEGER years), `PremiumAmount`,
  `PolicyFrom`, `PolicyTo`, `PolicyIssuedDate`, **`ExpiryDate`**, `IDV`, `NCB`,
  nominee fields, `CurrentPolicyFile`, agent fields.
- `vehiclePreviousPolicy` additionally has a **`status`** column.
- `vehicleUser`: `vehicle_policy_type` (Fresh/Renewal/Portability),
  `policy_plan_type`, `status`, `vehicle_type`.

**Important reality:** the backend has **only one expiry timeline**
(`PolicyFrom/PolicyTo/ExpiryDate` + `PolicyTenure`). There are **no separate
`tp_expiry` / `od_expiry` columns**. So the Indian long-term pattern —
**TP valid 3 yrs (car) / 5 yrs (2-wheeler) bundled with 1-yr OD (Full)** — is
represented by:
- `policy_plan_id` = TP vs Comprehensive/Full (the plan), and
- `PolicyTenure` = the term in years (e.g. 1 for OD/Comprehensive, 3 for long-term TP).

To track TP-3yr and OD-1yr as **two distinct expiry dates on one vehicle**, the
backend would need new fields (e.g. `tp_expiry_date`, `od_expiry_date`) — it does
NOT have them today. **Decision needed:**
- **(A)** Match backend as-is: one plan + one tenure + one expiry per policy
  record (a long-term-TP-only policy is its own record with tenure 3; the OD/Full
  is another record/renewal). Simplest, no backend change.
- **(B)** Add `tp_expiry_date` + `od_expiry_date` to the running/previous policy
  models + controller to model the 1+3 bundle on a single policy (backend change).

**Status by date (running vs completed):** the old app derives status from
`ExpiryDate` vs today — `VehicleRenewalSheet` buckets rows as **expired / running**
(and week/month/year windows) by comparing `runningPolicy.ExpiryDate` to now. The
previous-policy `status` column stores this. So when **adding a past record**:
- compute `status = (today <= PolicyTo/ExpiryDate) ? "running" : "completed"`
  (i.e. running while within the period, completed once the expiry date has passed),
- send it on the `previousPolicy.status` (and reflect on the running policy view).

➡️ New form: doesn't set/derive status by date yet, doesn't capture `PolicyTenure`
or `policy_plan_id`. To match: capture **plan (TP/Full)** + **tenure (years)** +
**from/to + expiry**, and **auto-set running/completed from the expiry vs today**
when entering past/previous policies.

### Open question for you
Do you want **(A)** keep the single-expiry backend (plan + tenure represent
TP/OD), or **(B)** I extend the backend with separate `tp_expiry_date` /
`od_expiry_date` so one policy shows both the 3-yr TP and 1-yr OD timelines?
