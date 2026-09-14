/*
 * Verification harness for the project board.
 *
 * Run from this folder:  node test-board.mjs
 *
 * Loads the real view.js and exercises its pure functions against the demo
 * wiki in ./demo, so there is no second copy of the parsing logic to drift. Rendering
 * and anything touching the Obsidian `app` object are out of scope here and
 * are covered by the manual checklist in DESIGN.md.
 *
 * Write-back is exercised against strings and a temp file only. It never
 * writes to the vault.
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
// The harness runs against ./demo, the invented wiki shipped beside it, so the
// "vault" is this folder. Nothing here reads a real vault: a test that needs a
// real one is a test that cannot run anywhere but on one machine.
const VAULT = here;
const board = createRequire(import.meta.url)("./view.js");

// node test-board.mjs [--wiki st|p|both]   default: both
const wikiArg = process.argv.includes("--wiki")
  ? process.argv[process.argv.indexOf("--wiki") + 1]
  : "both";
const WIKI_KEYS = wikiArg === "both" ? Object.keys(board.WIKIS) : [wikiArg];
for (const key of WIKI_KEYS) {
  if (!board.WIKIS[key]) {
    console.log(`\nunknown wiki "${key}". Known: ${Object.keys(board.WIKIS).join(", ")}\n`);
    process.exit(2);
  }
}

let failures = 0;
let checks = 0;

function eq(label, actual, expected) {
  checks++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  const mark = ok ? "PASS" : "FAIL";
  const detail = ok ? `${JSON.stringify(actual)}` : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
  console.log(`  [${mark}] ${label.padEnd(46)} ${detail}`);
}

function ok(label, condition, detail = "") {
  checks++;
  if (!condition) failures++;
  console.log(`  [${condition ? "PASS" : "FAIL"}] ${label.padEnd(46)} ${detail}`);
}

/* --------------------------------------------------- vault collection */

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function vaultPath(abs) {
  return path.relative(VAULT, abs).split(path.sep).join("/");
}

function collectTasks(wiki, settings) {
  const root = path.join(VAULT, wiki.root);
  const tasks = [];
  for (const abs of walk(root)) {
    const rel = vaultPath(abs);
    if (!board.inScope(rel, settings)) continue;
    tasks.push(...board.extractTasks(fs.readFileSync(abs, "utf8"), rel));
  }
  return tasks;
}

const BOARD_NOTES = {
  demo: "demo/Board.md",
};

/*
 * Parse just enough of a board note's frontmatter to hand resolveFlags its
 * board_flags list. There is no YAML parser here, and adding a dependency to a
 * harness that runs under bare node is not worth one block: this reads the one
 * shape the docs describe, `- key: value` lines indented under the key, and
 * stops at the next top-level key.
 */
function boardFrontmatter(notePath) {
  const block = fs.readFileSync(path.join(VAULT, notePath), "utf8").split("---")[1] || "";
  const lines = block.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `${board.FLAG_KEY}:`);
  if (start < 0) return {};
  const entries = [];
  for (const line of lines.slice(start + 1)) {
    const item = /^\s*-\s*(\w+):\s*(.+)$/.exec(line);
    const more = /^\s+(\w+):\s*(.+)$/.exec(line);
    if (item) entries.push({ [item[1]]: item[2].trim() });
    else if (more && entries.length) entries[entries.length - 1][more[1]] = more[2].trim();
    else break;
  }
  return { [board.FLAG_KEY]: entries };
}

function frontmatterValue(content, key) {
  const m = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(content.split("---")[1] || "");
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

function landingMeta(landing, archived, kind) {
  const exists = fs.existsSync(landing);
  const content = exists ? fs.readFileSync(landing, "utf8") : "";
  return {
    path: exists ? vaultPath(landing) : null,
    status: archived ? "archived" : frontmatterValue(content, "status") || "active",
    lastActivity: (frontmatterValue(content, "last_activity") || "").slice(0, 10) || null,
    created: (frontmatterValue(content, "created") || "").slice(0, 10) || null,
    kind,
  };
}

/*
 * Mirrors the view's discovery against the filesystem instead of Obsidian's
 * index, so a divergence between the two shows up as a failing invariant.
 *
 * depth 1: <root>/<slug>/<slug>.md
 * depth 2: <root>/<cat>/<cat>.md as a category column, plus <cat>/<slug>.md and
 *          <cat>/<slug>/<slug>.md as project columns
 */
function scanProjects(root, depth, archived) {
  if (!fs.existsSync(root)) return [];
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "_old" || entry.name.startsWith(".")) continue;
    if (depth === 1) {
      out.push({
        slug: entry.name,
        ...landingMeta(path.join(root, entry.name, `${entry.name}.md`), archived, "project"),
      });
      continue;
    }
    const cat = path.join(root, entry.name);
    out.push({
      slug: entry.name,
      ...landingMeta(path.join(cat, `${entry.name}.md`), archived, "category"),
    });
    for (const child of fs.readdirSync(cat, { withFileTypes: true })) {
      if (child.name.startsWith(".")) continue;
      if (child.isDirectory()) {
        if (child.name === "_old") continue;
        out.push({
          slug: child.name,
          ...landingMeta(path.join(cat, child.name, `${child.name}.md`), archived, "project"),
        });
      } else if (child.name.endsWith(".md")) {
        const slug = child.name.replace(/\.md$/, "");
        if (slug === entry.name) continue; // the category landing, already added
        out.push({ slug, ...landingMeta(path.join(cat, child.name), archived, "project") });
      }
    }
  }
  return out;
}

function collectProjects(wiki) {
  const root = path.join(VAULT, wiki.projectsFolder);
  return [
    ...scanProjects(root, wiki.projectDepth, false),
    ...scanProjects(path.join(root, "_old"), wiki.projectDepth, true),
  ];
}

/* ------------------------------------------------------------- run */

const TODAY = "2026-08-05";

