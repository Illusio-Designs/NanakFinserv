# Builder & Units — user flow

> **Completeness: ~95% (functionally complete).** Done: builder accounts; rich
> buildings with **categories → wings → floors**; a **per-unit-number grid**
> (occupied/vacant); add a consumer to a specific unit with the old form (status +
> Name/Mobile/Email/Sq.Ft./Deed); **Replace / Vacate** for occupied units; and the
> loan-status surfaced per unit. Replace auto-cancels the prior occupant's loan.
> **Edit building** (categories/wings/floors), **Delete building** (blocked if
> occupied), and a **Building Managers** page (assign managers to buildings) are
> included. Pending (optional): bulk import. Requires the backend deployed.


How builders, their buildings/units, and the consumers in each unit are managed.
Pages: **Dashboard → Builder** (`/builder`) and **Dashboard → Units** (`/units`).

## 1) Builder accounts — `/builder`
Builder companies/owners: **Name · Company · Mobile · Email** with add/edit
(`/user/data/add/builder`, `/user/data/update/builder`). These are the builders you
then attach buildings to.

## 2) Buildings / Units — `/units`
- **List:** Building · Builder · Address (search).
- **Add Building** (the rich form): pick the **builder**, name, address, then define
  **categories** — toggle **Showroom / Office / Flat / House**; for each enabled
  category add **wings** (name) and, per wing, **floors** with a **unit-number
  range** (floor number + from/to). Saved via `addBuilderUnit` with
  `{ unit_categories:[ids], <Cat>:{ summary:{totalCount,floorCount,wingCount},
  wings:[{ wingName, floors:[{ floorNumber, startRange, endRange }] }] } }`.
- **View units & consumers** → the building detail (see below).

## 3) Building detail — the unit grid
From `getunitwithconsumer`, the building is shown as:
**Wing tabs → category sections → expandable floors → a grid of unit-number cells.**
Each cell is one unit number (from the floor's range); **occupied** (filled, with a
loan-status dot) or **vacant** (dashed). A consumer matches a cell by
`office_no + wing_id + floor_id + category_id`. Legend shows occupied/vacant.

## 4) Add / edit a consumer per unit
Click a unit cell → the side panel (matches the old `Unit.js` modal):
- **Status** radio: **Interested / Not Interested**.
- When Interested: **Name\*** · **Mobile\*** (+91) · **Email** · **Sq. Ft.** ·
  **Deed Amount**. (office_no = unit number, wing, floor, category come from the cell.)
- **Vacant** unit → **Add** (`POST /user/data/consumer/add`).
- **Occupied** unit → **Update** (`PUT /user/data/consumer/update/:builderConsumerId`),
  **Replace consumer**, or **Vacate unit**.
The grid reloads after a save and shows the consumer's **loan status**.

## 5) One unit = one consumer (Replace / Vacate)
A unit can hold **only one** consumer — the backend rejects a duplicate on
`unit_id + office_no + category_id + floor_id + wing_id`. For an occupied unit:
- **Update** — edit the current occupant (stays in the unit).
- **Vacate unit** — frees the unit (`DELETE /user/data/consumer/vacate/:id`);
  the occupant's loan is **kept** (handle it in the Loan module).
- **Replace consumer** — frees the unit **and auto-cancels the prior occupant's
  (incomplete) loan** (`?cancelLoan=true` → `loanUser.status = "cancel"`), then lets
  you enter the new consumer. The new consumer gets a fresh loan.
> **A loan belongs to the person, not the unit** — both occupants' loan records
> coexist independently in the Loan module; the grid shows the *current* occupant.

## Loan linkage
A unit consumer who pursues a loan has a `loanUser` record (separate vertical).
The unit grid surfaces that **loan status** per cell; the Loan page's view/builder
section shows the building/project for builder-sourced loans.

## Building managers
Building managers (a separate role) are assigned to buildings and get a scoped
dashboard (their buildings' consumers). They're excluded from the loan/consumer
pools elsewhere. (`/user/building-manager/*`.)

## Backend reference
- Builders: `GET /user/list/builder`, `POST /user/data/add/builder`, `POST /user/data/update/builder`
- Units: `GET /user/data/builder/unit`, `POST /user/data/add/builderUnit`, `PUT /user/data/update/builderUnit`
- Building detail: `POST /user/data/builder/getunitwithconsumer { unit_id }`
- Unit consumer: `POST /user/data/consumer/add`, `PUT /user/data/consumer/update/:id`,
  `DELETE /user/data/consumer/vacate/:id?cancelLoan=true|false`
- Unit-category IDs: Showroom/Office/Flat/House (see `src/config/ids.js → UNIT_CATEGORY_IDS`).
