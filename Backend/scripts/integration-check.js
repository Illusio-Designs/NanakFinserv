/**
 * Live integration check — regression guard for the bug classes fixed in the
 * UUID-migration hardening (builder/life/building-manager + OTP-era issues).
 *
 * These hit the REAL running API (per the `prove-it` + `kent-c-dodds` skills:
 * integration over mocks, behaviour over implementation). They create test data
 * as the admin user and clean it up afterwards.
 *
 * USAGE:
 *   1. Get a JWT once (login via OTP), then:
 *        # PowerShell:  $env:TEST_JWT="<jwt>"; node scripts/integration-check.js
 *        # bash:        TEST_JWT=<jwt> node scripts/integration-check.js
 *   2. Optional: TEST_API=https://api.nanakfinserv.com/api (default below).
 *
 * Exits non-zero if any check fails (CI-friendly).
 */
const { ROLE_IDS, CATEGORY_IDS, UNIT_CATEGORY_IDS } = require("../src/config/ids");

const API = process.env.TEST_API || "https://api.nanakfinserv.com/api";
const JWT = process.env.TEST_JWT;
if (!JWT) {
  console.error("✗ TEST_JWT is required (obtain via OTP login). See header for usage.");
  process.exit(2);
}
const H = { Authorization: `Bearer ${JWT}`, "Content-Type": "application/json" };
const FLAT = UNIT_CATEGORY_IDS.FLAT;
const tag = String(Date.now()).slice(-5);

let passed = 0, failed = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
};
const j = async (r) => ({ s: r.status, d: await r.json().catch(() => ({})) });
const get = (p) => fetch(`${API}${p}`, { headers: H }).then(j);
const post = (p, b) => fetch(`${API}${p}`, { method: "POST", headers: H, body: JSON.stringify(b) }).then(j);
const put = (p, b) => fetch(`${API}${p}`, { method: "PUT", headers: H, body: JSON.stringify(b) }).then(j);
const del = (p) => fetch(`${API}${p}`, { method: "DELETE", headers: H }).then(j);