function run(wiki) {
console.log(`\n${"=".repeat(60)}\n${wiki.label} wiki (${wiki.slug})\n${"=".repeat(60)}`);

const SETTINGS_DEFAULT = board.resolveSettings(null, wiki);
const tasks = collectTasks(wiki, SETTINGS_DEFAULT);
const projects = collectProjects(wiki);
const columns = board.buildColumns(tasks, projects, TODAY, null, wiki);

const archivedSlugs = () =>
  new Set(projects.filter((p) => p.status === "archived").map((p) => p.slug));

// "Open" here must mean exactly what a column's openCount means, which
// makeColumn defines as the in-progress lane plus the open lane. Counting only
// status " " makes every placement cross-check below disagree by the number of
// in-progress tasks, and passes silently on a wiki that happens to have none.
const open = tasks.filter((t) => t.status === " " || t.status === "/");
const byCol = new Map(columns.map((c) => [c.slug, c]));
const projectCols = columns.filter((c) => !c.unassigned);

/*
 * These run against the live vault, which changes every time a task is added
 * or ticked. Exact counts would therefore fail for no reason, so the
 * assertions below are invariants and cross-checks that hold at any vault
 * state. The current numbers are printed as information, not asserted.
 */
// Column-eligible, not literally "active": a wiki may give a column to a
// status of its own, so hardcoding "active" would under-count its columns.
// SHARED.parkedStatus joins them whenever show_parked is on, which is the
// default, and this has to mirror buildColumns or every count below drifts.
const eligible = new Set(wiki.columnStatuses);
if (board.SHARED.parkedStatus) eligible.add(board.SHARED.parkedStatus);
const activeSlugs = new Set(projects.filter((p) => eligible.has(p.status)).map((p) => p.slug));
const knownSlugs = new Set(projects.map((p) => p.slug));
// routeProjects, not resolveProjects: the board routes on the leading run, so a
// cross-check using every link would disagree with it by construction.
const linkedActive = open.filter((t) => board.routeProjects(t, activeSlugs).length > 0);
const linkedInactive = open.filter(
  (t) => board.routeProjects(t, activeSlugs).length === 0 && board.routeProjects(t, knownSlugs).length > 0
);
const unlinked = open.filter((t) => board.routeProjects(t, knownSlugs).length === 0);
// One task may name two projects in its leading run, which puts it in both
// columns by design. Column occupancy is therefore placements, not tasks.
const placements = linkedActive.reduce((n, t) => n + board.routeProjects(t, activeSlugs).length, 0);

console.log("\nSnapshot (informational, not asserted)");
console.log(`  open in scope ${open.length}, cancelled ${tasks.filter((t) => t.status === "-").length}, ` +
  `in progress ${tasks.filter((t) => t.status === "/").length}, with due date ${open.filter((t) => t.due).length}`);
console.log(`  project columns ${projectCols.length}, populated ${projectCols.filter((c) => c.openCount > 0).length}, ` +
  `unassigned ${byCol.get("Unassigned").openCount}`);
console.log("  " + projectCols.filter((c) => c.openCount > 0).map((c) => `${c.slug}:${c.openCount}`).join(", "));

console.log("\nRouting invariants");
eq("every open task is routed exactly one way",
  linkedActive.length + linkedInactive.length + unlinked.length, open.length);
eq("unassigned column holds exactly the unlinked open tasks",
  byCol.get("Unassigned").openCount, unlinked.length);
eq(
  "project columns hold exactly the routed open placements",
  projectCols.reduce((n, c) => n + c.openCount, 0),
  placements
);
ok("unassigned column is first", columns[0].slug === "Unassigned", columns[0].slug);
ok("every column-eligible project has a column", activeSlugs.size === projectCols.length, `${activeSlugs.size} vs ${projectCols.length}`);
ok("no archived project has a column", !projectCols.some((c) => !activeSlugs.has(c.slug)));
// A task in two columns is legitimate, but only when its leading run names two
// projects. Any other duplication is a routing bug.
{
  const seen = new Map();
  for (const c of projectCols) {
    for (const lane of c.lanes) {
      for (const t of lane.tasks) {
        const id = `${t.path}:${t.line}`;
        seen.set(id, (seen.get(id) || 0) + 1);
      }
    }
  }
  const overCounted = [...seen].filter(([id, n]) => {
    const t = tasks.find((x) => `${x.path}:${x.line}` === id);
    return n > board.routeProjects(t, activeSlugs).length;
  });
  ok("no task appears in more columns than it names", overCounted.length === 0,
     overCounted.map(([id, n]) => `${id} x${n}`).join("; ") || "none");
}
console.log(`  (info) open tasks with no created date: ${open.filter((t) => !t.created).length}`);
// Missing created dates are a data property, not a defect: what must hold is
// that a task without one still sorts, last, rather than breaking the compare.
ok("undated tasks sort after dated ones",
  (() => {
    const sorted = [...open].sort(board.compareTasks);
    const firstUndated = sorted.findIndex((t) => !t.due && !t.created);
    return firstUndated === -1 || sorted.slice(firstUndated).every((t) => !t.due && !t.created);
  })());
ok("cancelled tasks never reach a column",
  !columns.some((c) => c.lanes.some((l) => l.tasks.some((t) => t.status === "-"))));

console.log("\nColumn ordering");
const counts = projectCols.map((c) => c.openCount);
ok(
  "open count descending",
  counts.every((n, i) => i === 0 || counts[i - 1] >= n),
  counts.join(",")
);

console.log("\nLink resolution");
{
  // A mid-sentence mention is not an assignment. Two Personal tasks name another
  // project in their prose ("decide whether to retire [[legacy-export]]");
  // routing on every link put them in both columns, as outstanding work on the
  // project they propose retiring.
  const mentionOnly = open.filter(
    (t) => board.resolveProjects(t, activeSlugs).length > board.routeProjects(t, activeSlugs).length
  );
  console.log(`  (info) open tasks mentioning another project mid-sentence: ${mentionOnly.length}`);
  ok("a mid-sentence mention does not add a column",
     mentionOnly.every((t) => board.routeProjects(t, activeSlugs).length <= 1),
     mentionOnly.map((t) => board.routeProjects(t, activeSlugs).join("+")).join("; ") || "none");
  ok("multi-column tasks name every one in their leading run",
     open.filter((t) => board.routeProjects(t, activeSlugs).length > 1)
       .every((t) => board.routeProjects(t, activeSlugs).every((slug) =>
         t.lead.some((l) => l.toLowerCase() === slug.toLowerCase()))));
}
const archived = archivedSlugs();
eq(
  "open tasks linking only an archived project",
  open.filter(
    (t) =>
      board.resolveProjects(t, activeSlugs).length === 0 &&
      t.links.some((l) => archived.has(l))
  ).length,
  0
);
{
  // A task linking only an archived project leaves the board rather than
  // falling into Unassigned. The case that found this: a task
  // completed against [[retired-project]] on 2026-08-05, polluting triage.
  // The slug is taken from the wiki's real archive so this runs on any wiki.
  const archivedSlug = [...archivedSlugs()][0];
  if (!archivedSlug) {
    console.log(`  [SKIP] ${wiki.slug} has no archived project to route`);
  } else {
    const archivedTask = board.extractTasks(
      `- [x] [[${archivedSlug}]] kickoff checklist ➕ 2026-05-18 ✅ 2026-08-05`,
      "x/x.md"
    );
    const cols = board.buildColumns(archivedTask, projects, TODAY, null, wiki);
    eq("archived-project task leaves the board", cols.find((c) => c.unassigned).lanes.length, 0);
    eq(
      "and is not silently added to a project column",
      cols.filter((c) => c.lanes.length > 0).length,
      0
    );
  }
  const unlinked = board.extractTasks("- [x] loose end ➕ 2026-08-01 ✅ 2026-08-05", "x/x.md");
  eq(
    "but a task with no project link still reaches triage",
    board.buildColumns(unlinked, projects, TODAY, null, wiki).find((c) => c.unassigned).lanes.length,
    1
  );
}

console.log("\nRegression guards");
ok(
  "no task from a fenced code block",
  !tasks.some((t) => t.path.endsWith("wiki-config.md")),
  tasks.filter((t) => t.path.endsWith("wiki-config.md")).length + " found"
);
// Nothing from any folder this wiki declares out of scope. Typically that is
// demo/Archive's ~550 transcript checkbox lines; on Personal it is demo/Archive'
// checklists. A scope regression is a twentyfold blowout, not a subtle one.
for (const skipped of SETTINGS_DEFAULT.exclude_folders) {
  const hits = tasks.filter((t) => t.path.startsWith(skipped + "/"));
  ok(`nothing from ${skipped}`, hits.length === 0, hits.length + " found");
}
{
  // The documented example in wiki-config.md, parsed directly rather than via
  // the scan, must still be reachable when fences are not stripped. This
  // proves the guard above is doing work and not passing by accident.
  const fenced = "```\n- [ ] [[Person]] [[ProjectSlug]] description \u2795 2026-01-01\n```";
  eq("fence stripping actually applies", board.extractTasks(fenced, "x.md").length, 0);
  eq("same line outside a fence parses", board.extractTasks(fenced.replaceAll("```", ""), "x.md").length, 1);
}

console.log("\nParsing");
{
  const line = "- [ ] [[Alex Rivera]] [[website-redesign]] ship the new navigation \u2795 2026-08-02 \u{1F4C5} 2026-08-09 \u{1F53C}";
  const [t] = board.extractTasks(line, "demo/Journal/entry.md");
  eq("status", t.status, " ");
  eq("created", t.created, "2026-08-02");
  eq("due", t.due, "2026-08-09");
  eq("priority weight", t.prio, 3);
  eq("links", t.links, ["Alex Rivera", "website-redesign"]);
  eq("leading tags", board.leadingTags(t.body), ["Alex Rivera", "website-redesign"]);
  eq(
    "description strips leading tags and metadata",
    board.cleanDescription(t.body, new Set(["website-redesign", "Alex Rivera"])),
    "ship the new navigation"
  );
}
{
  // Regression: dropping a link from mid-sentence mangled the prose. This real
  // task rendered as "Check with whether the old export is still used".
  const [t] = board.extractTasks(
    "- [ ] Check with [[Sam Okafor]] whether the old export is still used ➕ 2026-05-12",
    "demo/Journal/entry.md"
  );
  eq("no leading tags when prose comes first", board.leadingTags(t.body), []);
  eq(
    "mid-sentence person link survives intact",
    board.cleanDescription(t.body, new Set(["sam okafor"])),
    "Check with [[Sam Okafor]] whether the old export is still used"
  );
}
{
  // Leading run stops at the first non-dropped link, so an unrecognised tag
  // does not let later ones be stripped out of order.
  const [t] = board.extractTasks("- [ ] [[api-mig|ApiMig]] [[api-migration]] test rollout", "demo/Journal/entry.md");
  eq("leading run includes both", board.leadingTags(t.body), ["api-mig", "api-migration"]);
  eq(
    "stripping stops at the unrecognised tag",
    board.cleanDescription(t.body, new Set(["krisp-wa"])),
    "[[api-mig|ApiMig]] [[api-migration]] test rollout"
  );
}
{
  const alias = board.extractTasks("- [x] see [[api-mig|ApiMig]] \u2705 2026-08-01", "demo/Journal/entry.md")[0];
  eq("aliased link resolves to target", alias.links, ["api-mig"]);
  eq("done date", alias.done, "2026-08-01");
}

console.log("\nSorting");
{
  const mk = (due, created, prio) => ({ due, created, prio });
  const sorted = [
    mk(null, "2026-01-01", 2),
    mk("2026-08-09", "2026-01-01", 2),
    mk("2026-08-01", "2026-01-01", 2),
    mk(null, "2025-01-01", 2),
  ].sort(board.compareTasks);
  eq("dated before undated, each ascending", sorted.map((t) => t.due || t.created), [
    "2026-08-01",
    "2026-08-09",
    "2025-01-01",
    "2026-01-01",
  ]);
  const tie = [mk(null, "2026-01-01", 1), mk(null, "2026-01-01", 4)].sort(board.compareTasks);
  eq("priority breaks ties, highest first", tie[0].prio, 4);
}

console.log("\nSearch filter");
{
  ok("plain substring matches", board.fuzzyMatch("navigation", "ship the new navigation"));
  ok("case-insensitive", board.fuzzyMatch("SSO", "migrate to sso"));
  ok("subsequence, not substring", board.fuzzyMatch("shpnav", "ship the new navigation"));
  ok("non-subsequence rejected", !board.fuzzyMatch("smo", "migrate to sso"));
  ok("terms match in any order", board.fuzzyMatch("sso migrate", "migrate to sso"));
  ok("all terms must match", !board.fuzzyMatch("sso gateway", "migrate to sso"));
  ok("empty query matches everything", board.fuzzyMatch("", "anything"));
  ok("blank-only query matches everything", board.fuzzyMatch("   ", "anything"));
}
{
  const [t] = board.extractTasks(
    "- [ ] [[Alex Rivera]] [[website-redesign]] ship the new navigation ➕ 2026-08-02",
    "demo/Journal/entry.md"
  );
  ok("matches description", board.taskMatchesQuery(t, "navigation"));
  ok("matches project link", board.taskMatchesQuery(t, "redesign"));
  ok("matches person link", board.taskMatchesQuery(t, "rivera"));
  ok("rejects absent term", !board.taskMatchesQuery(t, "gateway"));
}
{
  // The query narrows the pool before routing, so non-matching tasks neither
  // fill a column nor keep an empty one on the board.
  const tasks = board.extractTasks(
    [
      "- [ ] [[alpha-project]] first task",
      "- [ ] [[alpha-project]] second task",
      "- [ ] [[beta-project]] first task elsewhere",
      "- [ ] unlinked first task",
    ].join("\n"),
    "demo/Journal/entry.md"
  );
  const projects = [
    { slug: "alpha-project", status: "active" },
    { slug: "beta-project", status: "active" },
  ];
  const cols = board.buildColumns(tasks, projects, "2026-08-18", null, board.WIKIS.demo, "first");
  const bySlug = Object.fromEntries(cols.map((c) => [c.slug, c]));
  eq("matching tasks stay in their column", bySlug["alpha-project"].openCount, 1);
  eq("matching task routes to beta too", bySlug["beta-project"].openCount, 1);
  eq("unlinked match lands in Unassigned", bySlug["Unassigned"].openCount, 1);
  eq(
    "matching card is the right one",
    bySlug["alpha-project"].lanes[0].tasks[0].body.includes("first task elsewhere"),
    false
  );
  const none = board.buildColumns(tasks, projects, "2026-08-18", null, board.WIKIS.demo, "zzz-no-match");
  eq("no match empties every column", none.every((c) => c.openCount === 0), true);
  const all = board.buildColumns(tasks, projects, "2026-08-18", null, board.WIKIS.demo, "");
  eq("empty query keeps the full board", all.reduce((n, c) => n + c.openCount, 0), 4);
}

console.log("\nDone window");
{
  const mkDone = (done) => `- [x] thing \u2795 2026-07-01 \u2705 ${done}`;
  const recent = board.extractTasks(mkDone("2026-08-03"), "demo/Journal/entry.md");
  const old = board.extractTasks(mkDone("2026-06-01"), "demo/Journal/entry.md");
  const proj = [{ slug: "p", status: "active", lastActivity: "2026-08-01", path: "p.md" }];
  const within = board.buildColumns(recent, proj, TODAY, null, wiki).find((c) => c.unassigned);
  const outside = board.buildColumns(old, proj, TODAY, null, wiki).find((c) => c.unassigned);
  eq("done within 7 days is shown", within.lanes.length, 1);
  eq("done outside 7 days is dropped", outside.lanes.length, 0);
}

console.log("\nSettings resolution");
{
  const d = board.resolveSettings(null, wiki);
  // Every SETTINGS key, plus the three flag keys resolveSettings resolves
  // separately: the usable flags, the problems from validating them, and the
  // declaration the panel editor binds to.
  eq("no frontmatter yields every default", Object.keys(d).length, board.SETTINGS.length + 3);
  eq("and no flags", [d.flags.length, d.flagProblems.length], [0, 0]);
  eq("default: unassigned shown", d.show_unassigned, true);
  eq("default: source chip off", d.chip_source, false);
  eq("default: done window", d.done_window_days, 7);
  eq("default: column order", d.column_order, "count");

  const o = board.resolveSettings({ board_show_unassigned: false, board_column_width: 320 }, wiki);
  eq("frontmatter overrides", [o.show_unassigned, o.column_width], [false, 320]);
  eq("unset keys keep their default", o.chip_due, true);

  // A typo should cost one setting, not the whole board.
  eq("bogus enum falls back", board.resolveSettings({ board_column_order: "banana" }, wiki).column_order, "count");
  eq("width clamps low", board.resolveSettings({ board_column_width: 10 }, wiki).column_width, 180);
  eq("width clamps high", board.resolveSettings({ board_column_width: 9999 }, wiki).column_width, 600);
  eq("window clamps negative", board.resolveSettings({ board_done_window_days: -5 }, wiki).done_window_days, 0);
  eq("non-numeric number falls back", board.resolveSettings({ board_column_width: "wide" }, wiki).column_width, 280);
  eq("string 'false' reads as false", board.resolveSettings({ board_chip_due: "false" }, wiki).chip_due, false);
  eq("string 'yes' reads as true", board.resolveSettings({ board_chip_source: "yes" }, wiki).chip_source, true);
  eq("nonsense bool falls back", board.resolveSettings({ board_chip_due: "maybe" }, wiki).chip_due, true);
  eq("null is treated as unset", board.resolveSettings({ board_chip_due: null }, wiki).chip_due, true);
  // Deep compare: list settings return a fresh array, so === would fail here
  // for a reason that has nothing to do with the prefix.
  //
  // Round-trip through the *resolved* default, not spec.def. The scope keys
  // carry def: null because their defaults live on the wiki, and writing null
  // to frontmatter means "unset" rather than "this value", so comparing against
  // spec.def would assert that unsetting a key yields null.
  const resolvedDefaults = board.resolveSettings(null, wiki);
  ok("every setting key is prefixed on read",
    board.SETTINGS.every((s) =>
      JSON.stringify(
        board.resolveSettings({ [board.SETTING_PREFIX + s.key]: resolvedDefaults[s.key] }, wiki)[s.key]
      ) === JSON.stringify(resolvedDefaults[s.key])));
  ok("defaults are not shared by reference",
    board.resolveSettings(null, wiki).include_folders !== board.resolveSettings(null, wiki).include_folders);
  ok("scope defaults come from the wiki, not the spec",
    board.SETTINGS.find((s) => s.key === "include_folders").def === null &&
      Array.isArray(resolvedDefaults.include_folders));
}

console.log("\nScope settings");
{
  const S = (over) => board.resolveSettings(over, wiki);
  const d = S(null);
  // Asserted against the wiki's own declaration rather than a literal, so this
  // block is the same test for every wiki the board serves.
  eq("default include is this wiki's root", d.include_folders, [wiki.root]);
  eq("default exclude count", d.exclude_folders.length, wiki.settingDefaults.exclude_folders.length);
  ok("every excluded folder sits inside this wiki",
     d.exclude_folders.every((f) => f === wiki.root || f.startsWith(wiki.root + "/")),
     d.exclude_folders.join(", "));

  ok("default scope accepts a note in this wiki", board.inScope(`${wiki.root}/Notes/entry.md`, d));
  ok("default scope rejects an excluded folder",
     d.exclude_folders.length === 0 || !board.inScope(`${d.exclude_folders[0]}/x.md`, d));
  // Anything outside this wiki's root, whether or not another wiki is
  // configured. Written without reference to a second entry so the check holds
  // for a table with one wiki in it.
  ok("default scope rejects a tree outside this wiki",
     !board.inScope("somewhere-else/Notes/entry.md", d));
  ok("non-markdown always rejected", !board.inScope(`${wiki.root}/Notes/x.png`, d));

  // Prefix matching must be on path segments, not raw string prefixes, or a
  // root would also swallow a sibling folder whose name merely starts with it.
  ok("sibling folder with a shared prefix is not swallowed",
     !board.inScope(`${wiki.root}-archive/note.md`, d));

  // Widening the scope by hand. The second folder is invented rather than taken
  // from another WIKIS entry, so this holds for a table with one wiki in it.
  const two = S({ board_include_folders: [wiki.root, "elsewhere"] });
  ok("adding a folder widens scope", board.inScope("elsewhere/Notes/x.md", two));
  ok("and keeps the original", board.inScope(`${wiki.root}/Notes/x.md`, two));

  const noSkip = S({ board_exclude_folders: [] });
  ok("emptying exclude lets a skipped folder back in",
     d.exclude_folders.length === 0 || board.inScope(`${d.exclude_folders[0]}/x.md`, noSkip));

  eq("string input splits on newlines",
     S({ board_include_folders: "a\nb" }).include_folders, ["a", "b"]);
  eq("string input splits on commas",
     S({ board_include_folders: "a, b" }).include_folders, ["a", "b"]);
  eq("slashes are stripped",
     S({ board_include_folders: [`/${wiki.root}/`] }).include_folders, [wiki.root]);
  eq("blank entries dropped",
     S({ board_include_folders: [wiki.root, "", "   "] }).include_folders, [wiki.root]);
  // A blank include field means "I cleared it", not "scan my entire vault".
  eq("empty include falls back to this wiki's default",
     S({ board_include_folders: [] }).include_folders, [wiki.root]);
  eq("empty exclude is honoured", S({ board_exclude_folders: [] }).exclude_folders, []);
}

console.log("\nSettings applied to columns");
{
  const S = (over) => board.resolveSettings(over, wiki);
  const hidden = board.buildColumns(tasks, projects, TODAY, S({ board_show_unassigned: false }), wiki);
  ok("hiding unassigned marks it, does not drop it", hidden[0].hidden === true && hidden[0].slug === "Unassigned");
  eq("hidden column still carries its count", hidden[0].openCount, byCol.get("Unassigned").openCount);

  const noEmpty = board.buildColumns(tasks, projects, TODAY, S({ board_show_empty_columns: false }), wiki);
  ok("hiding empty columns leaves only columns with open tasks",
    noEmpty.filter((c) => !c.unassigned).every((c) => c.openCount > 0),
    `${noEmpty.length - 1} project columns remain`);
  // The setting says "no open tasks", so a project whose only content is a
  // recently completed task must go too. Filtering on "has any lane" left it
  // visible and quietly contradicted the label.
  ok("a project with only a recent done task is also hidden",
    !noEmpty.some((c) => !c.unassigned && c.openCount === 0),
    noEmpty.filter((c) => !c.unassigned && c.openCount === 0).map((c) => c.slug).join(", ") || "none");
  ok("hiding empty columns never removes an open task",
    noEmpty.reduce((n, c) => n + c.openCount, 0) === columns.reduce((n, c) => n + c.openCount, 0));

  const alpha = board.buildColumns(tasks, projects, TODAY, S({ board_column_order: "alpha" }), wiki)
    .filter((c) => !c.unassigned).map((c) => c.slug.toLowerCase());
  eq("alphabetical order", alpha, [...alpha].sort());

  const noDone = board.buildColumns(tasks, projects, TODAY, S({ board_lane_done: false }), wiki);
  ok("done lane off removes every done task",
    !noDone.some((c) => c.lanes.some((l) => l.key === "done")));

  const wide = board.buildColumns(tasks, projects, TODAY, S({ board_done_window_days: 365 }), wiki);
  const narrow = board.buildColumns(tasks, projects, TODAY, S({ board_done_window_days: 0 }), wiki);
  const doneCount = (cols) => cols.reduce((n, c) => n + c.lanes.filter((l) => l.key === "done")
    .reduce((m, l) => m + l.tasks.length, 0), 0);
  ok("wider done window shows at least as many", doneCount(wide) >= doneCount(narrow),
    `${doneCount(wide)} vs ${doneCount(narrow)}`);

  ok("settings never change the open-task set",
    [S({ board_lane_done: false }), S({ board_compact: true }), S({ board_chip_due: false })]
      .every((st) => board.buildColumns(tasks, projects, TODAY, st, wiki)
        .reduce((n, c) => n + c.openCount, 0) === columns.reduce((n, c) => n + c.openCount, 0)));
}

console.log("\nColumn sort modes");
{
  const S = (over) => board.resolveSettings(over, wiki);
  const cols = (over) => board.buildColumns(tasks, projects, TODAY, S(over), wiki)
    .filter((c) => !c.unassigned).map((c) => c.slug);
  const all = cols({});

  for (const mode of Object.keys(board.ORDER_MODES)) {
    eq(`${mode} keeps every column exactly once`,
       [...cols({ board_column_order: mode })].sort(), [...all].sort());
  }

  ok("unassigned stays first in every mode",
     Object.keys(board.ORDER_MODES).every((mode) =>
       board.buildColumns(tasks, projects, TODAY, S({ board_column_order: mode }), wiki)[0].unassigned));

  const counts = board.buildColumns(tasks, projects, TODAY, S({ board_column_order: "count" }), wiki)
    .filter((c) => !c.unassigned).map((c) => c.openCount);
  ok("count descending by default", counts.every((n, i) => i === 0 || counts[i - 1] >= n), counts.join(","));
  const asc = board.buildColumns(tasks, projects, TODAY,
    S({ board_column_order: "count", board_column_order_dir: "asc" }), wiki)
    .filter((c) => !c.unassigned).map((c) => c.openCount);
  ok("count ascending when flipped", asc.every((n, i) => i === 0 || asc[i - 1] <= n), asc.join(","));

  const alpha = cols({ board_column_order: "alpha" }).map((s) => s.toLowerCase());
  eq("alphabetical ascending", alpha, [...alpha].sort());
  const zeta = cols({ board_column_order: "alpha", board_column_order_dir: "desc" }).map((s) => s.toLowerCase());
  eq("alphabetical descending", zeta, [...alpha].sort().reverse());

  eq("auto direction resolves per mode",
     [board.effectiveDir("count", "auto"), board.effectiveDir("alpha", "auto"),
      board.effectiveDir("due", "auto"), board.effectiveDir("alpha", "desc")],
     ["desc", "asc", "asc", "desc"]);
  eq("a bogus direction falls back to natural", board.effectiveDir("alpha", "sideways"), "asc");
}

console.log("\nValue-less columns stay last");
{
  const mk = (slug, over) => ({ slug, openCount: 0, lastActivity: null, created: null,
    nextDue: null, topPrio: null, oldestCreated: null, lanes: [], ...over });
  const set = [mk("b", { nextDue: "2026-09-01" }), mk("a"), mk("c", { nextDue: "2026-08-01" }), mk("d")];
  eq("ascending puts dated first, undated last by name",
     board.sortColumns(set, "due", "asc").map((c) => c.slug), ["c", "b", "a", "d"]);
  // Flipping direction must not drag the undated columns to the front: they have
  // no value in this mode, so their place is the end either way.
  eq("descending keeps undated last",
     board.sortColumns(set, "due", "desc").map((c) => c.slug), ["b", "c", "a", "d"]);
  eq("a zero count is a value, not an absence",
     board.sortColumns([mk("z", { openCount: 0 }), mk("y", { openCount: 3 })], "count", "asc")
       .map((c) => c.slug), ["z", "y"]);
}

console.log("\nManual column order");
{
  const mk = (slug) => ({ slug, openCount: 0, lastActivity: null, created: null,
    nextDue: null, topPrio: null, oldestCreated: null, lanes: [] });
  const set = [mk("alpha"), mk("beta"), mk("gamma")];
  eq("listed order is honoured",
     board.resolveManualOrder(set, ["gamma", "alpha"]).map((c) => c.slug), ["gamma", "alpha", "beta"]);
  eq("unknown slugs are dropped",
     board.resolveManualOrder(set, ["ghost", "beta"]).map((c) => c.slug), ["beta", "alpha", "gamma"]);
  eq("duplicates are collapsed",
     board.resolveManualOrder(set, ["beta", "beta"]).map((c) => c.slug), ["beta", "alpha", "gamma"]);
  eq("matching is case-insensitive",
     board.resolveManualOrder(set, ["GAMMA"]).map((c) => c.slug), ["gamma", "alpha", "beta"]);
  // A new project missing from the list must never be invisible.
  eq("empty list falls back to name order",
     board.resolveManualOrder(set, []).map((c) => c.slug), ["alpha", "beta", "gamma"]);
  eq("manual mode routes through it",
     board.sortColumns(set, "manual", "asc", ["gamma"]).map((c) => c.slug), ["gamma", "alpha", "beta"]);
  // Same rule against the live board: pin the column that automatic ordering
  // puts last, and it must come first.
  const autoOrder = projectCols.map((c) => c.slug);
  const pinned = autoOrder.at(-1);
  eq("manual order survives a real board",
     board.buildColumns(tasks, projects, TODAY,
       board.resolveSettings(
         { board_column_order: "manual", board_column_manual: [pinned] }, wiki), wiki)
       .filter((c) => !c.unassigned)[0].slug,
     pinned);
}

console.log("\nSort keys on real columns");
{
  const withOpen = projectCols.filter((c) => c.openCount > 0);
  ok("a column with no open task has no priority key",
     projectCols.filter((c) => c.openCount === 0).every((c) => c.topPrio === null),
     projectCols.filter((c) => c.openCount === 0 && c.topPrio !== null).map((c) => c.slug).join(", ") || "none");
  ok("nextDue is the earliest due among open tasks",
     withOpen.every((c) => {
       const dues = c.lanes.filter((l) => l.key !== "done")
         .flatMap((l) => l.tasks.map((t) => t.due)).filter(Boolean).sort();
       return (dues[0] || null) === c.nextDue;
     }));
  ok("oldestCreated is the earliest created among open tasks",
     withOpen.every((c) => {
       const made = c.lanes.filter((l) => l.key !== "done")
         .flatMap((l) => l.tasks.map((t) => t.created)).filter(Boolean).sort();
       return (made[0] || null) === c.oldestCreated;
     }));
  // Done tasks must not influence position: a column's place reflects
  // outstanding work, not what was finished last week.
  ok("a done-only column carries no sort keys",
     projectCols.filter((c) => c.openCount === 0)
       .every((c) => c.nextDue === null && c.oldestCreated === null && c.topPrio === null));
}

if (wiki.projectDepth === 2) {
  console.log("\nTwo-level discovery");
  const slugs = new Set(projects.map((p) => p.slug));
  const kinds = new Map(projects.map((p) => [p.slug, p.kind]));

  // The three page shapes a depth-2 wiki allows, one named example each.
  ok("flat project page becomes a column", slugs.has("docs-refresh"));
  ok("folder project becomes a column", slugs.has("website-redesign"));
  ok("category landing becomes a column", slugs.has("build"));
  // A status outside the four lifecycle states still earns a column when the
  // wiki lists it. Drop it from columnStatuses and this project's tasks leave
  // the board without a word, which is why it is asserted by name.
  ok("planning project is column-eligible",
     projectCols.some((c) => c.slug === "api-migration"),
     projects.find((p) => p.slug === "api-migration")?.status || "missing");
  // Dormant is the demo's parked state, so it is opt-out rather than absent:
  // a column by default, and gone when the setting is off. Both halves are
  // asserted, because a toggle that only ever reads one way is not a toggle.
  ok("parked project earns a column by default",
     projectCols.some((c) => c.slug === "legacy-export"),
     projects.find((p) => p.slug === "legacy-export")?.status || "missing");
  {
    const noParked = board.resolveSettings({ board_show_parked: false }, wiki);
    const off = board.buildColumns(tasks, projects, TODAY, noParked, wiki, "");
    ok("parked project loses its column with show_parked off",
       !off.some((c) => c.slug === "legacy-export"),
       off.filter((c) => !c.unassigned).map((c) => c.slug).join(", "));
  }

  eq("category landing is marked category", kinds.get("build"), "category");
  eq("flat project is marked project", kinds.get("docs-refresh"), "project");
  eq("folder project is marked project", kinds.get("website-redesign"), "project");

  ok("every column names a real landing page",
     projectCols.every((c) => c.path && c.path.endsWith(".md")),
     projectCols.filter((c) => !c.path).map((c) => c.slug).join(", ") || "all have one");
  ok("no landing page is claimed by two columns",
     new Set(projectCols.map((c) => c.path)).size === projectCols.length,
     `${new Set(projectCols.map((c) => c.path)).size} paths for ${projectCols.length} columns`);
  // A category landing is not a project page, so a lifecycle status must never
  // be written to it. The renderer gates the menu on this field.
  ok("both kinds are present", new Set(projectCols.map((c) => c.kind)).size === 2,
     [...new Set(projectCols.map((c) => c.kind))].join(", "));

  ok("the fenced example in Task syntax reaches no column",
     !tasks.some((t) => t.path.endsWith("Task syntax.md")),
     tasks.filter((t) => t.path.endsWith("Task syntax.md")).length + " found");
  // A task whose leading run names no known project belongs in triage. This was
  // pinned to Inbox.md's four unlinked tasks until they moved to
  // office-move on 2026-08-18, leaving that file with no task lines and
  // the assertion failing on a vault edit rather than a routing change. Stated
  // as the invariant it was standing in for, so it cannot go stale on one file.
  const knownSlugs = new Set(projects.map((p) => p.slug));
  const triage = byCol.get("Unassigned");
  const inTriage = new Set(triage.lanes.flatMap((l) => l.tasks).map((t) => t.raw));
  const orphans = tasks.filter(
    (t) => (t.status === " " || t.status === "/") && board.routeProjects(t, knownSlugs).length === 0
  );
  ok("every task naming no known project reaches triage",
     orphans.every((t) => inTriage.has(t.raw)),
     `${orphans.length} name no project, ${inTriage.size} in triage`);
}

console.log("\nAdd task, against the live vault");
{
  const targets = columns.filter((c) => !c.hidden).map((c) => [c, board.addTaskTarget(wiki, c, TODAY)]);
  ok("every visible column resolves a target",
     targets.every(([, t]) => t !== null),
     targets.filter(([, t]) => !t).map(([c]) => c.slug).join(", ") || "all resolved");

  // The heading the target names has to exist in the file, or the insert falls
  // through to an anchor nobody chose. Case 2 and case 3 are deliberate
  // fallbacks, so this reports rather than fails, and names what it found.
  const missing = [];
  for (const [, t] of targets) {
    if (!t || t.template) continue; // journal note may legitimately not exist yet
    const abs = path.join(VAULT, t.path);
    if (!fs.existsSync(abs)) { missing.push(`${t.path}: no file`); continue; }
    const body = fs.readFileSync(abs, "utf8");
    const has = body.split(/\r?\n/).some((l) => l.trim().toLowerCase() === t.heading.toLowerCase());
    if (!has) missing.push(`${t.path}: no "${t.heading}"`);
  }
  // Not an assertion: cases 2 and 3 are deliberate fallbacks, so a target
  // without the named heading is legal. Reported so a new one is visible.
  console.log(`  [note] ${"heading anchor".padEnd(46)} ` +
              (missing.length ? `fallback used for ${missing.join("; ")}` : "every target has its heading"));

  // Insertion is exercised against each real target file as a string. It never
  // writes: the result is only inspected.
  const line = `- [ ] [[probe]] harness probe \u2795 ${TODAY}`;
  let inserted = 0;
  for (const [, t] of targets) {
    if (!t) continue;
    const abs = path.join(VAULT, t.path);
    if (!fs.existsSync(abs)) continue;
    const before = fs.readFileSync(abs, "utf8");
    const after = board.insertTaskLine(before, t.heading, line);
    if (!after.ok) { ok(`insert into ${t.path}`, false, after.reason); continue; }
    const grew = after.content.split(/\r?\n/).length === before.split(/\r?\n/).length + 1 ||
                 after.content.split(/\r?\n/).length === before.split(/\r?\n/).length + 3;
    if (!grew || !after.content.includes(line)) {
      ok(`insert into ${t.path}`, false, "line not present or file grew unexpectedly");
      continue;
    }
    // The inserted line must parse back out as a task the board can route.
    const parsed = board.extractTasks(after.content, t.path).find((x) => x.raw === line);
    if (!parsed || parsed.created !== TODAY) {
      ok(`insert into ${t.path}`, false, "inserted line does not parse back");
      continue;
    }
    inserted++;
  }
  ok("inserted line parses back on every target", inserted === targets.filter(([, t]) =>
     t && fs.existsSync(path.join(VAULT, t.path))).length, `${inserted} files`);
}

console.log("\nWrite-back");
{
  const raw = "- [ ] [[website-redesign]] ship the new navigation \u2795 2026-08-02";
  const content = `# note\n\n${raw}\n\nmore text\n`;
  const task = board.extractTasks(content, "demo/Journal/entry.md")[0];

  const good = board.applyCompletion(content, task, TODAY);
  ok("clean toggle succeeds", good.ok);
  ok(
    "line marked done with Tasks-format date",
    good.content.split("\n")[2] === `- [x] [[website-redesign]] ship the new navigation \u2795 2026-08-02 \u2705 ${TODAY}`,
    good.content.split("\n")[2]
  );
  ok("rest of file untouched", good.content.split("\n")[4] === "more text");

  const stale = board.applyCompletion(content.replace(raw, "- [ ] something else"), task, TODAY);
  ok("stale line aborts without writing", !stale.ok && stale.reason === "stale");

  const already = "- [x] done thing \u2705 2026-08-01";
  eq("already-done line gains no second date", board.completeLine(already, TODAY), already);

  const crlf = `# note\r\n\r\n${raw}\r\n`;
  const crlfTask = board.extractTasks(crlf, "demo/Journal/entry.md")[0];
  const crlfOut = board.applyCompletion(crlf, crlfTask, TODAY);
  ok("CRLF file parses", crlfOut.ok);
  ok("CRLF terminators preserved", crlfOut.content.includes("\r\n") && !/[^\r]\n/.test(crlfOut.content));
}

console.log("\nWrite-back against a temp file");
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wkb-board-"));
  const file = path.join(dir, "journal.md");
  const raw = "- [ ] [[office-move]] measure the desks \u2795 2026-08-04";
  fs.writeFileSync(file, `# 2026-08-04\n\n${raw}\n`, "utf8");

  const before = fs.readFileSync(file, "utf8");
  const task = board.extractTasks(before, "demo/Journal/2026-01-07.md")[0];
  const result = board.applyCompletion(before, task, TODAY);
  fs.writeFileSync(file, result.content, "utf8");

  const after = fs.readFileSync(file, "utf8");
  ok("temp file now marked done", after.includes(`- [x] [[office-move]] measure the desks \u2795 2026-08-04 \u2705 ${TODAY}`));
  ok("temp file kept its heading", after.startsWith("# 2026-08-04"));
  fs.rmSync(dir, { recursive: true, force: true });
}

} /* end run(wiki) */

