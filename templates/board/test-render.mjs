/*
 * Render smoke test for the project board.
 *
 * Run from this folder:  node test-render.mjs
 *
 * test-board.mjs covers the pure logic. This file covers the other half: that
 * render() actually runs end to end without throwing, against the real vault,
 * and produces the expected DOM shape.
 *
 * It stubs just enough of the DOM and of Obsidian's `app` to execute the real
 * render path. It cannot validate CSS, layout, scroll-snap or touch, which are
 * the manual iOS checklist in DESIGN.md.
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
// The harness runs against ./demo, the invented wiki shipped beside it.
const VAULT = here;
const board = createRequire(import.meta.url)("./view.js");

// node test-render.mjs [--wiki st|p|both] [--html <file>]   default: both
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

// The board note per wiki. Keyed by slug, so a second wiki added to WIKIS needs
// one line here and nothing else.
const DASHBOARDS = {
  demo: "demo/Board.md",
};

/*
 * The real current date, not a fixed one.
 *
 * This harness compares a model it builds itself against a live render, and
 * render() dates the Done-lane window with the actual today. A hardcoded date
 * silently disagreed with it: a task completed today is inside the view's
 * 7-day window but reads as a future completion to a model dated two days
 * earlier, which drops it and flips that column to the empty state. The counts
 * then differ by one for a reason that has nothing to do with the render path.
 *
 * test-board.mjs keeps its fixed date, correctly: it builds both sides of every
 * comparison, so a stable date there makes the assertions reproducible.
 */
