# Universal Management Helpers (Backend)

Centralized, reusable tasks so the same concern is handled **one way everywhere**
— no duplicated logic, no duplicate data. **Always use these** instead of
re-implementing per controller. New code that uploads a file, assigns a vertical,
creates a consumer, or stores a KYC doc MUST go through the matching helper.

All live in **`src/modules/shared/context.js`** (import via the shared context
destructure) unless noted.

---

## 1. Universal file upload — `saveUpload(fileObj)`
Saves one `express-fileupload` file to `Backend/uploads/` and returns the stored
filename. Handles `mv()` (in-memory) and `data` (buffer) fallbacks.

```js
const { saveUpload } = require("../shared/context");
const fileName = await saveUpload(req.files.file);
```
- ✅ Use for: consumer KYC, vehicle RC book, life docs, blog images, any upload.
- ❌ Don't: re-write `uuidv4 + path + mv/writeFile` blocks in controllers.

## 2. Consumer KYC store (de-dup per type) — `upsertConsumerDocument(user_id, categoryId, file)`
Stores a **consumer-level** document. One row per `(user_id, categoryId)` — a
re-upload **replaces** the file. KYC (Aadhar/PAN/GST) lives on the **consumer**
and is **reused** across verticals; policies must not re-collect it.

```js
const name = await saveUpload(req.files.aadhar);
await upsertConsumerDocument(userId, DOCUMENT_IDS.AADHAR, name);
```
Read back: `GET /user/consumer/documents/:userId` or `.../by-mobile/:mobile`.

## 3. Consumer ↔ vertical mapping (de-dup) — `ensureCategoryMapping(user_consumer_id, category_id, user_role_id)`
Idempotent `findOrCreate` of a `consumerrolemapping` row. A consumer can never
get a duplicate mapping for the same vertical, regardless of which page assigns
it (consumer/vehicle/loan/mediclaim/life).

```js
await ensureCategoryMapping(userId, CATEGORY_IDS.VEHICLE, req.user.id);
```

## 4. Consumer identity (de-dup users) — find-by-mobile, then reuse
**Rule:** every path that "creates a consumer" must first
`User.findOne({ where: { mobileNumber } })` and **reuse** the row; only
`User.create(...)` when none exists. Mobile is the universal identity key — never
create two users for one mobile. (Consumer/Vehicle/Mediclaim paths already do
this; keep it consistent.)

## 5. Household / family — `family_head_id`
Family members are full users linked to a head via `user.family_head_id`.
- `addFamilyMember` (POST `/user/data/consumer/family/add`)
- `getHousehold` (GET `/user/household/:mobile`) → head + members + policies.

## 6. Stable lookup IDs — `src/config/ids.js`
`ROLE_IDS`, `CATEGORY_IDS`, `UNIT_CATEGORY_IDS`, `DOCUMENT_IDS` (fixed UUIDs,
seeded on boot). Reference these by name — never magic numbers/strings. **Keep
in sync with `Frontend/src/config/ids.js`.**

---

## Endpoints that expose these
| Purpose | Method + path |
|---|---|
| Consumer docs by id | `GET /user/consumer/documents/:userId` |
| Consumer docs by mobile | `GET /user/consumer/documents/by-mobile/:mobile` |
| Upload/replace consumer doc | `POST /user/consumer/documents/upload` (multipart: file, user_id, categoryId) |
| Add family member | `POST /user/data/consumer/family/add` |
| Household by mobile | `GET /user/household/:mobile` |

---

## Future TODO (migrate remaining call sites to the helpers)
- [ ] Vehicle controller: use `saveUpload` for RC Book + custom docs (KYC already
      routes to `upsertConsumerDocument`).
- [ ] Life insurance & blog uploads: switch to `saveUpload`.
- [ ] Loan/mediclaim/vehicle mapping creates: switch guarded `consumerRoleMapping`
      blocks to `ensureCategoryMapping`.
- [ ] Loan/mediclaim "create user" paths: confirm find-by-mobile reuse.
- [ ] Optional: a single `findOrCreateConsumer({mobile,...})` helper to fully
      centralize §4, and `attachConsumerDocsToForm(mobile)` for policy prefill.

## Golden rules
1. **Upload?** → `saveUpload`.
2. **KYC document?** → `upsertConsumerDocument` (consumer-level, reused).
3. **Assign a vertical?** → `ensureCategoryMapping`.
4. **Make a consumer?** → find by mobile first, reuse; never duplicate.
5. **Reference a role/category/doc type?** → `ids.js` constant.