// Wiki-independent: what a WIKIS entry must look like, and how a note resolves
// to one. A published component has no fixed table, so the contract is the shape
// of an entry rather than any particular wiki's folder names.
console.log("\nWiki entry contract");
{
  const REQUIRED = ["slug", "root", "projectsFolder", "settingDefaults"];
  for (const [key, wiki] of Object.entries(board.WIKIS)) {
    const missing = REQUIRED.filter((f) => wiki[f] === undefined);
    ok(`${key} declares every required field`, missing.length === 0, missing.join(", ") || "all present");
    eq(`${key} key matches its own slug`, wiki.slug, key);
    ok(`${key} declares a scope to search`,
       Array.isArray(wiki.settingDefaults.include_folders) &&
       wiki.settingDefaults.include_folders.length > 0);
    ok(`${key} projectsFolder sits inside its root`,
       wiki.projectsFolder.startsWith(wiki.root + "/") || wiki.projectsFolder === wiki.root,
       wiki.projectsFolder);
    ok(`${key} projectDepth is 1 or 2`, [undefined, 1, 2].includes(wiki.projectDepth),
       String(wiki.projectDepth));
    // A status a project actually uses but the wiki does not list silently
    // removes that project's tasks from the board, which is the worst failure
    // this component has. The list must at least be non-empty.
    ok(`${key} names at least one column-eligible status`,
       Array.isArray(wiki.columnStatuses) && wiki.columnStatuses.length > 0,
       (wiki.columnStatuses || []).join(", "));
    ok(`${key} peopleFolder is a path or explicitly null`,
       wiki.peopleFolder === null || typeof wiki.peopleFolder === "string",
       String(wiki.peopleFolder));
  }

  eq("explicit board_wiki wins", board.resolveWiki({ board_wiki: "demo" }, "anywhere.md").slug, "demo");
  eq("path infers the wiki from its root", board.resolveWiki({}, "demo/Board.md").slug, "demo");
  eq("a nested note still infers it",
     board.resolveWiki({}, "demo/Projects/build/build.md").slug, "demo");
  eq("unknown slug does not resolve", board.resolveWiki({ board_wiki: "zzz" }, "nowhere/x.md"), null);
  eq("unknown path does not resolve", board.resolveWiki({}, "elsewhere/x.md"), null);
  // A folder that merely starts with the root's name is a different folder.
  eq("a prefix match is not a path match", board.resolveWiki({}, "demo-archive/x.md"), null);
}

