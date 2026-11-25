// Recounts the "Status at a glance" table in ROADMAP.md from the phase tables.
//   node tools/roadmap-counts.mjs          rewrite the table in place
//   node tools/roadmap-counts.mjs --check  exit 1 if the table is out of date (for CI)
import { readFileSync, writeFileSync } from "node:fs";

const path = new URL("../ROADMAP.md", import.meta.url);
const text = readFileSync(path, "utf8");
const MARKS = ["✅", "🟨", "⬜", "⏸"];
const COLS = ["Th", "Win", "Web", "And", "Lin"];

// Rows look like: | C-3.7 | Title | § | Th | Win | Web | And | Lin | Notes |
const counts = new Map(); // phase -> col -> mark -> n
for (const line of text.split("\n")) {
  const m = /^\| C-(\d+)\.[^|]*\|/.exec(line);
  if (!m) continue;
  const cells = line.split("|").map((c) => c.trim());
  const marks = cells.slice(4, 9);
  if (marks.length < 5) continue;
  const phase = Number(m[1]);
  if (!counts.has(phase)) counts.set(phase, COLS.map(() => new Map()));
  marks.forEach((cell, i) => {
    const mark = MARKS.find((k) => cell.startsWith(k));
    if (mark) counts.get(phase)[i].set(mark, (counts.get(phase)[i].get(mark) ?? 0) + 1);
  });
}

const fmt = (m) => MARKS.filter((k) => m.get(k)).map((k) => `${k} ${m.get(k)}`).join(" · ") || "—";
const phases = [...counts.keys()].sort((a, b) => a - b);
const totals = COLS.map(() => new Map());
const rows = phases.map((p) => {
  const cols = counts.get(p);
  cols.forEach((m, i) => m.forEach((n, k) => totals[i].set(k, (totals[i].get(k) ?? 0) + n)));
  return `| ${p} | ${cols.map(fmt).join(" | ")} |`;
});
const table = [
  `| Phase | ${COLS.join(" | ")} |`,
  `|---|${COLS.map(() => "---").join("|")}|`,
  ...rows,
  `| **All** | ${totals.map((m) => `**${fmt(m)}**`).join(" | ")} |`,
].join("\n");

const re = /(## Status at a glance\n\n[^\n]*\n\n)\| Phase \|[\s\S]*?\n(?=\n)/;
if (!re.test(text)) {
  console.error("couldn't find the Status at a glance table");
  process.exit(2);
}
const updated = text.replace(re, (_, head) => head + table + "\n");
if (process.argv.includes("--check")) {
  if (updated !== text) {
    console.error("ROADMAP.md: Status at a glance is out of date; run node tools/roadmap-counts.mjs");
    process.exit(1);
  }
  console.log("Status at a glance is up to date");
} else {
  writeFileSync(path, updated);
  console.log(table.split("\n").at(-1));
}
