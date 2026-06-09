# Consumer Management — user flow

> **Completeness: 100% (functionally complete).** Done: list, add (standalone or
> **join an existing consumer**), services + **working-person assignment**, family
> members (inline + manage tab), **KYC documents** (upload + reuse across
> policies), edit (with services/assignee), view, and row actions (family,
> upload). No known gaps.


How consumers (and their households, services and KYC) are managed.
Page: **Dashboard → Consumers** (`/consumers`).

## Screen
- Table: Name, Mobile, Email, **Services** (the service *names* as chips, not a
  count), **Family** count (line icon). Serial-number column, **Show by** page-size
  and pagination on every table.
- **Family members are hidden from the top-level list** (they appear under their
  head's Family); the dashboard **Consumer count** likewise counts heads only.
- Global header search; **Services** filter.
- Row actions: **View**, **Edit**, **Family & documents**, **Upload document**.
- **View = one click shows everything**: profile + service names + **family roster**
  + **KYC documents** (each with a View link), loaded inline — no extra clicks.
- **Add Consumer** button → multi-step form.

## Add Consumer (stepper)
1. **Details**
   - **Join an existing consumer (optional)** — a searchable dropdown of existing
     consumers. If the head already exists in the database, pick them and the new
     user is created **as a family member of that consumer** (linked household).
     Leave it blank to create a **standalone** consumer.
   - Name, Mobile (with country/flag), Email, Reference.
2. **Services** — pick each service (Loan / Mediclaim / Life / Vehicle) and assign
   a **working person** (staff) responsible for it.
3. **Family** — optionally add family members inline (name, mobile, email,
   services); each is created as a linked consumer (skipped when joining).
4. **Review → Submit.**

### What happens on submit
- **Standalone:** `POST /user/data/add/consumer` with
  `category: [{ category_id, user_role_id }]`; then any family members via
  `POST /user/data/consumer/family/add` (head = the new consumer).
- **Joining an existing consumer:** `POST /user/data/consumer/family/add` with
  `head_user_id` = the selected consumer — the new user becomes a member of that
  household (mapped by mobile; the backend resolves to the top-level head).

## Edit
`Edit` loads the consumer + their **current services and assigned working person**
(from the category mappings). Changing services/assignees and saving replaces the
mappings (`PUT /user/data/update/consumer` with `category`).

## Manage (row → Family & documents) — tabbed
- **Family** tab — household roster (`GET /user/household/:mobile`): each member
  with their policy counts and a Head badge; **Add Family Member** form.
- **Documents** tab — consumer **KYC** (`GET /user/consumer/documents/by-mobile/:mobile`):
  view stored docs and **upload** (type + file → `POST /user/consumer/documents/upload`).
  KYC is stored on the consumer and **reused across all policies** (e.g. the vehicle
  form shows "KYC on file").

## Documents & storage
- KYC files are stored per-area under **`/uploads/consumer-kyc/`** and served at
  `BASE_URL/uploads/consumer-kyc/<file>`. That route is **token-protected**, so the
  download URL carries `?token=<jwt>` (built by the `fileUrl()` helper).
- KYC lives on the **consumer** (one row per type) and is **reused** across every
  vertical/policy (e.g. the vehicle form shows "KYC on file").

## Activity log
- Every consumer add / assign is recorded and shown on the **Activity Log** page
  (`/logs`) with **Who** (the acting user), Module, Event, Action and time.

## Notes
- A consumer can be a **head** or a **member**; joining links a new user under a
  head (single level — joining a member resolves to that member's head).
- Family/household is keyed by **mobile number**, so the same person is reused
  rather than duplicated.

## Backend reference
- List: `GET /user/list/consumer` · Add: `POST /user/data/add/consumer`
- Update: `PUT /user/data/update/consumer` · Family add / join:
  `POST /user/data/consumer/family/add` (`head_user_id`)
- Household: `GET /user/household/:mobile`
- Documents: `GET /user/consumer/documents/by-mobile/:mobile`,
  `POST /user/consumer/documents/upload` (multipart: `user_id`, `categoryId`, `file`)
- Staff (working persons): `GET /user/list/roleWise`