const TODAY = (() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

let failures = 0;
let checks = 0;
function ok(label, condition, detail = "") {
  checks++;
  if (!condition) failures++;
  console.log(`  [${condition ? "PASS" : "FAIL"}] ${label.padEnd(46)} ${detail}`);
}

/* ------------------------------------------------------------- DOM shim */

class El {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attrs = {};
    this.listeners = {};
    this._raw = "";
    this.className = "";
    this.disabled = false;
    this.styleProps = {};
    this.style = { setProperty: (k, v) => (this.styleProps[k] = v) };
    this.classList = {
      toggle: (c, on) => {
        const set = new Set(this.className.split(" ").filter(Boolean));
        on ? set.add(c) : set.delete(c);
        this.className = [...set].join(" ");
      },
    };
  }
  // Matches DOM semantics: setting textContent replaces children with a single
  // text node, so a later appendChild adds alongside it rather than being
  // swallowed. The board relies on this when it appends the hidden-count
  // warning to a summary that already has text.
  set textContent(v) {
    this.children = [];
    if (v !== "" && v != null) {
      const t = new El("#text");
      t._raw = String(v);
      this.children.push(t);
    }
  }
  get textContent() {
    return this.tag === "#text" ? this._raw : this.children.map((c) => c.textContent).join("");
  }
  appendChild(c) {
    this.children.push(c);
    return c;
  }
  prepend(c) {
    this.children.unshift(c);
    return c;
  }
  addEventListener(ev, fn) {
    (this.listeners[ev] ||= []).push(fn);
  }
  setAttribute(k, v) {
    this.attrs[k] = v;
  }
  getBoundingClientRect() {
    return { width: 280 };
  }
  empty() {
    this.children = [];
  }
  all() {
    return this.children.flatMap((c) => (c instanceof El ? [c, ...c.all()] : []));
  }
  find(sel) {
    const cls = sel.replace(".", "");
    return this.all().filter((e) => e.className.split(" ").includes(cls));
  }
  querySelector(sel) {
    return this.find(sel)[0] || null;
  }
  querySelectorAll(sel) {
    const list = this.find(sel);
    list.forEach = Array.prototype.forEach.bind(list);
    return list;
  }
  get outerHTML() {
    if (this.tag === "#text") return escapeHtml(this._raw);
    if (this.tag === "style") return `<style>${this.textContent}</style>`;
    const style = Object.entries(this.styleProps).map(([k, v]) => `${k}:${v}`).join(";");
    const attrs = [
      this.className ? ` class="${escapeHtml(this.className)}"` : "",
      style ? ` style="${escapeHtml(style)}"` : "",
      ...Object.entries(this.attrs).map(([k, v]) => ` ${k}="${escapeHtml(String(v))}"`),
      this.disabled ? " disabled" : "",
      this.open ? " open" : "",
      this.type ? ` type="${escapeHtml(this.type)}"` : "",
      this.checked ? " checked" : "",
      // value and selected are set as properties by the board, so they must be
      // serialised explicitly or the preview shows empty inputs and the wrong
      // dropdown item while the real DOM is fine.
      this.value !== undefined ? ` value="${escapeHtml(String(this.value))}"` : "",
      this.selected ? " selected" : "",
      this.min !== undefined ? ` min="${escapeHtml(String(this.min))}"` : "",
      this.max !== undefined ? ` max="${escapeHtml(String(this.max))}"` : "",
    ].join("");
    return `<${this.tag}${attrs}>${this.children.map((c) => c.outerHTML).join("")}</${this.tag}>`;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

globalThis.document = {
  createElement: (tag) => new El(tag),
  createTextNode: (t) => {
    const n = new El("#text");
    // Set _raw directly. Going through the textContent setter would give this
    // text node a child text node and leave its own content empty, which
    // silently blanked every card description in the preview.
    n._raw = String(t);
    return n;
  },
};

/* ------------------------------------------------- Obsidian app + dv stub */

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}
const rel = (abs) => path.relative(VAULT, abs).split(path.sep).join("/");

function buildTree(wiki) {
  const nodes = new Map();
  const ensureFolder = (p) => {
    if (!nodes.has(p)) nodes.set(p, { path: p, name: p.split("/").pop(), children: [] });
    return nodes.get(p);
  };
  ensureFolder(wiki.root);
  // Folders holding no markdown still need nodes so collectProjects can walk
  // them. Seeding _old explicitly keeps archived projects visible to the tree,
  // and the Personal archive is empty today, so it exists only by seeding.
  ensureFolder(wiki.projectsFolder);
  ensureFolder(`${wiki.projectsFolder}/_old`);
  for (const abs of walk(path.join(VAULT, wiki.root))) {
    const p = rel(abs);
    const parts = p.split("/");
    const file = {
      path: p,
      name: parts.at(-1),
      basename: parts.at(-1).replace(/\.md$/, ""),
      extension: "md",
    };
    nodes.set(p, file);
    let acc = parts[0];
    for (let i = 1; i < parts.length - 1; i++) {
      const parent = ensureFolder(acc);
      acc = `${acc}/${parts[i]}`;
      const folder = ensureFolder(acc);
      if (!parent.children.includes(folder)) parent.children.push(folder);
    }
    ensureFolder(acc).children.push(file);
  }
  return nodes;
}

const absOf = (p) => path.join(VAULT, p);

/*
 * One stubbed Obsidian per wiki. Nothing here can reach the vault: `modify`
 * throws by construction and `processFrontMatter` mutates an in-memory object.
 */
function setup(wiki) {
  const tree = buildTree(wiki);
  const DASHBOARD = DASHBOARDS[wiki.slug];
  if (!tree.get(DASHBOARD)) {
    throw new Error(`board note ${DASHBOARD} not found in the ${wiki.slug} tree`);
  }

  // Frontmatter the board reads its settings from. Tests mutate this rather
  // than the real note.
  const state = { settingsFM: {} };
  const fmWrites = [];

  const app = {
    fileManager: {
      processFrontMatter: async (file, fn) => {
        if (file.path !== DASHBOARD) throw new Error(`unexpected write target ${file.path}`);
        fn(state.settingsFM);
        fmWrites.push({ ...state.settingsFM });
      },
    },
    vault: {
      adapter: { read: async (p) => fs.readFileSync(path.join(VAULT, p), "utf8") },
      // Stylesheet discovery walks the file list looking for a view.css beside a
      // view.js, so the shim has to offer both.
      getFiles: () => [{ path: "view.css" }, { path: "view.js" }],
      getAbstractFileByPath: (p) => tree.get(p) || null,
      cachedRead: async (f) => fs.readFileSync(absOf(f.path), "utf8"),
      read: async (f) => fs.readFileSync(absOf(f.path), "utf8"),
      modify: async () => {
        throw new Error("smoke test must not write to the vault");
      },
    },
    metadataCache: {
      getFileCache: (f) => {
        if (f.path === DASHBOARD) return { frontmatter: state.settingsFM };
        const content = fs.readFileSync(absOf(f.path), "utf8");
        const fm = {};
        const block = content.split("---")[1] || "";
        for (const key of ["status", "last_activity", "created"]) {
          const m = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(block);
          if (m) fm[key] = m[1].trim().replace(/^["']|["']$/g, "");
        }
        return { frontmatter: fm };
      },
    },
    workspace: { openLinkText: () => {}, getLeaf: () => ({ openFile: async () => {} }) },
    commands: { executeCommandById: () => {} },
  };

  // Minimal DataArray stand-in: only .where() and iteration are used.
  const pages = [...tree.values()]
    .filter((n) => n.extension === "md" && board.inScope(n.path, board.resolveSettings(null, wiki)))
    .map((f) => {
      const content = fs.readFileSync(absOf(f.path), "utf8");
      const taskLines = content.split(/\r?\n/).filter((l) => /^\s*- \[[ x/-]\]/.test(l));
      return { file: { path: f.path, tasks: taskLines } };
    });

  const dv = {
    container: new El("div"),
    currentFilePath: DASHBOARD,
    pages: () => ({ where: (fn) => pages.filter((p) => fn(p)) }),
    paragraph: (t) => console.log("  dv.paragraph:", t),
  };

  // Render with a given settings frontmatter into a fresh container.
  const renderWith = async (fm) => {
    state.settingsFM = { ...fm };
    const c = new El("div");
    await board.render(dv, c, app);
    return c;
  };

  return { tree, app, dv, pages, renderWith, fmWrites, state, DASHBOARD };
}

/* ------------------------------------------------------------------ run */

async function run(wiki) {
console.log(`\n${"=".repeat(60)}\n${wiki.label} wiki (${wiki.slug})\n${"=".repeat(60)}`);

const { tree, app, dv, pages, renderWith, fmWrites, state, DASHBOARD } = setup(wiki);

console.log("\nRender smoke test");

await board.render(dv, dv.container, app);

const root = dv.container;
const columns = root.find(".wkb-col");
const cards = root.find(".wkb-card");
const checkboxes = root.find(".wkb-check");
const edits = root.find(".wkb-edit");
const empties = root.find(".wkb-empty");

ok("render completed without throwing", true);
ok("stylesheet injected into the container", root.children.some((c) => c.tag === "style"));
ok("board container present", root.find(".wkb-board").length === 1);
ok("position strip present", root.find(".wkb-strip").length === 1);
ok("wrap carries the wiki scope class",
   root.querySelector(".wkb-wrap").className.includes(`is-${wiki.slug}`),
   root.querySelector(".wkb-wrap").className);
ok(
  "unassigned column rendered first and marked",
  columns[0].className.includes("wkb-col--unassigned"),
  columns[0].className
);

/*
 * Cross-check the DOM against the model rather than fixed numbers. These run
 * against a live vault, so a hardcoded column count fails every time a project
 * is added or a status changes, for reasons that have nothing to do with the
 * render path. Discovery is mirrored here from the tree, so a divergence
 * between the model and the view shows up as a failing count.
 */
const modelTasks = pages.flatMap((p) =>
  board.extractTasks(fs.readFileSync(absOf(p.file.path), "utf8"), p.file.path)
);
function modelDiscover(folderPath, depth, archived) {
  const rootNode = tree.get(folderPath);
  if (!rootNode || !rootNode.children) return [];
  const meta = (landingPath, kind) => {
    const landing = tree.get(landingPath);
    const fm = landing ? app.metadataCache.getFileCache(landing).frontmatter : {};
    return {
      path: landing ? landingPath : null,
      status: archived ? "archived" : fm.status || "active",
      lastActivity: fm.last_activity || null,
      created: fm.created || null,
      kind,
    };
  };
  const out = [];
  for (const child of rootNode.children) {
    if (!child.children || child.name === "_old") continue;
    if (depth === 1) {
      out.push({ slug: child.name, ...meta(`${folderPath}/${child.name}/${child.name}.md`, "project") });
      continue;
    }
    out.push({ slug: child.name, ...meta(`${folderPath}/${child.name}/${child.name}.md`, "category") });
    for (const inner of child.children) {
      if (inner.children) {
        if (inner.name === "_old") continue;
        out.push({
          slug: inner.name,
          ...meta(`${folderPath}/${child.name}/${inner.name}/${inner.name}.md`, "project"),
        });
      } else if (inner.extension === "md" && inner.basename !== child.name) {
        out.push({ slug: inner.basename, ...meta(`${folderPath}/${child.name}/${inner.name}`, "project") });
      }
    }
  }
  return out;
}
const modelProjects = [
  ...modelDiscover(wiki.projectsFolder, wiki.projectDepth, false),
  ...modelDiscover(`${wiki.projectsFolder}/_old`, wiki.projectDepth, true),
];
const modelColumns = board.buildColumns(modelTasks, modelProjects, TODAY, board.resolveSettings({}, wiki), wiki);
const modelVisible = modelColumns.filter((c) => !c.hidden);
const modelOpen = modelColumns.reduce((n, c) => n + c.openCount, 0);
const renderedOpen = cards.filter((c) => !c.className.includes("wkb-card--done")).length;

ok("one rendered column per model column", columns.length === modelVisible.length,
   `${columns.length} vs ${modelVisible.length}`);
ok("rendered open cards match the model", renderedOpen === modelOpen, `${renderedOpen} vs ${modelOpen}`);
ok("board is not empty", renderedOpen > 0, String(renderedOpen));
ok("every card has a checkbox", checkboxes.length === cards.length, `${checkboxes.length} vs ${cards.length}`);
ok("every card has an edit affordance", edits.length === cards.length, `${edits.length} vs ${cards.length}`);
// A column with no lane at all shows the empty state instead. A column whose
// only content is a recently completed task renders a Done lane, not the empty
// state, so this is not the same as "columns with no open tasks".
ok("empty-state cards match empty model columns",
   empties.length === modelVisible.filter((c) => c.lanes.length === 0).length,
   `${empties.length} vs ${modelVisible.filter((c) => c.lanes.length === 0).length}`);
ok("dot per column in the strip", root.find(".wkb-dot").length === modelVisible.length,
   String(root.find(".wkb-dot").length));
ok(
  "checkbox click handler wired",
  checkboxes.every((c) => (c.listeners.click || []).length === 1)
);
ok(
  "no lane rendered empty",
  root.find(".wkb-lane").every((l) => l.find(".wkb-card").length > 0)
);

const firstCard = cards[0];
ok("card carries a description", firstCard.find(".wkb-card__desc").length === 1);
// Existence is not enough. A shim regression once blanked every description
// while leaving the element in place, and the preview looked plausible.
{
  const descs = cards.map((c) => c.find(".wkb-card__desc")[0]?.textContent || "");
  ok("every description has text", descs.every((d) => d.trim().length > 0),
     `${descs.filter((d) => !d.trim()).length} blank`);
  // Was a three-word minimum, which real data breaks: "12-factor-agents
  // (GitHub)" is a complete two-word task. The failure mode being guarded is
  // stripping eating the description, so assert it still carries actual content
  // rather than whitespace or leftover punctuation.
  ok("descriptions carry real content, not stripping residue",
     descs.every((d) => /[\p{L}\p{N}]/u.test(d)),
     descs.find((d) => !/[\p{L}\p{N}]/u.test(d)) ?? "ok");
  // The shim itself, since that is what broke. A text node must carry its own
  // text; when it did not, the spaces between adjacent links vanished and
  // two adjacent assignee links rendered as one run.
  ok("shim text nodes carry their text", document.createTextNode(" x ").textContent === " x ");
  const twoLinks = new El("div");
  board.render && twoLinks.appendChild(document.createTextNode("a"));
  twoLinks.appendChild(document.createTextNode(" "));
  twoLinks.appendChild(document.createTextNode("b"));
  ok("adjacent text nodes keep their separator", twoLinks.textContent === "a b", twoLinks.textContent);
}
ok(
  "descriptions carry no leftover Tasks emoji",
  !cards.some((c) => /[\u2795\u2705\u274C\u{1F4C5}\u{1F53A}\u{1F53C}\u{1F53D}\u23EB\u23EC]/u.test(
    c.find(".wkb-card__desc")[0]?.textContent || ""
  ))
);

console.log("\nSettings panel");
{
  const panel = root.querySelector(".wkb-settings");
  ok("panel rendered", !!panel);
  ok("panel is a native details element", panel.tag === "details", panel.tag);
  ok("panel starts collapsed", !panel.open);
  // The Sort group is owned by the toolbar above the board, so the panel renders
  // every other setting and nothing from Sort. One setting, one control.
  const panelSettings = board.SETTINGS.filter((s) => s.group !== "Sort");
  const controls = root.find(".wkb-set");
  ok("one control per non-sort setting", controls.length === panelSettings.length,
     `${controls.length} vs ${panelSettings.length}`);
  const groups = root.find(".wkb-settings__grouphead").map((e) => e.textContent);
  ok("every non-sort group is rendered",
     groups.length === new Set(panelSettings.map((s) => s.group)).size, groups.join(", "));
  ok("scope group present", groups.includes("Scope"), groups.join(", "));
  ok("panel has no Sort group", !groups.includes("Sort"), groups.join(", "));
  ok("reset button present", root.find(".wkb-settings__reset").length === 1);
  ok("no hidden-count warning while nothing is hidden", root.find(".wkb-settings__warn").length === 0);

  // Controls must show current state, not blanks. Checked separately from the
  // write path: a panel that renders but shows nothing back is still broken.
  const inputs = root.find(".wkb-set").flatMap((r) => r.children.filter((c) => c.tag === "input"));
  const numbers = inputs.filter((i) => i.type === "number");
  ok("number inputs show their current value",
     numbers.length === 2 && numbers.every((n) => n.value !== undefined && n.value !== ""),
     numbers.map((n) => n.value).join(", "));
  ok("width input shows the resolved default", numbers.some((n) => n.value === "280"),
     numbers.map((n) => n.value).join(", "));
  ok("checkboxes reflect their resolved state",
     inputs.filter((i) => i.type === "checkbox" && i.checked).length ===
       board.SETTINGS.filter((s) => s.type === "bool" && s.def).length);
  // No select survives in the panel: column order was its only one and the
  // toolbar owns it now. Asserted so the control cannot quietly come back.
  const panelSelects = root.find(".wkb-set").flatMap((r) => r.children.filter((c) => c.tag === "select"));
  ok("panel offers no select of its own", panelSelects.length === 0,
     String(panelSelects.length));
}

console.log("\nSort toolbar");
{
  const bar = root.querySelector(".wkb-toolbar");
  ok("toolbar rendered", !!bar);
  const select = bar.children.find((c) => c.tag === "select");
  ok("mode select present", !!select);
  ok("one option per mode", select.children.length === Object.keys(board.ORDER_MODES).length,
     String(select.children.length));
  const chosen = select.children.filter((o) => o.selected);
  ok("select marks the active mode", chosen.length === 1 && chosen[0].value === "count",
     chosen.map((o) => o.value).join(", "));
  ok("direction toggle present", root.find(".wkb-toolbar__dir").length === 1);
  ok("direction toggle enabled outside manual mode",
     root.querySelector(".wkb-toolbar__dir").disabled !== true);
  ok("no reorder arrows outside manual mode", root.find(".wkb-move").length === 0,
     String(root.find(".wkb-move").length));
  // The toolbar must sit outside the scroll container, or it scrolls away with
  // the columns and gets clipped by overflow-y: hidden.
  const wrap = root.querySelector(".wkb-wrap");
  ok("toolbar is a direct child of the wrap, not of the board",
     wrap.children.includes(bar) && root.querySelector(".wkb-board").children.every((c) => c !== bar));
}

console.log("\nToolbar writes settings");
{
  const c = await renderWith({});
  fmWrites.length = 0;
  const select = c.querySelector(".wkb-toolbar").children.find((x) => x.tag === "select");
  select.value = "due";
  await select.listeners.change[0]();
  ok("changing mode writes the mode", fmWrites[0][board.SETTING_PREFIX + "column_order"] === "due",
     JSON.stringify(fmWrites[0]));
  // Switching mode must reset the direction, or `alpha` inherits the `desc` that
  // made sense for `count` and sorts Z to A for no stated reason.
  ok("changing mode resets direction to auto",
     fmWrites[0][board.SETTING_PREFIX + "column_order_dir"] === "auto",
     JSON.stringify(fmWrites[0]));
  ok("one frontmatter write, not two", fmWrites.length === 1, String(fmWrites.length));

  const d = await renderWith({ board_column_order: "alpha" });
  fmWrites.length = 0;
  await d.querySelector(".wkb-toolbar__dir").listeners.click[0]({ preventDefault() {} });
  ok("toggle writes the opposite of the natural direction",
     fmWrites[0][board.SETTING_PREFIX + "column_order_dir"] === "desc",
     JSON.stringify(fmWrites[0]));

  const e = await renderWith({ board_column_order: "alpha", board_column_order_dir: "desc" });
  fmWrites.length = 0;
  await e.querySelector(".wkb-toolbar__dir").listeners.click[0]({ preventDefault() {} });
  ok("toggling back returns to ascending",
     fmWrites[0][board.SETTING_PREFIX + "column_order_dir"] === "asc",
     JSON.stringify(fmWrites[0]));
}

console.log("\nManual mode");
{
  const m = await renderWith({ board_column_order: "manual" });
  const moves = m.find(".wkb-move");
  ok("reorder arrows appear in manual mode", moves.length > 0, String(moves.length));
  ok("direction toggle disabled in manual mode",
     m.querySelector(".wkb-toolbar__dir").disabled === true);
  ok("unassigned column has no arrows",
     m.find(".wkb-col")[0].find(".wkb-move").length === 0);

  const projCols = m.find(".wkb-col").filter((c) => !c.className.includes("unassigned"));
  ok("two arrows per project column",
     projCols.every((c) => c.find(".wkb-move").length === 2),
     projCols.map((c) => c.find(".wkb-move").length).join(","));
  ok("first project column cannot move left",
     projCols[0].find(".wkb-move")[0].disabled === true);
  ok("last project column cannot move right",
     projCols.at(-1).find(".wkb-move")[1].disabled === true);
  ok("interior columns can move both ways",
     projCols.length < 3 ||
       projCols[1].find(".wkb-move").every((b) => b.disabled === false));

  fmWrites.length = 0;
  const firstTitle = projCols[0].find(".wkb-col__title")[0].textContent;
  const secondTitle = projCols[1].find(".wkb-col__title")[0].textContent;
  await projCols[0].find(".wkb-move")[1].listeners.click[0]({ preventDefault() {} });
  const written = fmWrites[0][board.SETTING_PREFIX + "column_manual"];
  ok("moving right writes the full column order",
     Array.isArray(written) && written.length === projCols.length,
     JSON.stringify(written));
  ok("the moved column swapped with its neighbour",
     written[0] === secondTitle && written[1] === firstTitle,
     JSON.stringify(written.slice(0, 2)));

  // Entering manual mode from another mode must lock in what is on screen, or
  // every column jumps to alphabetical the instant you switch.
  const k = await renderWith({ board_column_order: "count" });
  const before = k.find(".wkb-col").filter((x) => !x.className.includes("unassigned"))
    .map((x) => x.find(".wkb-col__title")[0].textContent);
  fmWrites.length = 0;
  const sel = k.querySelector(".wkb-toolbar").children.find((x) => x.tag === "select");
  sel.value = "manual";
  await sel.listeners.change[0]();
  const seeded = fmWrites[0][board.SETTING_PREFIX + "column_manual"];
  ok("switching to manual seeds the current visible order",
     JSON.stringify(seeded) === JSON.stringify(before),
     JSON.stringify(seeded?.slice(0, 3)));
}

console.log("\nSettings change the board");
{
  const noUnassigned = await renderWith({ board_show_unassigned: false });
  ok("unassigned column not rendered", noUnassigned.find(".wkb-col--unassigned").length === 0);
  ok("one column fewer than the default board",
     noUnassigned.find(".wkb-col").length === modelVisible.length - 1,
     `${noUnassigned.find(".wkb-col").length} vs ${modelVisible.length - 1}`);
  // The panel warns only when hiding actually hides something. Triage is empty
  // whenever every task in the vault leads with a project wikilink, and then no
  // warning is the correct output, so the assertion follows the premise rather
  // than asserting a warning that would be a lie.
  const triageCount = modelColumns.find((c) => c.unassigned).openCount;
  ok(triageCount ? "panel admits what it is hiding" : "panel stays quiet when hiding nothing",
     noUnassigned.find(".wkb-settings__warn").length === (triageCount ? 1 : 0),
     noUnassigned.find(".wkb-settings__warn")[0]?.textContent || `${triageCount} in triage`);

  const noEmpty = await renderWith({ board_show_empty_columns: false });
  // Scoped to project columns, which is what the setting is labelled for.
  // Triage is exempt from the filter, so an empty triage legitimately keeps its
  // empty state and used to fail this as though the filter had leaked.
  ok("empty-state cards gone from project columns",
     noEmpty.find(".wkb-col").filter((c) => !c.className.includes("unassigned"))
       .every((c) => c.find(".wkb-empty").length === 0),
     `${noEmpty.find(".wkb-empty").length} empty states, triage included`);
  // Fewer columns, or the same when every column already had open work. The
  // filter must never *add* one.
  ok("board never grows when empty columns are hidden",
     noEmpty.find(".wkb-col").length <= modelVisible.length,
     `${noEmpty.find(".wkb-col").length} vs ${modelVisible.length}`);
  // Every surviving project column must show at least one open task. A column
  // whose only content was a recent done card used to slip through.
  ok("every surviving project column has an open lane",
     noEmpty.find(".wkb-col").filter((c) => !c.className.includes("unassigned"))
       .every((c) => c.find(".wkb-lane--open").length > 0 || c.find(".wkb-lane--inprogress").length > 0),
     String(noEmpty.find(".wkb-col").length));
  ok("open cards survive the filter",
     noEmpty.find(".wkb-card").filter((c) => !c.className.includes("wkb-card--done")).length === modelOpen,
     `${noEmpty.find(".wkb-card").filter((c) => !c.className.includes("wkb-card--done")).length} vs ${modelOpen}`);

  const noChips = await renderWith({
    board_chip_assignees: false, board_chip_due: false, board_chip_created: false,
    board_chip_priority: false, board_chip_done: false,
  });
  ok("all chips off leaves no chips", noChips.find(".wkb-chip").length === 0,
     String(noChips.find(".wkb-chip").length));
  ok("cards still render with chips off", noChips.find(".wkb-card").length > 0);

  const withSource = await renderWith({ board_chip_source: true });
  ok("source chip appears when enabled", withSource.find(".wkb-src").length > 0,
     String(withSource.find(".wkb-src").length));

  const unpinned = await renderWith({ board_pin_unassigned: false });
  ok("unpinned drops the is-pinned class",
     !unpinned.querySelector(".wkb-col--unassigned").className.includes("is-pinned"),
     unpinned.querySelector(".wkb-col--unassigned").className);
  ok("but the column is still there and still first",
     unpinned.find(".wkb-col")[0].className.includes("wkb-col--unassigned"));
  ok("pinned by default",
     root.querySelector(".wkb-col--unassigned").className.includes("is-pinned"));

  const compact = await renderWith({ board_compact: true });
  ok("compact sets the wrap modifier",
     compact.querySelector(".wkb-wrap").className.includes("wkb-wrap--compact"));

  const wide = await renderWith({ board_column_width: 420 });
  ok("column width reaches the CSS variable",
     wide.querySelector(".wkb-wrap").styleProps["--wkb-col-width"] === "420px",
     wide.querySelector(".wkb-wrap").styleProps["--wkb-col-width"]);

  const areas = root.find(".wkb-set__list");
  ok("scope lists render as textareas", areas.length === 2, String(areas.length));
  ok("scope textarea shows this wiki's folders", areas[0].value === wiki.root, areas[0].value);

  const widened = await renderWith({
    board_include_folders: Object.values(board.WIKIS).map((w) => w.root),
  });
  ok("widening scope still renders a board",
     widened.find(".wkb-col").length >= modelVisible.length,
     `${widened.find(".wkb-col").length} vs ${modelVisible.length}`);

  // An unresolvable wiki must say so. Rendering another wiki's tasks under this
  // note's settings would be worse than rendering nothing.
  const noWiki = await renderWith({ board_wiki: "zzz" });
  ok("unknown wiki renders a banner, not a board",
     noWiki.find(".wkb-banner").length === 1 && noWiki.find(".wkb-board").length === 0,
     noWiki.find(".wkb-banner")[0]?.textContent || "no banner");
  ok("the banner names the valid slugs",
     Object.keys(board.WIKIS).every((slug) =>
       (noWiki.find(".wkb-banner")[0]?.textContent || "").includes(slug)),
     noWiki.find(".wkb-banner")[0]?.textContent || "");

  const bogus = await renderWith({ board_column_order: "banana", board_column_width: "wide" });
  ok("bogus settings still render a board", bogus.find(".wkb-col").length === modelVisible.length,
     `${bogus.find(".wkb-col").length} vs ${modelVisible.length}`);
}

console.log("\nPanel writes settings");
{
  const c = await renderWith({});
  fmWrites.length = 0;
  const box = c.find(".wkb-set")[0].children.find((x) => x.tag === "input");
  box.checked = false;
  await box.listeners.change[0]();
  ok("toggling a checkbox writes frontmatter", fmWrites.length === 1);
  ok("writes the prefixed key with the new value",
     fmWrites[0][board.SETTING_PREFIX + "show_unassigned"] === false,
     JSON.stringify(fmWrites[0]));

  fmWrites.length = 0;
  const resetBtn = c.querySelector(".wkb-settings__reset");
  await resetBtn.listeners.click[0]();
  ok("reset strips every board_ key",
     Object.keys(fmWrites[0] || {}).filter((k) => k.startsWith(board.SETTING_PREFIX)).length === 0,
     JSON.stringify(fmWrites[0]));
}

// Restore defaults for the remaining assertions.
state.settingsFM = {};

console.log("\nProject menu");
{
  const menus = root.find(".wkb-menu");
  // Only project columns get a menu. A category landing carries no lifecycle
  // status, so writing one to it would be wrong.
  const menuable = modelVisible.filter((c) => !c.unassigned && c.kind === "project");
  ok("one menu per project column, none on categories",
     menus.length === menuable.length, `${menus.length} vs ${menuable.length}`);
  ok("unassigned has no menu",
     root.find(".wkb-col")[0].find(".wkb-menu").length === 0);
  ok("menus start collapsed", menus.every((m) => !m.open));

  const first = menus[0];
  const items = first.find(".wkb-menu__item");
  ok("one item per lifecycle status", items.length === board.SHARED.projectStatuses.length,
     String(items.length));
  const current = items.filter((i) => i.className.includes("is-current"));
  ok("current status marked and not clickable",
     current.length === 1 && current[0].disabled,
     current.map((i) => i.textContent).join(","));

  const cmd = first.find(".wkb-menu__cmd")[0];
  ok("archive is handed off as a command, not a button",
     first.find(".wkb-menu__cmd").length === 1 &&
       cmd.textContent.startsWith(`/project ${wiki.slug} archive `),
     cmd.textContent);
  // Every menu must name its own column, not the first one. Pairing by column
  // catches a stale-closure bug that a single-menu check would miss.
  const mismatched = root.find(".wkb-col")
    .filter((c) => c.find(".wkb-menu").length > 0)
    .map((c) => ({
      title: c.find(".wkb-col__title")[0].textContent,
      cmd: c.find(".wkb-menu__cmd")[0].textContent,
    }))
    .filter((p) => p.cmd !== `/project ${wiki.slug} archive ${p.title}`);
  ok("every command names its own project", mismatched.length === 0,
     mismatched.map((p) => `${p.title} -> ${p.cmd}`).join("; ") || `all ${menus.length} match`);
  ok("no destructive control in the menu",
     !first.find(".wkb-menu__item").some((i) => /archive|delete|move/i.test(i.textContent)));

  // Category columns must render, and must render without a menu.
  const categoryCols = modelVisible.filter((c) => c.kind === "category");
  if (categoryCols.length) {
    const titles = new Set(categoryCols.map((c) => c.slug));
    const rendered = root.find(".wkb-col")
      .filter((c) => titles.has(c.find(".wkb-col__title")[0].textContent));
    ok("every category column renders", rendered.length === categoryCols.length,
       `${rendered.length} vs ${categoryCols.length}`);
    ok("no category column carries a status menu",
       rendered.every((c) => c.find(".wkb-menu").length === 0),
       rendered.filter((c) => c.find(".wkb-menu").length > 0)
         .map((c) => c.find(".wkb-col__title")[0].textContent).join(", ") || "none");
  }

  const dormant = items.find((i) => i.textContent === "dormant");
  ok("status item is wired", (dormant.listeners.click || []).length === 1);
}

console.log("\nStatus write targets the project note");
{
  const c = await renderWith({});
  const menu = c.find(".wkb-menu")[0];
  const dormant = menu.find(".wkb-menu__item").find((i) => i.textContent === "dormant");
  let target = null;
  const realProcess = app.fileManager.processFrontMatter;
  app.fileManager.processFrontMatter = async (file, fn) => {
    target = file.path;
    const fm = {};
    fn(fm);
    return fm;
  };
  let written = {};
  app.fileManager.processFrontMatter = async (file, fn) => {
    target = file.path;
    fn(written);
  };
  await dormant.listeners.click[0]({ preventDefault() {} });
  app.fileManager.processFrontMatter = realProcess;

  ok("writes to a project landing page, not the dashboard",
     target && target.startsWith(wiki.projectsFolder + "/") && target !== DASHBOARD, String(target));
  // Either a folder project's <slug>/<slug>.md, or, on a two-level wiki, a flat
  // <category>/<slug>.md. Never the category landing, which has no lifecycle.
  ok("landing page is a project page",
     /\/([^/]+)\/\1\.md$/.test(target || "") ||
       (wiki.projectDepth === 2 && /\/[^/]+\/[^/]+\.md$/.test(target || "")),
     String(target));
  ok("sets status", written.status === "dormant", JSON.stringify(written));
  ok("sets last_activity to a date", /^\d{4}-\d{2}-\d{2}$/.test(written.last_activity || ""),
     String(written.last_activity));
  ok("writes no board_ keys", !Object.keys(written).some((k) => k.startsWith(board.SETTING_PREFIX)));
}

console.log("\nCard status menu");
{
  const k = await renderWith({});
  const cards = k.find(".wkb-card");
  const menus = cards.map((c) => c.find(".wkb-status")[0]);
  ok("every card carries a status menu", menus.every(Boolean) && menus.length === cards.length,
     `${menus.filter(Boolean).length} of ${cards.length}`);
  ok("every menu offers all four statuses",
     menus.every((m) => m.find(".wkb-status__item").length === board.STATUSES.length),
     `${board.STATUSES.length} expected`);
  ok("every menu starts closed", menus.every((m) => !m.open));

  // Exactly one item per menu is the current status, and it is not clickable.
  const currents = menus.map((m) => m.find(".wkb-status__item").filter((i) => i.disabled));
  ok("exactly one item is the current status", currents.every((c) => c.length === 1),
     currents.map((c) => c.length).filter((n) => n !== 1).join(",") || "one each");
  ok("the current item is marked", currents.every((c) => c[0].className.includes("is-current")));

  // The menu is opened by right-clicking the checkbox, and by nothing else:
  // the card must gain no visible control.
  const card = cards[0];
  const box = card.find(".wkb-check")[0];
  const menu = card.find(".wkb-status")[0];
  ok("the checkbox has a contextmenu handler", !!(box.listeners.contextmenu || [])[0]);
  // A disabled button receives no mouse events in any browser, contextmenu
  // included. So the checkbox that owns the handler must never carry the
  // disabled attribute for a resting state, or the menu becomes unreachable on
  // exactly the done cards where reopening is the reason it exists.
  const boxes = cards.map((c) => c.find(".wkb-check")[0]);
  ok("no resting checkbox is disabled",
     boxes.every((b) => b.disabled !== true),
     `${boxes.filter((b) => b.disabled === true).length} of ${boxes.length} disabled`);
  const doneBoxes = k.find(".wkb-card--done").map((c) => c.find(".wkb-check")[0]);
  ok("a done checkbox still accepts a right-click",
     doneBoxes.every((b) => b.disabled !== true && !!(b.listeners.contextmenu || [])[0]),
     `${doneBoxes.length} done cards`);
  ok("a done checkbox is marked done for styling and assistive tech",
     doneBoxes.every((b) => b.className.includes("is-done") && b.attrs["aria-disabled"] === "true"),
     doneBoxes.length ? `${doneBoxes[0].className} / ${doneBoxes[0].attrs["aria-disabled"]}` : "none");
  ok("the checkbox says so in its title", (box.attrs.title || "").includes("right-click"),
     box.attrs.title || "");
  let defaultPrevented = false;
  box.listeners.contextmenu[0]({ preventDefault() { defaultPrevented = true; }, stopPropagation() {} });
  ok("right-click opens the menu", menu.open === true);
  // Preventing the default is what stops Obsidian's editor menu appearing, and
  // with it the cursor-based Tasks commands that produced the original error.
  ok("the browser and editor menu are suppressed", defaultPrevented);
  box.listeners.contextmenu[0]({ preventDefault() {}, stopPropagation() {} });
  ok("right-click again closes it", menu.open === false);

  /*
   * Clicking an item writes the task's own line, in the task's own file. As
   * with the add-task tests, `modify` is swapped for a recorder and put back.
   */
  const realModify = app.vault.modify;
  const writes = [];
  app.vault.modify = async (f, content) => { writes.push({ path: f.path, content }); };

  // Pick a card whose task is open, so Cancelled is a real change.
  const openCard = k.find(".wkb-lane--open")[0].find(".wkb-card")[0];
  const items = openCard.find(".wkb-status__item");
  const cancel = items.find((i) => i.textContent.includes("Cancelled"));
  ok("the cancelled item is offered and enabled", !!cancel && !cancel.disabled);

  await cancel.listeners.click[0]({ preventDefault() {}, stopPropagation() {} });
  ok("clicking cancelled writes exactly one file", writes.length === 1,
     String(writes.length));
  const wrote = writes[0];
  ok("it writes the task's own source file, not the dashboard",
     wrote.path !== DASHBOARD && wrote.path.endsWith(".md"), wrote.path);

  // The written file must differ from disk by exactly one line, and that line
  // must be the cancelled form of the line the card was rendered from.
  const before = fs.readFileSync(absOf(wrote.path), "utf8").split(/\r?\n/);
  const after = wrote.content.split(/\r?\n/);
  const changed = after.map((l, i) => (l === before[i] ? -1 : i)).filter((i) => i >= 0);
  ok("exactly one line changed", changed.length === 1, `${changed.length} lines`);
  if (changed.length === 1) {
    const line = after[changed[0]];
    ok("the changed line is cancelled", /^\s*- \[-\]/.test(line), line);
    ok("it carries a cancelled date", /\u274C \d{4}-\d{2}-\d{2}/.test(line), line);
    ok("it carries no done date", !line.includes("\u2705"), line);
    ok("the source line was open", /^\s*- \[[ /]\]/.test(before[changed[0]]), before[changed[0]]);
    // And the result leaves the board, which is the visible consequence.
    const back = board.extractTasks(wrote.content, wrote.path)
      .find((t) => t.line === changed[0]);
    ok("the cancelled task parses back as cancelled", !!back && back.status === "-",
       back ? back.status : "not parsed");
  }

  // Reopening strips the done date rather than leaving a contradictory line.
  const doneLane = k.find(".wkb-lane--done")[0];
  if (doneLane) {
    const doneCard = doneLane.find(".wkb-card")[0];
    const todo = doneCard.find(".wkb-status__item").find((i) => i.textContent.includes("Todo"));
    writes.length = 0;
    await todo.listeners.click[0]({ preventDefault() {}, stopPropagation() {} });
    if (writes.length === 1) {
      const w = writes[0];
      const b = fs.readFileSync(absOf(w.path), "utf8").split(/\r?\n/);
      const a = w.content.split(/\r?\n/);
      const at = a.map((l, i) => (l === b[i] ? -1 : i)).filter((i) => i >= 0)[0];
      ok("reopening a done task drops its done date",
         at !== undefined && /^\s*- \[ \]/.test(a[at]) && !a[at].includes("\u2705"),
         at === undefined ? "no change" : a[at]);
    } else {
      ok("reopening a done task writes one file", false, `${writes.length} writes`);
    }
  }

  app.vault.modify = realModify;
}

console.log("\nAdd-task button");
{
  const k = await renderWith({});
  const cols = k.find(".wkb-col");
  const buttons = cols.map((c) => c.find(".wkb-add")[0]);
  ok("every column carries one", buttons.every(Boolean) && buttons.length === cols.length,
     `${buttons.filter(Boolean).length} of ${cols.length}`);
  ok("none is disabled on this wiki", buttons.every((b) => !b.disabled),
     buttons.filter((b) => b.disabled).length + " disabled");
  ok("the glyph is a plus", buttons.every((b) => b.textContent === "+"));

  // The label has to name the file it writes to, because on a journal-filing
  // wiki that is not the project whose column was pressed. Derived from
  // addTaskTarget rather than a hardcoded path, so it holds for either mode.
  const labelled = cols.map((c) => [c, c.find(".wkb-add")[0].attrs["aria-label"] || ""]);
  const mismatched = labelled.filter(([c, label]) => {
    const slug = c.find(".wkb-col__title")[0].textContent;
    const target = board.addTaskTarget(wiki, {
      slug,
      path: modelColumns.find((m) => m.slug === slug)?.path || null,
      unassigned: c.className.includes("unassigned"),
    }, TODAY);
    return !target || !label.includes(target.path);
  });
  ok("every label names the file that button writes to", mismatched.length === 0,
     mismatched.map(([, l]) => l).join(" | ") || labelled[0][1]);

  const triageBtn = k.find(".wkb-col--unassigned")[0]?.find(".wkb-add")[0];
  if (triageBtn) {
    const t = board.addTaskTarget(wiki, { slug: "Unassigned", unassigned: true }, TODAY);
    ok("triage names its own fallback", triageBtn.attrs["aria-label"].includes(t.path),
       triageBtn.attrs["aria-label"]);
  }

  /*
   * The click path, with the Tasks plugin stubbed. `vault.modify` throws by
   * construction in this harness, so it is swapped for a recorder for the
   * duration and put back afterwards: what the button would have written is
   * asserted, and nothing reaches the vault.
   */
  const realModify = app.vault.modify;
  const realCreate = app.vault.create;
  const writes = [];
  const creates = [];
  app.vault.modify = async (f, content) => { writes.push({ path: f.path, content }); };
  app.vault.create = async (p, content) => { creates.push({ path: p, content }); return { path: p }; };

  const press = async (btn) => {
    writes.length = 0;
    creates.length = 0;
    await btn.listeners.click[0]({ preventDefault() {} });
  };
  const firstProject = cols.find((c) => !c.className.includes("unassigned"));
  const btn = firstProject.find(".wkb-add")[0];
  const slug = firstProject.find(".wkb-col__title")[0].textContent;

  // No plugin: fails closed, and says so rather than throwing into the console.
  app.plugins = undefined;
  await press(btn);
  ok("no Tasks plugin means no write", writes.length === 0 && creates.length === 0);

  // Cancelled modal returns the empty string.
  let seen = null;
  app.plugins = { plugins: { "obsidian-tasks-plugin": { apiV1: {
    editTaskLineModal: async (seed) => { seen = seed; return ""; },
  } } } };
  await press(btn);
  ok("a cancelled modal writes nothing", writes.length === 0 && creates.length === 0);
  ok("the modal is seeded with the column slug", seen === `- [ ] [[${slug}]] `, JSON.stringify(seen));

  // A real line comes back.
  app.plugins.plugins["obsidian-tasks-plugin"].apiV1.editTaskLineModal =
    async () => `- [ ] [[${slug}]] harness probe`;
  await press(btn);
  const wrote = writes[0] || creates[0];
  ok("a returned line reaches exactly one file",
     writes.length + creates.length === 1, `${writes.length} modify, ${creates.length} create`);

  if (wiki.newTask && wiki.newTask.journalFolder) {
    ok("a journal-filing wiki writes to today's journal",
       wrote.path === `${wiki.newTask.journalFolder}/${TODAY}.md`, wrote.path);
    ok("the line sits under the new-tasks heading",
       (() => {
         const lines = wrote.content.split(/\r?\n/);
         const h = lines.findIndex((l) => l.trim() === "# New tasks");
         return h !== -1 && lines.slice(h + 1, h + 2).some((l) => l.includes("harness probe"));
       })(),
       "# New tasks");
    // Today's journal does not exist until it is opened, and the button must
    // not fail on that. When it created the file, it came from the template.
    if (creates.length) {
      ok("a created journal carries the template's queries", wrote.content.includes("```tasks"));
      ok("a created journal has no placeholder left", !/\{\{date/.test(wrote.content));
    }
  } else {
    ok("a project-filing wiki writes into a project note",
       wrote.path.startsWith(wiki.projectsFolder + "/"), wrote.path);
    ok("the line sits under the tasks heading",
       (() => {
         const lines = wrote.content.split(/\r?\n/);
         const h = lines.findIndex((l) => l.trim() === "## Tasks");
         return h === -1 || lines.slice(h + 1).some((l) => l.includes("harness probe"));
       })(),
       "## Tasks");
  }

  ok("the written line carries a created date", /\u2795 \d{4}-\d{2}-\d{2}/.test(
     wrote.content.split(/\r?\n/).find((l) => l.includes("harness probe")) || ""),
     wrote.content.split(/\r?\n/).find((l) => l.includes("harness probe")) || "not found");
  ok("the written line parses back as a routable task",
     (() => {
       const t = board.extractTasks(wrote.content, wrote.path)
         .find((x) => x.raw.includes("harness probe"));
       return !!t && board.routeProjects(t, new Set([slug])).length === 1;
     })());
  ok("only the one line was added",
     (() => {
       const before = fs.existsSync(absOf(wrote.path))
         ? fs.readFileSync(absOf(wrote.path), "utf8").split(/\r?\n/).length
         : null;
       return before === null || wrote.content.split(/\r?\n/).length === before + 1;
     })(),
     "one line");

  app.vault.modify = realModify;
  app.vault.create = realCreate;
  delete app.plugins;
}

console.log("\nStylesheet lint");
{
  // The board never spans the viewport: it sits inside the note's content
  // area, narrower by the note margins. Sizing a column in vw therefore
  // overflows its container and clips the column edges on phone. Anything
  // container-relative is fine; viewport units are not.
  const css = fs.readFileSync(path.join(here, "view.css"), "utf8");
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  ok("no viewport units anywhere in view.css", !/\b[\d.]+v(w|h|min|max)\b/.test(stripped),
     (stripped.match(/\b[\d.]+v(w|h|min|max)\b/g) || []).join(", ") || "clean");
  ok("mobile breakpoint present", /@media\s*\(max-width:\s*600px\)/.test(stripped));
  ok("sticky column disabled on phone",
     /@media[\s\S]*wkb-col--unassigned\.is-pinned[\s\S]*position:\s*static/.test(stripped));
  ok("sticky only applies to the pinned variant",
     /\.wkb-col--unassigned\.is-pinned\s*\{[^}]*position:\s*sticky/.test(stripped));

  // The add button must not override the shared control geometry. .wkb-col__head
  // baseline-aligns its children, so a font-size or align-self of its own takes
  // the plus off the row the count and the arrows sit on, and a column title
  // that wraps to two lines makes it obvious. Both were shipped once and both
  // were wrong.
  const addRule = (css.match(/\.wkb-add\s*\{([^}]*)\}/) || [, ""])[1];
  ok("the add button overrides no control geometry",
     !/font-size|align-self|width|height|padding|display/.test(addRule),
     addRule.replace(/\s+/g, " ").trim() || "no rule found");
  ok("the add button is in the shared control group",
     /\.wkb-add,\s*\n?\s*\.wkb-move\s*\{/.test(css),
     "grouped with .wkb-move");

  // The status menu must stay inline. .wkb-board sets overflow-y: hidden, so
  // positioning it absolutely would clip it inside the scroll container, which
  // is the trap the column menu already documents.
  const statusRule = (css.match(/\.wkb-status\[open\]\s*\{([^}]*)\}/) || [, ""])[1];
  ok("the status menu is not positioned",
     !/position:\s*(absolute|fixed)/.test(statusRule), statusRule.replace(/\s+/g, " ").trim());
  // Its summary stays hidden, so right-click is the only way in and the card
  // gains no visible control.
  ok("the status menu summary is hidden",
     /\.wkb-status__summary\s*\{[^}]*display:\s*none/.test(css),
     "display: none");
  ok("board owns its box model", /box-sizing:\s*border-box/.test(stripped));

  // Assembled from pieces on purpose: written as a literal, the prefix rename
  // would rewrite this guard along with everything else and it would pass by
  // renaming itself.
  const OLD = "stb" + "-";
  const oldRe = new RegExp("\\b" + OLD, "g");
  ok(`no ${OLD} prefix left in view.css`, !oldRe.test(css),
     (css.match(oldRe) || []).length + " occurrences");
  const js = fs.readFileSync(path.join(here, "view.js"), "utf8");
  ok(`no ${OLD} prefix left in view.js`, !js.match(oldRe),
     (js.match(oldRe) || []).length + " occurrences");
  ok("a wiki scope block exists for every wiki",
     Object.keys(board.WIKIS).every((slug) =>
       new RegExp(`\\.wkb-wrap\\.is-${slug}\\b`).test(stripped)),
     Object.keys(board.WIKIS).join(", "));
}

// Re-render into the same container, the path a checkbox toggle takes.
await board.render(dv, dv.container, app);
ok("re-render is idempotent, no duplicate board", root.find(".wkb-board").length === 1);
ok("re-render keeps every column", root.find(".wkb-col").length === modelVisible.length,
   `${root.find(".wkb-col").length} vs ${modelVisible.length}`);

/*
 * --html <file> writes a standalone preview of the real board, using the real
 * markup and the real view.css, with a stand-in for Obsidian's theme
 * variables. Lets the layout be reviewed without opening Obsidian.
 */
if (process.argv.includes("--html")) {
  const requested = process.argv[process.argv.indexOf("--html") + 1];
  // With more than one wiki in the run, each gets its own file rather than the
  // second silently overwriting the first.
  const out =
    WIKI_KEYS.length > 1
      ? requested.replace(/(\.html?)?$/i, `-${wiki.slug}$1`)
      : requested;
  const vars = `
    :root {
      --background-primary: #ffffff; --background-secondary: #f6f7f9;
      --background-modifier-border: #dcdfe4; --background-modifier-border-hover: #c3c8d0;
      --background-modifier-hover: #ebedf0; --background-modifier-box-shadow: rgba(0,0,0,.2);
      --text-normal: #1f2328; --text-muted: #5c6470; --text-faint: #8b929e;
      --text-accent: #2f6fd0; --text-error: #c8322b; --color-orange: #c2760a;
      --font-smaller: 13px; --font-smallest: 11px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --background-primary: #1e1f22; --background-secondary: #26282c;
        --background-modifier-border: #383a3f; --background-modifier-border-hover: #4a4d54;
        --background-modifier-hover: #303338; --background-modifier-box-shadow: rgba(0,0,0,.55);
        --text-normal: #dcddde; --text-muted: #9aa0a8; --text-faint: #6c727c;
        --text-accent: #7aa2e3; --text-error: #e5534b; --color-orange: #d29922;
      }
    }
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; background: var(--background-primary);
           color: var(--text-normal); font-family: -apple-system, "Segoe UI", sans-serif; }
    /* Mimics Obsidian's note content area, which is narrower than the viewport
       by the note margins. Without this the preview cannot reproduce sizing
       bugs where a column is measured against vw instead of its container. */
    .mock-note { padding: 16px 24px; max-width: 100%; overflow: hidden; }
    h1 { font-size: 19px; margin: 0 0 4px; }
    p.note { color: var(--text-muted); font-size: 13px; margin: 0 0 16px; }
    button { font: inherit; }`;

  const body = root.children.map((c) => c.outerHTML).join("\n");
  fs.writeFileSync(
    out,
    `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${wiki.label} project board preview</title>
<style>${vars}</style></head><body class="wkb-board-page">
<div class="mock-note">
<h1>${wiki.label} project board</h1>
<p class="note">Static preview of the real board: real tasks, real markup, real view.css. The wrapper mimics Obsidian's note margins. Scroll sideways. Resize below 600px for the phone layout.</p>
${body}
</div>
</body></html>`,
    "utf8"
  );
  console.log(`\nPreview written to ${out}`);
}

} /* end run(wiki) */

for (const key of WIKI_KEYS) await run(board.WIKIS[key]);

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.log(`${failures} FAILED\n`);
  process.exit(1);
}
console.log("all green\n");
