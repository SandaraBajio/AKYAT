// Copies the shared data contracts from the backend so the app and Cloud Functions never drift.
// Run after anyone edits functions/src/types.ts:  npm run sync-types
const fs = require("fs");
const path = require("path");

const from = path.join(__dirname, "..", "..", "functions", "src", "types.ts");
const to = path.join(__dirname, "..", "src", "types.ts");
const banner =
  "// AUTO-COPIED from functions/src/types.ts by `npm run sync-types`. Do not edit here.\n";

fs.mkdirSync(path.dirname(to), { recursive: true });
fs.writeFileSync(to, banner + fs.readFileSync(from, "utf8"));
console.log("Synced types ->", path.relative(process.cwd(), to));