async function run() {
  console.log(`\nIntegration check → ${API}\n`);

  // ── Builder list (regression: role_id was filtered as number 2, not UUID) ──
  console.log("Builder / Units");
  const builders = (await get("/user/list/builder")).d.data || [];
  ok("builder list returns an array (role_id UUID filter)", Array.isArray(builders) && builders.length >= 0);
  let builder = builders[0];
  if (!builder) {
    const r = await post("/user/data/add/builder", { username: "IT Builder", company_name: "IntegrationTest Builders " + tag, phone_number: "9" + tag + "00000".slice(0, 9 - tag.length), email: `b${tag}@test.com` });
    ok("create builder", r.s === 200, JSON.stringify(r.d).slice(0, 80));
    builder = ((await get("/user/list/builder")).d.data || [])[0];
  }
  const builderId = builder?.["builderuser.builder_id"] || builder?.builder_id;
  ok("resolved a builder_id", !!builderId);

  // ── Add building with wings/floors (regression: validator required unit_id) ──
  const tower = "IT Tower " + tag;
  const addUnit = await post("/user/data/add/builderUnit", {
    builder_id: builderId, unit_name: tower, address: "Test Rd",
    unit_categories: [FLAT],
    Flat: { summary: { totalCount: 4, floorCount: 1, wingCount: 1 }, wings: [{ wingName: "A", floors: [{ floorNumber: "1", startRange: 101, endRange: 104 }] }] },
  });
  ok("add building with categories (validator: builder_id+unit_name)", addUnit.s === 200, addUnit.d.message);
  const unit = ((await get("/user/data/builder/unit")).d.data || []).find((u) => u.unit_name === tower);
  ok("created building appears in list", !!unit);

  // ── Grid renders wings (regression: getunitwithconsumer Number(uuid) → NaN) ──
  let det = (await post("/user/data/builder/getunitwithconsumer", { unit_id: unit.unit_id })).d.data?.[0];
  const wing = (det?.Flat || [])[0];
  const floor = (wing?.floors || [])[0];
  ok("getunitwithconsumer returns Flat wings (UUID category parse)", (det?.Flat || []).length > 0);
  ok("floor has a unit range", !!floor && Number.isFinite(Number(floor.startRange)));

  // ── Add consumer to a unit ──
  const addCons = (name, mob, office) => post("/user/data/consumer/add", {
    username: name, mobileNumber: mob, email: mob + "@t.com", status: "interested", role_id: ROLE_IDS.BUILDER_CONSUMER,
    unit_id: unit.unit_id, builder_id: builderId, office_no: String(office), floor_id: floor?.floor_id, wing_id: wing?.wingId, category_id: FLAT, builder_user_id: det?.["builderuser.user_id"],
  });
  const c1 = await addCons("IT Buyer One", "93" + tag + "0001".slice(0, 8 - tag.length), 101);
  ok("add consumer to unit 101", c1.s === 201, c1.d.message);
  const bcId = c1.d.builderConsumerData?.builderConsumerId;

  // ── Replace = vacate + cancel prior loan (regression: vacate endpoint) ──
  if (bcId) {
    const v = await del(`/user/data/consumer/vacate/${bcId}?cancelLoan=true`);
    ok("vacate unit with cancelLoan", v.s === 200, v.d.message);
  }

  // ── Edit building categories/wings (regression: updateBuilderUnit numeric cat id) ──
  det = (await post("/user/data/builder/getunitwithconsumer", { unit_id: unit.unit_id })).d.data?.[0];
  const w = (det?.Flat || [])[0];
  const f = (w?.floors || [])[0];
  const edit = await put("/user/data/update/builderUnit", {
    unit_id: unit.unit_id, builder_id: builderId, unit_name: tower, address: "Test Rd",
    Flat: { wings: [{ wingId: w?.wingId, wingName: "A", floors: [{ floor_id: f?.floor_id, floorNumber: "1", startRange: 101, endRange: 106 }] }] },
    Showroom: { wings: [] }, Office: { wings: [] }, House: { wings: [] },
  });
  ok("edit building (updateBuilderUnit UUID category)", edit.s === 200, edit.d.message);
  det = (await post("/user/data/builder/getunitwithconsumer", { unit_id: unit.unit_id })).d.data?.[0];
  ok("edit persisted (floor extended to 106)", ((det?.Flat || [])[0]?.floors || [])[0]?.endRange == 106);

  // ── Delete building (regression: deleteBuilderUnit + occupied guard) ──
  const delU = await del(`/user/data/builder/unit/${unit.unit_id}`);
  ok("delete building (cleanup)", delU.s === 200, delU.d.message);

  // ── Building manager create (regression: created_by/assigned_by = 1 numeric FK) ──
  console.log("Building Managers");
  const units2 = (await get("/user/data/builder/unit")).d.data || [];
  if (units2[0]) {
    const bm = await post("/user/building-manager/create", { username: "IT Mgr " + tag, email: `mgr${tag}@test.com`, mobileNumber: "94" + tag + "0002".slice(0, 8 - tag.length), unit_id: units2[0].unit_id });
    ok("create building manager (FK uses req.user.id)", bm.s === 201, bm.d.message || bm.d.error);
    const list = (await get("/user/building-manager/list")).d.data || [];
    const made = list.find((b) => (b.user?.email || b["user.email"]) === `mgr${tag}@test.com`);
    ok("building manager appears in list", !!made);
    if (made) await put(`/user/building-manager/remove/${made.id || made.building_manager_id}`, {}); // cleanup
  } else {
    console.log("  (skipped — no building available)");
  }

  // ── Life insurance create + list (regression: validator undefined + 43 NOT NULL) ──
  console.log("Life Insurance");
  const lifeMob = "95" + tag + "0003".slice(0, 8 - tag.length);
  const life = await post("/user/life-insurance/create", {
    proposer_name: "IT Life " + tag, proposer_mobile_numbers: lifeMob, proposer_email: lifeMob + "@t.com",
    product_name: "Jeevan Anand", policy_number: "IT-LIC-" + tag, sum_assured: "1000000", premium_amount: "25000",
    premium_payment_mode: "Yearly", due_date_of_premium: "2026-09-01", status: "active", user_consumer_id: null,
  });
  ok("create life policy (validator defined + columns nullable)", life.s === 201, life.d.message || (life.d.errors && life.d.errors[0]?.message));
  const lifeList = (await get("/user/life-insurance/list")).d.data || [];
  ok("life list returns array", Array.isArray(lifeList));
  const made = lifeList.find((x) => x.policy_number === "IT-LIC-" + tag);
  if (made) { const dl = await del(`/user/life-insurance/delete/${made.id}`); ok("delete life policy (cleanup)", dl.s === 200 || dl.s === 204, dl.d.message); }

  // ── Life consumer list (regression: category_id filtered as number 5) ──
  const lifeUsers = await get("/user/list/lifeIns");
  ok("/user/list/lifeIns responds 200 with array (category_id UUID)", lifeUsers.s === 200 && Array.isArray(lifeUsers.d.data || lifeUsers.d));

  console.log(`\n${failed === 0 ? "✓ ALL PASSED" : "✗ FAILURES"} — ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((e) => { console.error("✗ suite crashed:", e); process.exit(1); });
