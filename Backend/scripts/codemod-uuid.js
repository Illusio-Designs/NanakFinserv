#!/usr/bin/env node
/**
 * codemod-uuid.js — convert all model PKs and id/FK columns from INTEGER to UUID.
 *
 * Rules (line-based, namespace-agnostic — handles Sequelize.* and DataTypes.*):
 *   - A property whose key looks like an id/reference (ends in _id, Id, _by, or
 *     is exactly `id` / `builder_user` / `categoryId`) and whose type is INTEGER
 *     becomes UUID.
 *   - `autoIncrement: true` becomes `defaultValue: Sequelize.UUIDV4` (PKs).
 *
 * Logs every change. Run from Backend/:  node scripts/codemod-uuid.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "app", "models");

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".js")) out.push(p);
  }
  return out;
}

// Key looks like an id / foreign key.
function isIdKey(k) {
  return /(_id|Id|_by)$/.test(k) || k === "id" || k === "builder_user";
}

const changes = [];
for (const file of walk(ROOT, [])) {
  const rel = path.relative(ROOT, file);
  let lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let curKey = null;

  lines = lines.map((line) => {
    const mKey = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*\{/);
    if (mKey) curKey = mKey[1];

    // id/FK column: INTEGER -> UUID (preserve Sequelize./DataTypes. prefix)
    if (curKey && isIdKey(curKey) && /(Sequelize|DataTypes)\.INTEGER/.test(line)) {
      changes.push(`${rel}: ${curKey} INTEGER -> UUID`);
      return line.replace(/((?:Sequelize|DataTypes)\.)INTEGER/, "$1UUID");
    }
    return line;
  });

  let src = lines.join("\n");
  // autoIncrement -> UUID default (PKs). Sequelize param is always in scope.
  src = src.replace(/autoIncrement:\s*true\s*,?/g, () => {
    changes.push(`${rel}: autoIncrement -> defaultValue UUIDV4`);
    return "defaultValue: Sequelize.UUIDV4,";
  });

  fs.writeFileSync(file, src);
}

console.log(`Applied ${changes.length} changes:\n`);
console.log(changes.join("\n"));