console.log("\nScope resolution");
{
  const w = board.WIKIS.demo;
  const s = board.resolveSettings(null, w);
  eq("include comes from the wiki default", s.include_folders, w.settingDefaults.include_folders);
  eq("exclude comes from the wiki default", s.exclude_folders, w.settingDefaults.exclude_folders);
  ok("a project page is in scope", board.inScope("demo/Projects/build/docs-refresh.md", s));
  ok("an excluded folder is out of scope", !board.inScope("demo/Archive/reading-list.md", s));
  ok("another wiki's tree is out of scope", !board.inScope("elsewhere/note.md", s));
  ok("a non-markdown file is out of scope", !board.inScope("demo/Projects/build/diagram.png", s));

  // Clearing the field means "I cleared it", never "scan my whole vault", so it
  // falls back to this wiki's own default rather than to no filter at all.
  eq("a cleared include falls back to the wiki default",
     board.resolveSettings({ board_include_folders: [] }, w).include_folders,
     w.settingDefaults.include_folders);
  // Emptying the exclude list is a legitimate choice, so unlike include it is
  // honoured as given rather than falling back. The asymmetry is deliberate: an
  // empty include would mean "search nothing", an empty exclude means "exclude
  // nothing", and only one of those is ever what someone meant.
  eq("a cleared exclude is honoured as empty",
     board.resolveSettings({ board_exclude_folders: [] }, w).exclude_folders, []);
}


