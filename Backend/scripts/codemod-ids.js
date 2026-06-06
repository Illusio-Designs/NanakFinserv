#!/usr/bin/env node
/**
 * codemod-ids.js — replace hardcoded numeric role/category/unit_category
 * literals in the backend logic with the named UUID constants from
 * src/config/ids.js.
 *
 * Only touches code-decided values (permission gating, endpoint-implied
 * defaults). User-selected values already flow through as UUIDs.
 *
 * Run from Backend/:  node scripts/codemod-ids.js
 */
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "..", "src");
const IDS = path.resolve(SRC, "config", "ids.js");

const ROLE = { 1: "SUPER_ADMIN", 2: "BUILDER", 3: "CONSUMER", 4: "STAFF", 5: "BUILDER_CONSUMER", 7: "BUILDING_MANAGER" };
const CAT = { 2: "LOAN", 4: "MEDICLAIM", 5: "LIFE_INSURANCE", 6: "VEHICLE" };
const UNIT = { 1: "SHOWROOM", 2: "OFFICE", 3: "FLAT", 4: "HOUSE" };

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".js") && !e.name.endsWith(".test.js")) out.push(p);
  }
  return out;
}

const summary = [];
for (const file of walk(SRC, [])) {
  if (file === IDS) continue;
  if (file.endsWith(path.join("middleware", "rbac.js"))) continue; // rewritten by hand
  let s = fs.readFileSync(file, "utf8");
  const before = s;
  let n = 0;
  const used = { ROLE_IDS: false, CATEGORY_IDS: false, UNIT_CATEGORY_IDS: false };

  // role_id / Role  (comparisons and `: N` assignments)
  s = s.replace(/\b(role_id|Role)\b(\s*(?:===|==|!==|!=|:)\s*)"?(\d+)"?/g, (m, lhs, op, num) => {
    if (!ROLE[num]) return m;
    used.ROLE_IDS = true; n++;
    return `${lhs}${op}ROLE_IDS.${ROLE[num]}`;
  });

  // category_id
  s = s.replace(/\bcategory_id\b(\s*(?:===|==|!==|!=|:)\s*)"?(\d+)"?/g, (m, op, num) => {
    if (!CAT[num]) return m;
    used.CATEGORY_IDS = true; n++;
    return `category_id${op}CATEGORY_IDS.${CAT[num]}`;
  });

  // unit_category_id
  s = s.replace(/\bunit_category_id\b(\s*(?:===|==|!==|!=|:)\s*)"?(\d+)"?/g, (m, op, num) => {
    if (!UNIT[num]) return m;
    used.UNIT_CATEGORY_IDS = true; n++;
    return `unit_category_id${op}UNIT_CATEGORY_IDS.${UNIT[num]}`;
  });

  // categoryIds(.?).includes(N) — N===1 means the Super Admin role mixed in;
  // otherwise it's a category id.
  s = s.replace(/categoryIds(\??\.?)includes\(\s*(\d+)\s*\)/g, (m, dot, num) => {
    if (num === "1") { used.ROLE_IDS = true; n++; return `categoryIds${dot}includes(ROLE_IDS.SUPER_ADMIN)`; }
    if (CAT[num]) { used.CATEGORY_IDS = true; n++; return `categoryIds${dot}includes(CATEGORY_IDS.${CAT[num]})`; }
    return m;
  });

  if (s === before) continue;

  // Insert a require for the constants actually used, if not already present.
  const need = Object.entries(used).filter(([, v]) => v).map(([k]) => k);
  if (need.length && !/require\(["'].*config\/ids["']\)/.test(s)) {
    let relImport = path.relative(path.dirname(file), IDS).replace(/\\/g, "/").replace(/\.js$/, "");
    if (!relImport.startsWith(".")) relImport = "./" + relImport;
    const requireLine = `const { ${need.join(", ")} } = require("${relImport}");\n`;
    // place after the last top-of-file require/const line block
    const m = s.match(/^(?:.*\brequire\(.*\).*\n)+/);
    if (m) s = s.slice(0, m[0].length) + requireLine + s.slice(m[0].length);
    else s = requireLine + s;
  }

  fs.writeFileSync(file, s);
  summary.push(`${path.relative(SRC, file)}: ${n} replacements`);
}

console.log(summary.join("\n") || "no changes");
