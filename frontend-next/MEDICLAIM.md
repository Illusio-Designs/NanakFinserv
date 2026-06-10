# Mediclaim Policy Management — user flow

> **Completeness: ~99% (functionally complete, tested live).** Done: full
> add/edit, **type-driven flow** (Individual / Family Floater + members / Group +
> employees), nominee, **portability** (previous-insurer policy), **single merged
> policy table** (`is_current` flag — running vs history, the old
> `previous_policies` table was merged in and dropped), **auto reconcile** with
> date-derived status, **past-journey timeline** (View/Download per policy),
> renew / add-next, **policy-PDF upload** (`/uploads/mediclaim/`), **product
> brochure PDFs**, and **atomic writes** (add = compensation rollback, update =
> DB transaction), **claim/portability PDF uploads**, and **data integrity**
> (ISO date validation + unique policy-number per mediclaim). KYC is managed from
> the Consumer module — not asked here. Requires the backend deployed.


How mediclaim is managed in the CRM (consumer-linked, year-by-year history,
group/family cover). Page: **Dashboard → Mediclaim** (`/mediclaim`).
**Built to the same standard as Vehicle.**

## Tabs
- **Policies** — all current policies. Columns mirror the old app + more:
  **Name · Mobile · Company · Policy No · Type · Sum Insured · Premium · Expiry
  (+countdown) · Status**, with Status/Type filters. Every cell populates (no “—”).
- **Pending** — a manager's action list: (a) consumers **assigned to Mediclaim with
  no policy yet** → **Add record** (opens Add prefilled with their mobile);
  (b) policies **due for renewal** (≤30 days / expired) → **Renew**, overdue first.
- **Renewals** — **still-valid** policies only (soonest first); **overdue policies
  are excluded** here (they live under Closed). Expiry date-range filter.
- **Closed** — policies whose cover has expired (overdue).
- **Companies** — mediclaim insurers (add/edit).
- **Products** — products per company, **with brochure/PDF upload** + download links.

## Screen layout
- **Tabs:** Policies · Pending · Renewals · Closed · Companies · Products.
- **Add Policy** button (on the policy tabs) → multi-step form.
- Row actions: **View** (read-only details + journey), **Edit** (full form
  prefilled), and **Add next / renew** (file-plus). Pending/Renewals rows also have
  a **Renew** button.
- Global header search; **Status/Type** filters on Policies; **Expiry** date-range
  on Renewals; serial #, **Show by** page-size + pagination on every table.
- **View = one click shows everything**: member + policy + nominee + sum insured +
  **members/employees** + **past-journey timeline**, loaded inline.

## Add / Edit / Renew flow (stepper)
The flow is **type-driven**, matching the old form's conditions:

1. **Consumer** — type the mobile and press **Find**:
   - found → name/email prefilled (existing consumer, linked by mobile);
   - not found → enter name/email; a new consumer is created on submit.
   - **Policy Type** is chosen here (**Individual / Family Floater / Group / Employee**)
     so the conditional steps below are decided up-front.
   - Proposer DOB + Gender.
   *(In Edit/Renew the consumer is fixed and prefilled.)*
2. **Policy** — Sum Insured, **Company** + **Product** (dropdowns from masters),
   Policy Number, Premium, **Zone, Add-on cover, Policy tenure**, Issued / From / To /
   Expiry dates, Agent name/code/contact. Validated: company + expiry required,
   From < To. A type hint shows what comes next.
3. **Nominee** — name, relation, DOB, age.
4. **Members** *(only for Family Floater)* — dynamic list: name, relationship, DOB, gender.
5. **Employees** *(only for Group / Employee)* — dynamic list: name, relationship,
   DOB, gender, date of joining.
6. **Previous policy** *(new/edit only — hidden on renew)* — a checkbox “this is a
   portability / has a previous insurer policy”; if on: previous policy no,
   company, sum insured, NCB, previous-agent name/code/contact, **+ Previous Policy
   PDF and Claim Statement PDF uploads**.