/*
 * A journal-filing wiki, declared here rather than taken from WIKIS.
 *
 * The demo wiki files tasks into project pages, which is one of the two modes
 * newTask supports. Testing the other against whatever happens to be in the
 * table would make the coverage depend on a user's configuration, so the second
 * mode is a fixture.
 */
const JOURNAL_WIKI = {
  slug: "journal-demo",
  label: "Journal demo",
  root: "demo",
  projectsFolder: "demo/Projects",
  projectDepth: 2,
  peopleFolder: "demo/People",
  columnStatuses: ["active"],
  newTask: {
    heading: "# New tasks",
    journalFolder: "demo/Journal",
    journalTemplate: "demo/Journal/_template.md",
  },
  settingDefaults: { include_folders: ["demo"], exclude_folders: ["demo/Archive"] },
};

console.log("\nProject flags");
{
  // Only a real yes is a yes. Everything else, including an unreadable value,
  // reads as off, so a consumer that fails closed on the field keeps doing so.
  const yes = [true, "true", "True", " true "];
  const no = [false, "false", undefined, null, "", "yes", "1", 1, {}, []];
  ok("a yes is read as on", yes.every((v) => board.flagValue(v) === true),
     yes.filter((v) => board.flagValue(v) !== true).map((v) => JSON.stringify(v)).join(", ") || "all read on");
  ok("everything else is read as off", no.every((v) => board.flagValue(v) === false),
     no.filter((v) => board.flagValue(v) !== false).map((v) => JSON.stringify(v)).join(", ") || "all read off");

  // Flags are declared on the board note, under the same board_ prefix as
  // every display setting, so resolveFlags reads a note's frontmatter.
  eq("the declaration key is a board_ key", board.FLAG_KEY, board.SETTING_PREFIX + "flags");
  const declare = (...entries) => board.resolveFlags({ [board.FLAG_KEY]: entries });

  const good = { field: "publish", label: "Publish", glyph: "P" };
  const one = declare(good);
  eq("a valid flag passes through", one.flags.length, 1);
  eq("no problems to report", one.problems.length, 0);
  ok("the hints default to null rather than undefined",
     one.flags[0].onHint === null && one.flags[0].offHint === null, JSON.stringify(one.flags[0]));
  // Named on_hint and off_hint, not on and off: YAML 1.1 reads a bare `on:` or
  // `off:` key as a boolean, which would silently lose the sentence.
  const hinted = declare({ ...good, on_hint: "Yes.", off_hint: "No." });
  ok("the hints are read from on_hint and off_hint",
     hinted.flags[0].onHint === "Yes." && hinted.flags[0].offHint === "No.",
     JSON.stringify(hinted.flags[0]));

  eq("a note declaring nothing has no flags", board.resolveFlags({}).flags.length, 0);
  eq("and no problems either", board.resolveFlags({}).problems.length, 0);
  eq("no frontmatter at all is not an error", board.resolveFlags(null).problems.length, 0);
  // A scalar where a list belongs is the likeliest hand-editing mistake.
  eq("a non-list declaration is one problem, not a crash",
     board.resolveFlags({ [board.FLAG_KEY]: "publish" }).problems.length, 1);

  // Reset to defaults deletes every SETTINGS key. Flags are a declaration, not
  // a display preference, so they must not be a member of that list.
  ok("flags are not a SETTINGS spec, so a reset cannot delete them",
     !board.SETTINGS.some((spec) => board.SETTING_PREFIX + spec.key === board.FLAG_KEY),
     board.SETTINGS.map((spec) => spec.key).join(", "));

  // Each of these drops the entry and says why. A pill that silently never
  // renders is indistinguishable from a board that declared no flags.
  const bad = [
    ["no field", { label: "X", glyph: "X" }],
    ["no label", { field: "x", glyph: "X" }],
    ["no glyph", { field: "x", label: "X" }],
    ["a glyph too long to fit", { field: "x", label: "X", glyph: "PUB" }],
    ["the status field", { field: "status", label: "X", glyph: "X" }],
    ["the last_activity field", { field: "last_activity", label: "X", glyph: "X" }],
    ["a board_ setting key", { field: "board_compact", label: "X", glyph: "X" }],
  ];
  const accepted = bad.filter(([, entry]) => declare(entry).flags.length !== 0);
  ok("every invalid flag is dropped", accepted.length === 0,
     accepted.map(([name]) => name).join(", ") || `all ${bad.length} dropped`);
  const silent = bad.filter(([, entry]) => declare(entry).problems.length !== 1);
  ok("every dropped flag reports one problem", silent.length === 0,
     silent.map(([name]) => name).join(", ") || `all ${bad.length} explained`);

  // An entirely empty entry is the row the Add button just created. It is
  // neither a flag nor a problem until something is typed into it.
  const blank = declare(board.flagEntry(null));
  eq("an empty entry is not a flag", blank.flags.length, 0);
  eq("nor a problem", blank.problems.length, 0);
  eq("but the editor still sees it", blank.declared.length, 1);

  // Two pills writing one field, or wearing one glyph, is a config error and
  // not a rendering one: the second is dropped rather than drawn.
  eq("a duplicate field is dropped", declare(good, { ...good, glyph: "B" }).flags.length, 1);
  eq("a duplicate glyph is dropped", declare(good, { ...good, field: "other" }).flags.length, 1);

  // The guard that matters day to day: what the board notes declare is valid,
  // so no board is quietly running without a pill it thinks it has.
  const broken = [];
  for (const [slug, notePath] of Object.entries(BOARD_NOTES)) {
    const problems = board.resolveFlags(boardFrontmatter(notePath)).problems;
    if (problems.length) broken.push(`${slug}: ${problems.join("; ")}`);
  }
  ok("every board note's own flags are valid", broken.length === 0,
     broken.join(" | ") || Object.keys(BOARD_NOTES).join(", "));
  // And the guard is not vacuous: a typo in the key, or a declaration deleted
  // by hand, would otherwise pass as "no problems" on every board.
  const declaring = Object.entries(BOARD_NOTES)
    .filter(([, notePath]) => board.resolveFlags(boardFrontmatter(notePath)).flags.length > 0);
  ok("at least one board note declares a flag", declaring.length > 0,
     declaring.map(([slug]) => slug).join(", ") || `no ${board.FLAG_KEY} found in any board note`);
}

