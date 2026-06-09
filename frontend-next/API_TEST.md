# API test — Vehicle & Consumer flows (curl)

## Non-destructive checks (run against https://api.nanakfinserv.com/api)
| # | Check | Result |
|---|---|---|
| 1 | `GET /public/blog/list` (reachability) | ✅ 200 |
| 2 | `POST /public/inquiry` with invalid body | ✅ 400 — "username is required; a valid email is required; phone_number must be 10 digits" |
| 3 | `POST /user/vehicle/user/add` without token | ✅ 401 Unauthorized |
| 4 | `GET /user/list/consumer` without token | ✅ 401 |
| 5 | `POST /user/login` with bogus accessToken | ✅ 401 "OTP verification failed." |

**Conclusion:** API is up, validation works, and protected routes are correctly gated.

## Why the add flows can't be curl-tested directly
`POST /user/login` requires a **real MSG91 OTP access-token** (server verifies it
against MSG91) — there is **no dev bypass**. So a token can't be minted from the
CLI, and the authenticated Vehicle/Consumer add can't be exercised by curl alone.
Also, hitting the live add endpoints would create **real production records**.

### To run authenticated add tests
1. **Browser token (recommended, no code change):** log into the app, copy the
   `token` cookie value, then:
   ```
   TOKEN=...; API=https://api.nanakfinserv.com/api
   curl -s -X POST $API/user/data/add/consumer -H "token: $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"username":"Test","email":"t@x.com","phone_number":"9000000001","category":[]}'
   curl -s -X POST $API/user/vehicle/user/add -H "token: $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"data":{"Name":"Test","MobileNumber":"9000000001","VehicleNumber":"GJ01AB1234","runningPolicy":{},"previousPolicy":{},"documentsData":[]}}'
   ```
   (Creates real data — clean up via Settings → data wipe, or a staging DB.)
2. **Temporary test bypass (staging only):** accept a `TEST_OTP_TOKEN` in
   `verifyMsg91AccessToken` when `NODE_ENV !== 'production'`. Not for prod.

---

## Pros & cons (from code review + checks)

### Consumer add flow
**Pros**
- De-duplicated by **mobile** — reuses an existing user instead of creating duplicates.
- **Standalone or join** an existing household (`head_user_id` linking).
- Services + **working-person assignment** in one flow; editable later.
- Family members added inline; **KYC stored on the consumer** and reused across policies.
- Universal validators (name/email/mobile) on client + server; protected by RBAC.

**Cons / risks**
- Family members are created in a **frontend loop** (no transaction) — a partial
  failure leaves some members unadded.
- No single transaction across consumer + mappings + family — inconsistent state possible on mid-failure.
- **Assign notification** fires on the *update* path but not on the initial add with assignees.
- Email is required on the main add but not on family-member add (minor inconsistency).
- Backend reuses an existing mobile **silently** — no "this consumer already exists" feedback before submit.

### Vehicle add flow
**Pros**
- **Find-or-create** consumer by mobile + **KYC reuse** lookup.
- Full policy model: nature (Fresh/Renewal/Portability), **TP/OD timelines**,
  type/plan/company **creatable** dropdowns, nominee, previous policy.
- **Auto timeline reconcile** (running→previous, status derived by date).
- **Document uploads** (multipart) for RC + running/previous PDFs.
- **Duplicate guards** on vehicle number / engine / chassis (server rejects dupes).

**Cons / risks**
- Duplicate guard **blocks re-adding the same vehicle** — the next year's policy must
  go through **"Add next policy"** (update path). Correct, but a UX gotcha to learn.
- Dates are stored as **strings**; status derivation uses `new Date(...)` — legacy
  `dd-mm-yyyy` values parse as Invalid and default to "running".
- No transaction across vehicle + running + previous + documents.
- Inline **master creation** (company/plan/type) requires **admin** — vertical
  managers get 403 when adding a new master from the dropdown.
- Server validation beyond Name/Mobile/VehicleNumber is light (most fields free-text).

### Recommendations
- Wrap consumer+family and vehicle+policies in **DB transactions**.
- Fire the **assign** notification on the add path too.
- Allow **managers** to create masters (companies/plan/type) or pre-seed them.
- Normalise all dates to ISO on write; guard `new Date` parsing.
- Add a staging `TEST_OTP_TOKEN` to enable automated E2E tests.