7. **Documents** — **Policy PDF** upload (multipart). *(KYC — Aadhar/PAN/GST — is
   managed from the **Consumer** module and reused, so it's not asked here.)*
8. **Review → Submit.**

**Conditions (same intent as the old form):** type chosen first → Members shown
only for Family Floater, Employees only for Group, Individual has neither; previous
policy optional (portability); **renew skips the manual previous step** because the
current policy is auto-archived into the journey.

## What happens on submit (backend)
- Consumer is created/linked by mobile and mapped to the Mediclaim vertical;
  `created_by` is recorded (so the scoped test-data wipe can attribute it).
- **Single policy table:** all policies live in `running_policies` with an
  **`is_current`** flag — `true` = current, `false` = history. The API returns
  `runningPolicy` (object) + `previousPolicies` (array). (The old `previous_policies`
  table was merged into this and dropped.)
- **Auto reconcile** (`reconcileMediclaimPolicies`): flags the policy with the
  **latest end date** as current and the rest as history; recomputes status
  (running / completed). Runs after **add, update and renew**.
- **Atomic writes:**
  - **Add** — compensation rollback: if a later step fails, the orphan mediclaim +
    its policies/members/employees are deleted (no half-written record).
  - **Update / Renew** — wrapped in a **DB transaction**: the user/policy updates,
    the renewal archive+create, and the family/employee destroy+recreate all commit
    together or roll back.

## Documents & storage
- **Policy PDFs** (and Aadhar/PAN/GST/custom docs) save under **`/uploads/mediclaim/`**
  via the shared uploader; **product brochures** save under
  **`/uploads/companyProduct/<companyId>/<productId>/`**. All served at
  `BASE_URL/uploads/<path>` and **token-protected** (`?token=<jwt>`). Journey items
  and the Brochure column show **View / Download** with file-type icons.

## Companies & Products (masters)
- **Companies** — add/edit insurers (`mediclaim_company_name`).
- **Products** — per company; **Add Product** takes a name **+ optional brochure/PDF**
  (multipart, fields `pdf0…N`). The Products table shows a **Brochure / PDF** column
  with download links. Managers can create masters (rbac ADMIN group includes them).

## Renewals — display, renew, edit/update
**Where:** Mediclaim → **Renewals** (still-valid only; overdue excluded → Closed).

- **Renew** (button / file-plus) → opens the form prefilled with the consumer,
  **blank new policy**, nature = Renew. On save (`PUT /user/mediclaim/user/update/:id`
  with `policyRadio: "Renew"`) the **current policy is archived in place**
  (`is_current=false`, `RenewDate` set) and the **new policy becomes current** —
  the old one drops into the **past journey**.
- **Edit** (✎) → full form prefilled (incl. members/employees/nominee); saves via
  the same transactional update.
- **After any of these**, reconcile keeps the newest policy current and the rest as
  history, status recomputed from dates.

## Past / older records & "add the next one"
- Historical policies build up by **renewing** (each renew archives the current into
  the journey) or via a **portability** previous-insurer policy on add.
- A consumer's **journey** shows every past policy (newest→oldest) with policy no,
  company, period, sum insured, premium, and a Download when a PDF exists.
- Verified live: e.g. `MED-…-Y3(2026) → Y2(2025) → Y1(2024)`, and portability +
  renewals chained in one journey (`Y2 → Y1 → OLD-POL(prior insurer)`).

## Activity log & reminders
- Mediclaim **add / update / renewal** are recorded on **Activity Log** (`/logs`)
  with Who / Module / Event / time.
- **Daily scheduler** emits `renewal_due` reminders at **7/3/1/0 days** before the
  running policy's ExpiryDate (scoped to `is_current` policies).

## Reliability roadmap
✅ **Done:** single policy table + `is_current` (ids stable, no cross-table moves);
idempotent reconcile (latest = current, status by date); add **compensation
rollback** + update **DB transaction**; per-area upload folders + token downloads;
activity log + reminders; product brochure PDFs; renewals exclude overdue;
**policy + previous-policy + claim PDFs** upload from the modal (→ uploads/mediclaim/);
**data integrity** — ISO date normalisation + From<To validation on write, and a
**unique (mediclaim_id, PolicyNumber)** index (duplicate → friendly 409).

Still to do:
1. **Audit trail / PDF versioning** for full history.

> KYC (Aadhar/PAN/GST) is **managed from the Consumer module** and reused across
> policies — it is intentionally **not** a step in the mediclaim modal.

## Backend reference
- Add: `POST /user/mediclaim/user/add` · Update/Renew: `PUT /user/mediclaim/user/update/:id`
- List: `GET /user/mediclaim/user/list` · Renewals: `POST /user/mediclaim/user/renewal/list`
- Companies: `GET /user/mediclaim/company`, `POST /user/mediclaim/company/add`, `PUT …/company/update`
- Products: `GET /user/mediclaim/product/:companyId`, `POST /user/mediclaim/product/add/:companyId`
  (multipart: `mediclaim_product_name` + `pdf0…N`), `PUT …/product/update/:id`
- Payload: `{ data: { …Name/MobileNumber/RadioButton(type)/policyRadio(Fresh|Renew),
  CompanyName, ProductName, SumInsured, runningPolicy, previousPolicy, familyMembers,
  employees } }` (JSON, or multipart with `data` JSON-string + file field
  `CurrentPolicyFile`).
