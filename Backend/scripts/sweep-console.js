/* eslint-disable no-console */
/**
 * One-off: replace console.* with the pino logger across domain controllers.
 *   console.error -> logger.error
 *   console.warn  -> logger.warn
 *   console.log / console.info / console.debug -> logger.debug
 * Adds the logger import to any controller that uses console.* but lacks it.
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "src", "modules");
const files = [];
for (const mod of fs.readdirSync(dir)) {
  const f = path.join(dir, mod, `${mod}.controller.js`);
  if (fs.existsSync(f)) files.push(f);
}

const IMPORT_ANCHOR = '} = require("../shared/context");\n';
const IMPORT_LINE = 'const logger = require("../../config/logger");\n';

let totalReplaced = 0;
for (const file of files) {
  let src = fs.readFileSync(file, "utf8");
  const before = (src.match(/console\.(log|error|warn|info|debug)\(/g) || []).length;
  if (!before) continue;

  // Ensure the logger is imported.
  if (!src.includes("config/logger")) {
    if (src.includes(IMPORT_ANCHOR)) {
      src = src.replace(IMPORT_ANCHOR, IMPORT_ANCHOR + IMPORT_LINE);
    } else {
      src = IMPORT_LINE + src;
    }
  }

  src = src
    .replace(/console\.error\(/g, "logger.error(")
    .replace(/console\.warn\(/g, "logger.warn(")
    .replace(/console\.(log|info|debug)\(/g, "logger.debug(");

  fs.writeFileSync(file, src);
  totalReplaced += before;
  console.log(`${path.basename(file)}: ${before} replaced`);
}
console.log(`\nTotal console.* replaced: ${totalReplaced}`);
