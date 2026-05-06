const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const covPath = path.join(root, "coverage", "coverage-summary.json");
const todoPath = path.join(root, "tasks", "unit-testing-todo.md");

/**
 * Paths referenced in backticks inside the unit-testing todo (source files only).
 */
function pathsFromTodo(todo) {
  const out = new Set();
  for (const match of todo.matchAll(/`(src\/[^`]+)`/g)) {
    const p = match[1];
    if (p.endsWith("/") || p.includes("*")) continue;
    if (!p.endsWith(".ts") && !p.endsWith(".tsx")) continue;
    out.add(p);
  }
  return out;
}

/**
 * Implementation files that share a directory with a co-located `*.spec.*`.
 */
function pathsAdjacentToSpecs(startDir) {
  const files = new Set();
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.spec\.(tsx?)$/.test(ent.name)) continue;
      const impl = ent.name.replace(/\.spec(\.(?:tsx?))$/, "$1");
      const rel = path
        .relative(root, path.join(d, impl))
        .replaceAll(path.sep, "/");
      if (fs.existsSync(path.join(root, rel))) files.add(rel);
    }
  }
  walk(startDir);
  return files;
}

const cov = JSON.parse(fs.readFileSync(covPath, "utf8"));
const todo = fs.readFileSync(todoPath, "utf8");

const merged = new Set([
  ...pathsFromTodo(todo),
  ...pathsAdjacentToSpecs(path.join(root, "src", "lib")),
  ...pathsAdjacentToSpecs(path.join(root, "src", "components")),
  ...pathsAdjacentToSpecs(path.join(root, "src", "app")),
  ...pathsAdjacentToSpecs(path.join(root, "src", "hooks")),
  ...pathsAdjacentToSpecs(path.join(root, "src", "stores")),
  ...pathsAdjacentToSpecs(path.join(root, "src", "types")),
  ...pathsAdjacentToSpecs(path.join(root, "src", "providers")),
]);

/** Normalize doc typos / renames to real source paths for this snapshot. */
const ALIASES = new Map([
  ["src/lib/logoUrl.ts", "src/lib/hub-logo.ts"],
  ["src/lib/responseSizeEstimator.ts", "src/lib/responseMetrics.ts"],
]);

const rows = [...merged]
  .map((rel) => ALIASES.get(rel) ?? rel)
  .filter((rel) => rel.endsWith(".ts") || rel.endsWith(".tsx"))
  .sort();

const seen = new Set();
const uniqueRowsRaw = rows.filter((r) => {
  if (seen.has(r)) return false;
  seen.add(r);
  return true;
});
const uniqueRows = uniqueRowsRaw.filter((r) =>
  fs.existsSync(path.join(root, r)),
);

console.log("| Source file | Lines % | Fraction |");
console.log("|-------------|---------|----------|");
for (const rel of uniqueRows) {
  const key = path.join(root, rel);
  const c = cov[key];
  const pct = c ? c.lines.pct.toFixed(2) : "—";
  const frac = c ? `${c.lines.covered}/${c.lines.total}` : "";
  console.log(`| \`${rel}\` | ${pct} | ${frac} |`);
}
console.log("");
console.log(
  `**Workspace total (Vitest):** ${cov.total.lines.pct}% lines (${cov.total.lines.covered}/${cov.total.lines.total})`,
);
