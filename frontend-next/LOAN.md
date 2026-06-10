# Loan Processing — user flow

> **Completeness: ~95% (functionally complete, tested live).** Done: the 10
> per-stage tables compressed into one **`loan_stage`** table (stage-tagged,
> cumulative), transactional writes, clean list/detail endpoints (no N+1), a full
> **pipeline UI** (tabs + stage forms + view), builder/property linkage, and
> dashboard sums from `loan_stage`. Verified end-to-end (document → login →
> sanction → disbursement → part-payment). Pending (optional): Excel/PDF export,
> date-range filters. Requires the backend deployed.


How loans are processed in the CRM — a **stage pipeline** (not a renewal product
like Vehicle/Mediclaim). Page: **Dashboard → Loan** (`/loan`).

## The pipeline (statuses)
`notAssign → interested / notInterested → documentSelected → pickup → query →
login → sanction → disbursement → partPayment → completed` (or `cancel`).
Each stage captures its own data; **all stages are cumulative** (a disbursed loan
keeps its login + sanction + disbursement data).

## Tabs & table
- Tabs: **All · Pending · Interested · Document selected · Login · Sanction ·
  Disbursement · Part-payment · Completed · Cancelled · Not-interested** (counts
  shown; only non-empty stages appear).
- Table: **Name · Mobile · Product · Bank · Loan amount · Status** (status badge,
  colour by stage), with a Status filter + search + pagination.
- Row actions: **View** (full detail + stage journey), **Update stage** (the
  stage form).

## Update-stage flow (the stage forms)
Pick a target stage → a conditional form appears:
- **Interested / Not Interested** → remarks (→ `loanUpdateStatus`).
- **Document selected** → Loan type (Home/Car/Personal/Business/NRP/CC&&OD/TOP UP),
  Employment (Salaried/Partnership/Proprietorship), remarks.
- **Login** → loan amount, account no, bank, product, SM/AM names, bank code, DOB,
  login date, remarks (+ non-builder property: address, sq ft, deed amount).
- **Sanction** → amount, rate, tenure, sanction date.
- **Disbursement** → amount, rate, insurance (+ amount/bank/type), file no, date.
- **Part-payment** → dynamic rows of (amount, date).
- **Pickup / Completed** → date + remarks.
Non-pipeline statuses go through `PUT /user/data/add/consumer/loan` (transactional);
interested/notInterested go through `PUT /user/list/loanUpdateStatus`.

## What happens on submit (backend)
- **Single table:** every stage's data is a row in **`loan_stage`** keyed by
  `laon_id` and tagged with `stage`; single stages (login/sanction/…) are one row
  each (upserted), **part-payments are many rows**. `loanUser.status` holds the
  current pipeline status. *(The old 10 per-stage tables + the `remarks`-JSON blob
  were removed.)*
- **Atomic:** the stage write path runs inside a **DB transaction**.
- **Reads:** `/user/loan/list` + `/user/loan/:laon_id` return the consumer +
  current status + **grouped stages** + builder/property — one loans query (stages
  include) + one batched builder-link query (**no N+1**). Manager-scoped (a vertical
  manager sees only their assigned loans).

## Builder linkage
A loan consumer is **either** a **builder consumer** (linked via `builderConsumer`
to a unit → shows company / project / wing / floor / office / sq ft) **or** a
**non-builder** (manual property: builder name, building, sq ft, deed amount,
address). The View modal + the building unit-grid both surface the loan status.

## View / journey
One click shows: consumer + status, builder/project (or property), and each stage
(document / login / sanction / disbursement / **part-payments** / query / cancel)
laid out in sections.

## Dashboard
Loan totals (disbursed / loaned / part-payment) are summed from `loan_stage`
(stage-filtered), in both the admin and per-staff dashboard branches.

## Reliability roadmap
✅ **Done:** 10 tables → 1 `loan_stage` (stage-tagged, cumulative); transactional
writes; clean list/detail (no N+1); pipeline UI + stage forms + journey; dashboard
sums on `loan_stage`; manager scoping; `created_by`/`updated_by` on stages.

✅ Also done: **CSV export** + **Loan-date range filter** on the list; **Document
templates** (loan config: categories + PDFs).

Still to do (optional): per-loan **document uploads**, per-loan **PDF report**,
status-transition validation.

## Backend reference
- List: `GET /user/loan/list` · Detail: `GET /user/loan/:laon_id`
- Status: `PUT /user/list/loanUpdateStatus` `{ status, user_consumer_id, laon_id, remarks }`
- Stage data: `PUT /user/data/add/consumer/loan`
  `{ user_consumer_id, laon_id, phone_number, username, email, status, <stage>_details }`
  where `<stage>_details` is one of sanction_details / login_details (+ property_details) /
  disbursement_details / part_details{parts:[…]} / document_details / query_details /
  cancel_details / pickup_details / completed_details.
- Legacy (now delegate to the same `loan_stage` reads): `/user/list/loan`,
  `/user/list/loanInterested`, `/user/list/loan/detail`, `/user/list/loanNotInterested`,
  `/user/list/loanNotDisburse`.
- Table: `loan_stage` (laon_id, stage, is_current, + superset stage columns,
  created_by/updated_by).
