/* eslint-disable no-console */
/**
 * One-off migration script: split app/routes/users.routes.js into per-domain
 * route files under src/modules/<domain>/<domain>.routes.js, plus an aggregator
 * src/routes/index.js. Each route keeps its exact path, method, auth and
 * handler — only the controller it points at changes to the extracted module.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ROUTES_FILE = path.join(ROOT, "app/routes/users.routes.js");
const MODULES_DIR = path.join(ROOT, "src/modules");

// keep this in sync with split-controller.js
const DOMAINS = require("./domain-map");
const fnToDomain = {};
for (const [domain, fns] of Object.entries(DOMAINS)) {
  for (const fn of fns) fnToDomain[fn] = domain;
}

const raw = fs.readFileSync(ROUTES_FILE, "utf8");
const ROUTE_RE =
  /router\.(get|post|put|delete)\(\s*(["'][^"']+["'])\s*,\s*(\[verifyToken\]\s*,\s*)?userController\.(\w+)\s*\)/;

const perDomain = {};
let count = 0;
const unmapped = [];

for (const line of raw.split("\n")) {
  if (line.trim().startsWith("//")) continue; // skip commented-out routes
  const m = line.match(ROUTE_RE);
  if (!m) continue;
  const [, method, route, auth, fn] = m;
  const domain = fnToDomain[fn];
  if (!domain) {
    unmapped.push(fn);
    continue;
  }
  const mw = auth ? "verifyToken, " : "";
  (perDomain[domain] = perDomain[domain] || []).push(
    `router.${method}(${route}, ${mw}controller.${fn});`
  );
  count++;
}

if (unmapped.length) {
  console.warn("⚠️  Routed but unmapped fns (skipped):", [...new Set(unmapped)]);
}

const domainsWithRoutes = Object.keys(perDomain).sort();

for (const domain of domainsWithRoutes) {
  const file = `/**
 * ${domain} routes — mounted under /api.
 */
const express = require("express");
const verifyToken = require("../../../app/middleware/JWTAuth");
const controller = require("./${domain}.controller");

const router = express.Router();

${perDomain[domain].join("\n")}

module.exports = router;
`;
  fs.writeFileSync(
    path.join(MODULES_DIR, domain, `${domain}.routes.js`),
    file
  );
  console.log(`✅ ${domain}.routes.js (${perDomain[domain].length} routes)`);
}

// aggregator
fs.mkdirSync(path.join(ROOT, "src/routes"), { recursive: true });
const allDomains = ["auth", ...domainsWithRoutes];
const requires = allDomains
  .map(
    (d) =>
      `const ${d}Routes = require("../modules/${d}/${d}.routes");`
  )
  .join("\n");
const mounts = allDomains.map((d) => `router.use(${d}Routes);`).join("\n");

const aggregator = `/**
 * Aggregates every per-domain router. Mounted at /api by server.js.
 * (Replaces the legacy app/routes/users.routes.js single-file router.)
 */
const express = require("express");
${requires}

const router = express.Router();

${mounts}

module.exports = router;
`;
fs.writeFileSync(path.join(ROOT, "src/routes/index.js"), aggregator);
console.log(`\n✅ src/routes/index.js mounts ${allDomains.length} domain routers`);
console.log(`Total routes wired: ${count}`);