console.log("\nStatus set");
{
  const T = "2026-08-05";
  // The guard that matters: the menu may only offer statuses the parser can
  // read back. A status TASK_RE cannot match would be written to the file and
  // the task would then vanish from the board entirely.
  const unparseable = board.STATUSES.filter(
    (st) => board.extractTasks(`- [${st.symbol}] [[x]] thing\n`, "n.md").length !== 1
  );
  ok("every offered status parses back", unparseable.length === 0,
     unparseable.map((st) => JSON.stringify(st.symbol)).join(", ") || "all four parse");
  eq("the four statuses are the documented set",
     board.STATUSES.map((st) => st.symbol), [" ", "/", "x", "-"]);
  ok("every status carries a name", board.STATUSES.every((st) => !!st.name),
     board.STATUSES.map((st) => st.name).join(", "));

  // The menu must offer the status a project can actually hold. A wiki that
  // earns columns with a status of its own gets it appended: without that, a
  // project in that status has a menu marking nothing, and the only way out of
  // a legitimate status is to pick one of the four canonical ones.
  for (const w of Object.values(board.WIKIS)) {
    const offered = board.menuStatuses(w);
    const missing = w.columnStatuses.filter((st) => !offered.includes(st));
    ok(`${w.slug}: every column-eligible status is offered`, missing.length === 0,
       missing.join(", ") || offered.join(", "));
  }
  eq("the four canonical states come first",
     board.menuStatuses({ columnStatuses: ["planning"] }).slice(0, 4),
     board.SHARED.projectStatuses);
  eq("and an extra is appended once",
     board.menuStatuses({ columnStatuses: ["active", "planning", "planning"] }),
     [...board.SHARED.projectStatuses, "planning"]);
  eq("a wiki with no extras offers exactly the canonical set",
     board.menuStatuses({ columnStatuses: ["active"] }), board.SHARED.projectStatuses);

  // Round trip: what the menu writes is what the board reads.
  const roundTrips = board.STATUSES.filter((st) => {
    const line = board.setStatusLine("- [ ] [[x]] thing \u2795 2026-08-01", st.symbol, T);
    const back = board.extractTasks(`# n\n\n${line}\n`, "n.md")[0];
    return !back || back.status !== st.symbol;
  });
  ok("every status survives a write and a re-read", roundTrips.length === 0,
     roundTrips.map((st) => st.name).join(", ") || "all four round trip");
}

console.log("\nStatus line rewriting");
{
  const T = "2026-08-05";
  const open = "- [ ] [[x]] thing \u2795 2026-08-01";

  eq("open to done stamps a done date",
     board.setStatusLine(open, "x", T), `- [x] [[x]] thing \u2795 2026-08-01 \u2705 ${T}`);
  eq("open to cancelled stamps a cancelled date",
     board.setStatusLine(open, "-", T), `- [-] [[x]] thing \u2795 2026-08-01 \u274C ${T}`);
  eq("open to in progress stamps nothing",
     board.setStatusLine(open, "/", T), "- [/] [[x]] thing \u2795 2026-08-01");
  eq("created date is never touched",
     board.setStatusLine(open, "/", T).includes("\u2795 2026-08-01"), true);

  // The invariant: the done date belongs to done and the cancelled date to
  // cancelled. Reopening must not leave a line claiming to be both.
  const done = `- [x] [[x]] thing \u2795 2026-08-01 \u2705 2026-08-02`;
  eq("done to open drops the done date",
     board.setStatusLine(done, " ", T), "- [ ] [[x]] thing \u2795 2026-08-01");
  eq("done to in progress drops the done date",
     board.setStatusLine(done, "/", T), "- [/] [[x]] thing \u2795 2026-08-01");
  eq("done to cancelled swaps the date, not adds one",
     board.setStatusLine(done, "-", T), `- [-] [[x]] thing \u2795 2026-08-01 \u274C ${T}`);
  const cancelled = `- [-] [[x]] thing \u274C 2026-08-02`;
  eq("cancelled to open drops the cancelled date",
     board.setStatusLine(cancelled, " ", T), "- [ ] [[x]] thing");
  eq("cancelled to done swaps the date",
     board.setStatusLine(cancelled, "x", T), `- [x] [[x]] thing \u2705 ${T}`);

  // Setting the status a line already has must not stamp a second date.
  eq("done stays done with one date",
     board.setStatusLine(done, "x", T), done);
  eq("cancelled stays cancelled with one date",
     board.setStatusLine(cancelled, "-", T), cancelled);
  ok("no line ever carries two terminal dates",
     board.STATUSES.every((st) => {
       const line = board.setStatusLine(done, st.symbol, T);
       return (line.match(/\u2705/g) || []).length <= 1 && (line.match(/\u274C/g) || []).length <= 1;
     }));
  ok("no line ever carries both terminal dates",
     board.STATUSES.every((st) => {
       const line = board.setStatusLine(done, st.symbol, T);
       return !(line.includes("\u2705") && line.includes("\u274C"));
     }));

  eq("indentation is preserved",
     board.setStatusLine("\t- [ ] nested thing", "x", T), `\t- [x] nested thing \u2705 ${T}`);
  eq("a line that is not a task is returned untouched",
     board.setStatusLine("just prose", "x", T), "just prose");
  // completeLine is the checkbox path and must keep behaving as it did.
  eq("completeLine still routes through the same rule",
     board.completeLine(open, T), board.setStatusLine(open, "x", T));
}

console.log("\nStatus write-back");
{
  const T = "2026-08-05";
  const raw = "- [ ] [[website-redesign]] ship the new navigation \u2795 2026-08-02";
  const content = `# note\n\n${raw}\n\nmore text\n`;
  const task = board.extractTasks(content, "demo/Journal/entry.md")[0];

  const cancelled = board.applyStatus(content, task, "-", T);
  ok("cancelling succeeds", cancelled.ok);
  eq("the line is cancelled with a date",
     cancelled.content.split("\n")[2],
     `- [-] [[website-redesign]] ship the new navigation \u2795 2026-08-02 \u274C ${T}`);
  eq("the rest of the file is untouched", cancelled.content.split("\n")[4], "more text");

  const stale = board.applyStatus(
    content.replace(raw, "- [ ] something else"), task, "-", T);
  eq("a stale line aborts without writing", [stale.ok, stale.reason], [false, "stale"]);

  // A recurring task's next occurrence is the plugin's job. Rewriting the line
  // here would complete it and silently lose the recurrence.
  const rec = "- [ ] [[x]] water the plants \u{1F501} every week \u2795 2026-08-01";
  const recTask = board.extractTasks(`# n\n\n${rec}\n`, "n.md")[0];
  const refused = board.applyStatus(`# n\n\n${rec}\n`, recTask, "x", T);
  eq("a recurring task is refused, not silently completed",
     [refused.ok, refused.reason], [false, "recurring"]);
  ok("the refusal leaves no content to write", refused.content === undefined);

  const crlf = `# note\r\n\r\n${raw}\r\n`;
  const crlfTask = board.extractTasks(crlf, "demo/Journal/entry.md")[0];
  const crlfOut = board.applyStatus(crlf, crlfTask, "/", T);
  ok("CRLF terminators are preserved",
     crlfOut.ok && crlfOut.content.includes("\r\n") && !/[^\r]\n/.test(crlfOut.content));

  // Cancelled tasks leave the board entirely, so the menu's own consequence is
  // asserted rather than assumed.
  const projects = [{ slug: "website-redesign", status: "active", path: "p.md", kind: "project" }];
  const after = board.extractTasks(cancelled.content, "demo/Journal/entry.md");
  const cols = board.buildColumns(after, projects, T, null, JOURNAL_WIKI);
  eq("a cancelled task reaches no column",
     cols.reduce((n, c) => n + c.openCount, 0), 0);
}

console.log("\nAdd task, target resolution");
{
  const stCol = { slug: "website-redesign", path: "demo/Projects/build/website-redesign/website-redesign.md", kind: "project" };
  const stTri = { slug: "Unassigned", unassigned: true };
  const pCol = { slug: "website-redesign", path: "demo/Projects/build/website-redesign/website-redesign.md", kind: "project" };
  const pCat = { slug: "build", path: "demo/Projects/build/build.md", kind: "category" };
  const pTri = { slug: "Unassigned", unassigned: true };

  const st = board.addTaskTarget(JOURNAL_WIKI, stCol, "2026-08-05");
  eq("a journal wiki writes to the journal, not the project", st.path, "demo/Journal/2026-08-05.md");
  eq("a journal wiki heading is the new-tasks section", st.heading, "# New tasks");
  eq("a journal wiki still seeds the column slug", st.slug, "website-redesign");
  ok("a journal wiki can create a missing journal", !!st.template, st.template);

  eq("journal triage seeds no slug", board.addTaskTarget(JOURNAL_WIKI, stTri, "2026-08-05").slug, null);
  eq("journal triage still writes to the journal",
     board.addTaskTarget(JOURNAL_WIKI, stTri, "2026-08-05").path, "demo/Journal/2026-08-05.md");

  const p = board.addTaskTarget(board.WIKIS.demo, pCol, "2026-08-05");
  eq("a project wiki writes into the project itself", p.path, pCol.path);
  eq("a project wiki heading is the tasks section", p.heading, "## Tasks");
  eq("a project wiki seeds the project slug", p.slug, "website-redesign");
  eq("a project wiki never creates a file from a template", p.template, null);

  eq("a category column writes to its landing", board.addTaskTarget(board.WIKIS.demo, pCat, "2026-08-05").path, pCat.path);

  const tri = board.addTaskTarget(board.WIKIS.demo, pTri, "2026-08-05");
  eq("project triage falls back to other", tri.path, "demo/Projects/general/general.md");
  eq("project triage seeds the other slug", tri.slug, "general");

  eq("a column with no note resolves nothing",
     board.addTaskTarget(board.WIKIS.demo, { slug: "ghost", path: null }, "2026-08-05"), null);
  eq("a wiki with no newTask block resolves nothing",
     board.addTaskTarget({ slug: "x" }, pCol, "2026-08-05"), null);

  eq("seed carries the slug in the leading run", board.seedTaskLine("office-move"), "- [ ] [[office-move]] ");
  eq("seed without a slug is a bare task", board.seedTaskLine(null), "- [ ] ");
  // The seed has to route: leadingTags is what buildColumns reads.
  eq("seeded slug is read as the leading tag",
     board.leadingTags("[[office-move]] "), ["office-move"]);
}

console.log("\nAdd task, created-date stamp");
{
  const T = "2026-08-05";
  eq("bare line gets a created date",
     board.stampCreated("- [ ] [[website-redesign]] ship the new navigation", T),
     "- [ ] [[website-redesign]] ship the new navigation \u2795 2026-08-05");
  eq("stamp lands before the due date, as the plugin emits it",
     board.stampCreated("- [ ] [[website-redesign]] ship the new navigation \u{1F4C5} 2026-08-09", T),
     "- [ ] [[website-redesign]] ship the new navigation \u2795 2026-08-05 \u{1F4C5} 2026-08-09");
  eq("a date set in the modal wins",
     board.stampCreated("- [ ] thing \u2795 2026-01-01", T),
     "- [ ] thing \u2795 2026-01-01");
  eq("priority is not disturbed",
     board.stampCreated("- [ ] \u23EB urgent thing", T),
     "- [ ] \u23EB urgent thing \u2795 2026-08-05");
  // Round trip: what is stamped must parse back with that created date.
  const stamped = board.stampCreated("- [ ] [[x]] thing \u{1F4C5} 2026-08-09", T);
  const back = board.extractTasks(`# n\n\n${stamped}\n`, "n.md")[0];
  eq("stamped line parses back", [back.created, back.due], [T, "2026-08-09"]);
}

console.log("\nAdd task, insertion");
{
  const line = "- [ ] [[x]] new thing \u2795 2026-08-05";
  const L = (c) => c.split("\n");

  // Case 1: the named heading, empty section.
  const empty = "---\nk: v\n---\n# New tasks\n\n\n# Brain-storage\ntext\n";
  const a = board.insertTaskLine(empty, "# New tasks", line);
  ok("empty section accepts the line", a.ok);
  eq("line sits directly under the heading", L(a.content)[4], line);
  eq("the next heading is untouched", L(a.content).filter((l) => l === "# Brain-storage").length, 1);

  // Case 1: the named heading, tasks already there. Newest goes last.
  const filled = "# New tasks\n- [ ] one\n- [ ] two\n\n# Later\n- [ ] elsewhere\n";
  const b = board.insertTaskLine(filled, "# New tasks", line);
  eq("line goes after the last task in the section", L(b.content)[3], line);
  eq("a task in the next section is not the anchor", L(b.content)[6], "- [ ] elsewhere");

  // A deeper heading does not close the section; a same-or-shallower one does.
  const nested = "## Tasks\n- [ ] one\n### Sub\n- [ ] two\n## Other\n- [ ] three\n";
  eq("a deeper heading does not close the section",
     L(board.insertTaskLine(nested, "## Tasks", line).content)[4], line);

  // Case 1: a fenced checkbox is never the anchor.
  const fenced = "## Tasks\n- [ ] real\n\n```tasks\n- [ ] not real\n```\n";
  const c = board.insertTaskLine(fenced, "## Tasks", line);
  eq("the fenced checkbox is not the anchor", L(c.content)[2], line);
  ok("the fence is intact", c.content.includes("```tasks\n- [ ] not real\n```"));

  // Case 2: no such heading, but the file has tasks. a page keeping tasks under another heading's shape.
  const noHeading = "# p\n\n## Projects\n- [ ] one\n- [x] two\n\n## Open tasks (all p)\n```tasks\nnot done\n```\n";
  const d = board.insertTaskLine(noHeading, "## Tasks", line);
  eq("line joins the existing tasks", L(d.content)[5], line);
  ok("no second Tasks section is opened", !d.content.includes("\n## Tasks"));

  // Case 3: no heading and no tasks. A section is opened above the query.
  const onlyQuery = "# p\n\nprose\n\n## Open tasks (all p)\n```tasks\nnot done\n```\n";
  const e = board.insertTaskLine(onlyQuery, "## Tasks", line);
  eq("a Tasks section is opened", L(e.content)[4], "## Tasks");
  eq("the line goes into it", L(e.content)[5], line);
  ok("it sits above the query heading", e.content.indexOf("## Tasks") < e.content.indexOf("## Open tasks"));

  // Case 3, nothing to anchor on at all.
  const bare = "# p\n\nprose\n";
  const f = board.insertTaskLine(bare, "## Tasks", line);
  eq("a section is appended to the body, after a blank line",
     L(f.content).slice(-4, -1), ["", "## Tasks", line]);
  ok("the file keeps its trailing newline", f.content.endsWith("\n"));

  // Adding a second task now finds the section the first one opened, so the
  // note gains exactly one line, one heading, and no extra blanks.
  const f2 = board.insertTaskLine(f.content, "## Tasks", "- [ ] [[x]] later thing \u2795 2026-08-06");
  eq("a second add lands under the section the first opened",
     L(f2.content).length, L(f.content).length + 1);
  eq("only one Tasks heading exists", L(f2.content).filter((l) => l === "## Tasks").length, 1);
  eq("blank lines do not pile up",
     L(f2.content).filter((l) => l === "").length, L(f.content).filter((l) => l === "").length);

  // Line endings, per applyCompletion's rule: one line changes, not all of them.
  const crlf = "# New tasks\r\n- [ ] one\r\n";
  const g = board.insertTaskLine(crlf, "# New tasks", line);
  ok("CRLF terminators preserved", g.content.includes("\r\n") && !/[^\r]\n/.test(g.content));

  // A recurring task hands back more than one line.
  const two = `${line}\n- [ ] [[x]] new thing \u{1F501} every week \u2795 2026-08-12`;
  const h = board.insertTaskLine("## Tasks\n- [ ] one\n", "## Tasks", two);
  eq("both lines land, in order", L(h.content).slice(2, 4), two.split("\n"));

  // Junk never reaches the file.
  eq("empty input is refused", board.insertTaskLine("## Tasks\n", "## Tasks", "  ").reason, "empty");
  eq("a non-task line is refused",
     board.insertTaskLine("## Tasks\n", "## Tasks", "just some prose").reason, "not a task line");
  eq("a partly-valid batch is refused whole",
     board.insertTaskLine("## Tasks\n", "## Tasks", `${line}\nprose`).reason, "not a task line");
}

console.log("\nAdd task, journal template");
{
  const tpl = fs.readFileSync(path.join(VAULT, "demo/Journal/_template.md"), "utf8");
  const out = board.resolveTemplateDates(tpl, "2026-08-05");
  ok("no placeholder survives the real template", !/\{\{date/.test(out),
     (out.match(/\{\{[^}]*\}\}/g) || []).join(" ") || "none left");
  ok("today's date is written in", out.includes("done on 2026-08-05"));
  ok("the plus-7-days window is written in", out.includes("due before 2026-08-12"));
  ok("the plus-1-day window is written in", out.includes("created before 2026-08-06"));
  ok("the new-tasks heading survives", out.includes("# New tasks"));
  ok("the template's own queries survive", out.split("```tasks").length === tpl.split("```tasks").length);

  eq("bare placeholder defaults to ISO", board.resolveTemplateDates("{{date}}", "2026-08-05"), "2026-08-05");
  eq("a shift unit of weeks resolves", board.resolveTemplateDates("{{date+1w:YYYY-MM-DD}}", "2026-08-05"), "2026-08-12");
  eq("a negative shift resolves", board.resolveTemplateDates("{{date-1d:YYYY-MM-DD}}", "2026-08-05"), "2026-08-04");
  eq("a month shift crosses the year", board.resolveTemplateDates("{{date+5m:YYYY-MM-DD}}", "2026-08-05"), "2027-01-05");
  // Left verbatim rather than blanked: a half-resolved query silently matches
  // more than it should, a visible placeholder does not.
  eq("an unimplemented token is left alone",
     board.resolveTemplateDates("{{date:dddd}}", "2026-08-05"), "{{date:dddd}}");
  eq("an unparseable shift is left alone",
     board.resolveTemplateDates("{{date+zz:YYYY-MM-DD}}", "2026-08-05"), "{{date+zz:YYYY-MM-DD}}");
  eq("a non-date placeholder is untouched",
     board.resolveTemplateDates("{{title}}", "2026-08-05"), "{{title}}");
  eq("month end does not roll over", board.shiftISO("2026-08-31", "+1d"), "2026-09-01");
}

for (const key of WIKI_KEYS) run(board.WIKIS[key]);

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.log(`${failures} FAILED\n`);
  process.exit(1);
}
console.log("all green\n");
