/*
 * Project board
 *
 * A horizontally scrolling kanban of open tasks, one column per active project,
 * discovered automatically from a wiki's projects folder. Loaded from a board
 * note by a single dataviewjs line:
 *
 *     ```dataviewjs
 *     await dv.view("<path to this folder>")
 *     ```
 *
 * Design: DESIGN.md next to this file.
 * Tests:  test-board.mjs and test-render.mjs (node, use the exports at the end)
 *
 * One component serves any number of wikis. Everything wiki-specific lives in
 * the WIKIS table below; a board note names its wiki with `board_wiki: <slug>`
 * in frontmatter, and falls back to inferring it from the note's own path.
 *
 * This file runs in two contexts. Under Obsidian, Dataview defines `dv` and the
 * render entry point fires. Under node, `dv` is undefined and only the pure
 * functions are exported. There is no top-level await, so the file stays valid
 * CommonJS for require().
 */

/*
 * Structure, not looks. Anything here defines what a board *is* for a given
 * wiki; anything in SETTINGS defines how it looks. A board note names its wiki
 * with `board_wiki: <slug>`; when the key is absent the slug is inferred from
 * the note's own path, so an existing note keeps working untouched.
 */
const SHARED = {
  // Where this component's own files live, vault-relative. Only used to find
  // view.css, which view.js loads itself: see loadStylesheet for why dv.view
  // cannot be relied on to do it.
  //
  // Set it if you know it; leave it and the stylesheet is located by searching
  // the vault for a view.css sitting beside a view.js, so copying this folder
  // anywhere works with no edit.
  componentFolder: null,
  archivedFolder: "_old",
  // Lifecycle states from each wiki's wiki-config.md, offered in the column
  // menu. Which of them earns a column is per wiki, see columnStatuses.
  projectStatuses: ["active", "dormant", "completed", "abandoned"],
  // What a page with no `status` counts as. It has to be a state that earns a
  // column, or a project whose landing page omits the key leaves the board.
  defaultStatus: "active",
  // The state meaning "paused by decision", which the show_parked setting
  // turns into an opt-out column. Leave it null in a wiki that has no such
  // state and the setting adds nothing.
  parkedStatus: "dormant",
};

/*
 * One entry per wiki, keyed by the slug used in a board note's `board_wiki`
 * frontmatter. Folder names are not fixed by this component: they are whatever
 * that wiki's own wiki-config.md declares, which is why they are configuration
 * here rather than constants in the code.
 *
 * The single entry below describes the demo wiki under ./demo, which the test
 * harnesses run against. Replace it with your own, or add yours alongside it.
 * A wiki needs, at minimum, `slug`, `root`, `projectsFolder` and
 * `settingDefaults.include_folders`.
 */
const WIKIS = {
  demo: {
    slug: "demo",
    label: "Demo",
    root: "demo",

    // Where projects live, and how deep they nest.
    //
    // projectDepth 1 means `<projectsFolder>/<slug>/<slug>.md`: every project is
    // a folder whose same-named page is its landing page.
    //
    // projectDepth 2 additionally reads one level of category folders, each with
    // its own landing page that carries tasks of its own, and allows flat
    // projects as `<category>/<slug>.md` beside folder projects. Use 2 when
    // projects are grouped; the demo wiki uses it so both shapes are covered.
    projectsFolder: "demo/Projects",
    projectDepth: 2,

    // Assignees. Every page here is read as a person, so a task's leading
    // `[[Name]]` links render as a byline and are stripped from the card text.
    // Set to null for a single-user wiki: nothing is then read as an assignee,
    // no byline renders, and nothing is stripped for one.
    peopleFolder: "demo/People",

    // Which project lifecycle statuses earn a column. Anything else keeps its
    // tasks off the board, which is how a dormant or finished project stops
    // taking up width without its tasks being deleted.
    //
    // Add any status your wiki uses beyond the four in SHARED.projectStatuses.
    // A status used by a project but missing here silently removes that
    // project's tasks from the board, which is the worst failure this component
    // can have, so it is worth checking when a column goes missing.
    columnStatuses: ["active", "planning"],

    // Where the add-task button writes. Two shapes are supported and they are a
    // filing convention, not a preference:
    //
    //   Declare `journalFolder` and every column files its task in that day's
    //   note, under `heading`. Use this when tasks belong to a daily log and
    //   project pages aggregate them with a query. The column's slug is still
    //   seeded into the task, which is what routes it back to that column.
    //
    //   Omit it and each task is filed in the column's own page, under
    //   `heading`. Use this when a project page holds its own task list.
    //   `fallbackPath` catches tasks added from the triage column, which has no
    //   page of its own.
    newTask: {
      heading: "## Tasks",
      fallbackPath: "demo/Projects/general/general.md",
      fallbackSlug: "general",
    },

    settingDefaults: {
      include_folders: ["demo"],
      // Folders holding checkbox lines that are not project tasks: meeting
      // transcripts, shopping lists, reading lists, imported checklists. These
      // are the single most important setting to get right. A folder of
      // transcripts can hold an order of magnitude more checkbox lines than the
      // wiki has real tasks, and including it does not break the board, it
      // floods the triage column and buries the real work.
      exclude_folders: ["demo/Archive"],
    },
  },
};

/*
 * Which wiki this board belongs to. Explicit frontmatter wins; otherwise the
 * note's own path decides. Returns null rather than guessing, so an
 * unresolvable board shows a banner instead of an empty board.
 */
function resolveWiki(frontmatter, notePath) {
  const declared = frontmatter && frontmatter.board_wiki;
  if (declared) {
    const slug = String(declared).trim();
    return WIKIS[slug] || null;
  }
  const notePathStr = String(notePath || "");
  for (const wiki of Object.values(WIKIS)) {
    if (folderMatches(notePathStr, wiki.root)) return wiki;
  }
  return null;
}

/*
 * Column ordering. Each mode names one primary key, the direction that reads
 * naturally for it, and how ties break.
 *
 * `always: true` marks a key every column has a value for, so nothing is parked
 * at the end. Zero open tasks is a value; no due date at all is an absence.
 *
 * Ties resolve in their own natural direction whatever the primary direction is,
 * so flipping the sort does not also scramble everything that tied.
 *
 * Declared above SETTINGS because the `column_order` spec builds its options
 * from this table.
 */
const ORDER_MODES = {
  count: { label: "Open task count", dir: "desc", always: true, key: (c) => c.openCount, tie: "activity" },
  activity: { label: "Last activity", dir: "desc", key: (c) => c.lastActivity, tie: "name" },
  alpha: { label: "Alphabetical", dir: "asc", always: true, key: (c) => c.slug.toLowerCase(), tie: "name" },
  due: { label: "Earliest due date", dir: "asc", key: (c) => c.nextDue, tie: "name" },
  priority: { label: "Highest priority", dir: "desc", key: (c) => c.topPrio, tie: "count" },
  oldest: { label: "Longest waiting", dir: "asc", key: (c) => c.oldestCreated, tie: "name" },
  created: { label: "Project age", dir: "desc", key: (c) => c.created, tie: "name" },
  manual: { label: "Manual", dir: null, manual: true },
};

/*
 * User settings, stored as flat `board_*` keys in the dashboard note's
 * frontmatter. Everything here is a default: frontmatter only overrides.
 * A note with no board_* keys renders exactly as it did before settings
 * existed, so nothing breaks if they are all deleted.
 *
 * `type` drives both validation on read and which control the panel renders.
 */
const SETTINGS = [
  { key: "show_unassigned", group: "Columns", label: "Unassigned column", type: "bool", def: true },
  // Desktop and iPad only. Below the phone breakpoint the column is never
  // pinned regardless: a pinned 280px column on a 390pt screen leaves nothing
  // for the board, and sticky fights WebKit momentum scrolling.
  { key: "pin_unassigned", group: "Columns", label: "Pin Unassigned (desktop only)", type: "bool", def: true },
  { key: "show_empty_columns", group: "Columns", label: "Projects with no open tasks", type: "bool", def: true },
  // A project paused by decision is still a project, so its column is opt-out
  // rather than absent. Togglable because a parked project is exactly the
  // thing you sometimes want out of the way. Which state counts as parked is
  // SHARED.parkedStatus.
  { key: "show_parked", group: "Columns", label: "Parked projects", type: "bool", def: true },
  { key: "column_width", group: "Columns", label: "Column width (px)", type: "number", def: 280, min: 180, max: 600 },

  // The Sort group is rendered by the toolbar above the board, not by the
  // settings panel, so column order is one click away rather than behind a
  // disclosure. The panel skips this group: one setting, one control.
  {
    key: "column_order",
    group: "Sort",
    label: "Column order",
    type: "enum",
    def: "count",
    options: Object.entries(ORDER_MODES).map(([value, mode]) => [value, mode.label]),
  },
  {
    key: "column_order_dir",
    group: "Sort",
    label: "Direction",
    type: "enum",
    def: "auto",
    // `auto` is each mode's own natural direction, resolved at use rather than
    // stored. It keeps an existing note rendering exactly as before, and means
    // switching mode never inherits a direction that only made sense for the
    // mode you left.
    options: [
      ["auto", "Natural"],
      ["asc", "Ascending"],
      ["desc", "Descending"],
    ],
  },
  // Written by the arrows in the column headers, never by a panel control.
  { key: "column_manual", group: "Sort", label: "Manual order", type: "list", def: [] },

  { key: "chip_assignees", group: "Chips", label: "Assignees", type: "bool", def: true },
  { key: "chip_due", group: "Chips", label: "Due date", type: "bool", def: true },
  { key: "chip_created", group: "Chips", label: "Created date", type: "bool", def: true },
  { key: "chip_priority", group: "Chips", label: "Priority", type: "bool", def: true },
  { key: "chip_done", group: "Chips", label: "Done date", type: "bool", def: true },
  { key: "chip_source", group: "Chips", label: "Source note", type: "bool", def: false },

  { key: "lane_in_progress", group: "Lanes", label: "In progress lane", type: "bool", def: true },
  { key: "lane_done", group: "Lanes", label: "Done lane", type: "bool", def: true },
  { key: "done_window_days", group: "Lanes", label: "Done lane window (days)", type: "number", def: 7, min: 0, max: 365 },

  { key: "compact", group: "Density", label: "Compact cards (hide meta line)", type: "bool", def: false },

  // Scope. Vault-relative folder paths, one per line. Include wins nothing on
  // its own: a path must match an include and no exclude. Defaults are per
  // wiki, in WIKIS[slug].settingDefaults, because they describe the wiki's
  // shape rather than a display preference.
  { key: "include_folders", group: "Scope", label: "Folders to scan", type: "list", def: null },
  { key: "exclude_folders", group: "Scope", label: "Folders to skip", type: "list", def: null },
];

const SETTING_PREFIX = "board_";

/*
 * Merge frontmatter over the defaults, validating as we go. A bad value
 * degrades to its default rather than breaking the board: a typo in the YAML
 * should cost you one setting, not the whole view.
 */
function resolveSettings(frontmatter, wiki) {
  const fm = frontmatter || {};
  const overrides = (wiki && wiki.settingDefaults) || {};
  const out = {};
  for (const spec of SETTINGS) {
    const def = spec.key in overrides ? overrides[spec.key] : spec.def;
    const raw = fm[SETTING_PREFIX + spec.key];
    // Clone array defaults. Handing back the shared default array would let
    // any caller that mutates its settings corrupt the default for every
    // later call in the session.
    out[spec.key] =
      raw === undefined || raw === null
        ? Array.isArray(def)
          ? def.slice()
          : def
        : coerceSetting(spec, raw, def);
  }
  // Flags ride along here so every render path that already carries settings
  // carries them too, but they are resolved separately: they are not a SETTINGS
  // spec and they survive a reset. See FLAG_KEY.
  const flags = resolveFlags(fm);
  out.flags = flags.flags;
  out.flagProblems = flags.problems;
  // What the panel editor binds to: every declared entry, including the ones
  // validation rejected, because a flag you cannot see is one you cannot fix.
  out.flagsDeclared = flags.declared;
  return out;
}

function coerceSetting(spec, raw, def) {
  if (spec.type === "bool") {
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "string") {
      const s = raw.trim().toLowerCase();
      if (["true", "yes", "on", "1"].includes(s)) return true;
      if (["false", "no", "off", "0"].includes(s)) return false;
    }
    return def;
  }
  if (spec.type === "number") {
    const n = Number(raw);
    if (!Number.isFinite(n)) return def;
    return Math.min(spec.max, Math.max(spec.min, Math.round(n)));
  }
  if (spec.type === "enum") {
    return spec.options.some(([v]) => v === raw) ? raw : def;
  }
  if (spec.type === "list") {
    // Accept a YAML list, or a string with one entry per line or comma.
    const items = Array.isArray(raw) ? raw : String(raw).split(/[\n,]/);
    const clean = items.map((x) => normaliseFolder(x)).filter(Boolean);
    // An empty include list would scan the whole vault, which is never what a
    // blank field means. An empty exclude list is a legitimate choice.
    if (clean.length === 0 && spec.key === "include_folders") return (def || []).slice();
    return clean;
  }
  return def;
}

/*
 * Read a flag field out of frontmatter as a boolean. Absent, unparseable, and
 * an explicit no all read as false, so a consumer that fails closed on the
 * field keeps doing so, and the board never shows a project as flagged on the
 * strength of a value it could not read.
 *
 * A quoted "true" is tolerated, because YAML written by hand or by an agent
 * picks up quotes easily. Anything else is not a yes.
 */
function flagValue(raw) {
  if (typeof raw === "boolean") return raw;
  if (raw === undefined || raw === null) return false;
  return String(raw).trim().toLowerCase() === "true";
}

/*
 * Frontmatter the board already writes with different semantics: the status
 * menu writes both of these and stamps the date, a flag writes neither. A flag
 * declaring one would put two controls on one field with two meanings.
 */
const RESERVED_FLAG_FIELDS = ["status", "last_activity"];

/*
 * Which flags a board carries is declared on the board note, as `board_flags`:
 * a list of `{ field, label, glyph, on_hint?, off_hint? }`. The hints are named
 * that way rather than `on` and `off` because YAML 1.1 reads a bare `on:` or
 * `off:` key as a boolean, which would silently lose the sentence.
 *
 * It carries the `board_` prefix and the settings panel edits it, but it is not
 * a member of SETTINGS: one spec describes one scalar and one control, and this
 * is a list of records. Keeping it out is also what stops "Reset to defaults",
 * which deletes every SETTINGS key, from wiping the declaration along with the
 * display preferences.
 *
 * Nothing about a flag lives in WIKIS or anywhere else in this file. The board
 * writes the field and knows nothing about what reads it, which is what makes
 * one mechanism serve any per-project boolean: an opt-in to an export, a
 * publish gate, a review marker.
 */
const FLAG_KEY = SETTING_PREFIX + "flags";

const FLAG_FIELDS = ["field", "label", "glyph", "on_hint", "off_hint"];

// One declared entry, every key present as a trimmed string. The editor binds
// to this shape, so a half-filled flag survives a re-render instead of losing
// the keys nobody has typed yet.
function flagEntry(raw) {
  const out = {};
  for (const key of FLAG_FIELDS) {
    const v = raw ? raw[key] : null;
    out[key] = v === undefined || v === null ? "" : String(v).trim();
  }
  return out;
}

function flagEntryEmpty(entry) {
  return FLAG_FIELDS.every((key) => !entry[key]);
}

/*
 * Validate the declared flags. Returns the usable ones, one problem per entry
 * dropped, and the declaration itself as normalised entries.
 *
 * `declared` is what the panel editor binds to, and it deliberately includes
 * the entries validation rejected: a flag you cannot see is a flag you cannot
 * fix, and the whole point of editing in the panel is that the invalid one is
 * sitting there with its problem printed under it.
 *
 * An entirely empty entry is neither a flag nor a problem. That is the row the
 * Add button just created, and complaining about a form you have not filled in
 * yet is noise.
 *
 * The glyph cap is two characters. The header pill takes its geometry from the
 * shared 18px control group, so a longer glyph does not shrink the text, it
 * overflows the box.
 */
function resolveFlags(frontmatter) {
  const flags = [];
  const problems = [];
  const fields = new Set();
  const glyphs = new Set();
  const raw = (frontmatter || {})[FLAG_KEY];
  if (raw !== undefined && raw !== null && !Array.isArray(raw)) {
    return { flags, problems: [`${FLAG_KEY} must be a list of flags`], declared: [] };
  }
  const declared = (raw || []).map(flagEntry);
  for (const entry of declared) {
    const { field, label, glyph } = entry;
    if (flagEntryEmpty(entry)) continue;
    if (!field || !label || !glyph) {
      problems.push(`${label || field || "a new flag"} needs a field, a label and a glyph`);
      continue;
    }
    if (glyph.length > 2) {
      problems.push(`"${label}" has a ${glyph.length}-character glyph; two is the most that fits`);
      continue;
    }
    if (RESERVED_FLAG_FIELDS.includes(field) || field.startsWith(SETTING_PREFIX)) {
      problems.push(`"${label}" cannot write ${field}, which the board already owns`);
      continue;
    }
    if (fields.has(field)) {
      problems.push(`two flags write ${field}; each flag needs its own field`);
      continue;
    }
    if (glyphs.has(glyph)) {
      problems.push(`two flags use the glyph ${glyph}; the pills would be indistinguishable`);
      continue;
    }
    fields.add(field);
    glyphs.add(glyph);
    flags.push({
      field,
      label,
      glyph,
      onHint: entry.on_hint || null,
      offHint: entry.off_hint || null,
    });
  }
  return { flags, problems, declared };
}

// Vault-relative, no leading or trailing slash, so prefix matching is exact.
function normaliseFolder(value) {
  return String(value == null ? "" : value).trim().replace(/^\/+|\/+$/g, "");
}

function folderMatches(path, folder) {
  return path === folder || path.startsWith(folder + "/");
}

// Tasks-plugin emoji. Written as escapes so the file survives any re-encoding.
const E = {
  created: "➕",
  due: "\u{1F4C5}",
  done: "✅",
  cancelled: "❌",
  start: "\u{1F6EB}",
  scheduled: "⏳",
};
const E_REPEAT = "\u{1F501}";

// glyph, sort weight, label. Normal (no glyph) is weight 2.
const PRIORITIES = [
  ["\u{1F53A}", 5, "highest"],
  ["⏫", 4, "high"],
  ["\u{1F53C}", 3, "medium"],
  ["\u{1F53D}", 1, "low"],
  ["⏬", 0, "lowest"],
];
const PRIORITY_NORMAL = 2;

const TASK_RE = /^(\s*)- \[([ x/\-])\] (.*)$/;
const FENCE_RE = /^\s*(```|~~~)/;
const LINK_RE = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ---------------------------------------------------------------- parsing */

// Fails closed. Scope defaults are per wiki, so there is no wiki-less resolver
// to fall back on: without settings, nothing is in scope.
function inScope(path, settings) {
  const s = settings;
  if (!s || !s.include_folders || !s.exclude_folders) return false;
  if (!path.endsWith(".md")) return false;
  if (!s.include_folders.some((f) => folderMatches(path, f))) return false;
  return !s.exclude_folders.some((f) => folderMatches(path, f));
}

/*
 * Pull every task line out of a file's raw content.
 *
 * Fenced code blocks are skipped. This is not cosmetic: wiki-config.md
 * documents the task syntax with a worked example task inside a fence, which
 * would otherwise parse as a real open task and live in Unassigned forever.
 */
function extractTasks(content, path) {
  const lines = content.split(/\r?\n/);
  const tasks = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (FENCE_RE.test(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = TASK_RE.exec(lines[i]);
    if (m) tasks.push(parseTaskLine(m, lines[i], path, i));
  }
  return tasks;
}

function parseTaskLine(m, raw, path, line) {
  const body = m[3];
  const task = {
    path,
    line,
    raw,
    body,
    status: m[2],
    links: [],
    prio: PRIORITY_NORMAL,
    prioLabel: null,
  };

  LINK_RE.lastIndex = 0;
  let lm;
  while ((lm = LINK_RE.exec(body)) !== null) task.links.push(lm[1].trim());

  // The leading run is what the task is *about*; links later in the sentence are
  // mentions. Routing uses this, not `links`, so "retire [[other-project]]"
  // stays one task in its own column instead of appearing as work in two.
  task.lead = leadingTags(body);

  for (const [key, glyph] of Object.entries(E)) {
    const dm = new RegExp(glyph + "\\s*(\\d{4}-\\d{2}-\\d{2})").exec(body);
    task[key] = dm ? dm[1] : null;
  }

  for (const [glyph, weight, label] of PRIORITIES) {
    if (body.includes(glyph)) {
      task.prio = weight;
      task.prioLabel = label;
      break;
    }
  }
  return task;
}

/*
 * The link targets in the leading run of a task, before any prose. The wiki
 * convention is "- [ ] [[Person]] [[project]] description", so these are the
 * assignees and the project. Links appearing later are mentions inside a
 * sentence and are left alone.
 */
function leadingTags(body) {
  const tags = [];
  let s = body;
  for (;;) {
    const m = /^\s*\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]\s*/.exec(s);
    if (!m) return tags;
    tags.push(m[1].trim());
    s = s.slice(m[0].length);
  }
}

/*
 * Strip Tasks metadata, and the leading tags already shown elsewhere on the
 * card (the project, because the column names it, and the assignees, because
 * they get their own byline).
 *
 * Only the leading run is stripped. Removing a dropped link from mid-sentence
 * mangles the prose: "Check with [[Sam Okafor]] whether this is still needed"
 * would become "Check with whether this is still needed".
 */
function cleanDescription(body, dropTargets) {
  let s = body;

  const drop0 = new Set([...dropTargets].map((t) => t.toLowerCase()));
  for (;;) {
    const m = /^\s*\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]\s*/.exec(s);
    if (!m || !drop0.has(m[1].trim().toLowerCase())) break;
    s = s.slice(m[0].length);
  }

  for (const glyph of Object.values(E)) {
    s = s.replace(new RegExp(glyph + "\\s*\\d{4}-\\d{2}-\\d{2}", "g"), " ");
  }

  // Recurrence rule: everything from the repeat glyph up to the next known
  // emoji, or end of line. Character classes cannot hold surrogate pairs
  // reliably, so this walks indices instead.
  let r = s.indexOf(E_REPEAT);
  while (r !== -1) {
    let end = s.length;
    for (const glyph of Object.values(E)) {
      const at = s.indexOf(glyph, r + E_REPEAT.length);
      if (at !== -1 && at < end) end = at;
    }
    s = s.slice(0, r) + " " + s.slice(end);
    r = s.indexOf(E_REPEAT);
  }

  for (const [glyph] of PRIORITIES) s = s.split(glyph).join(" ");

  return s.replace(/\s+/g, " ").trim();
}

/* ------------------------------------------------------------- projects */

function resolveProjects(task, activeSlugs) {
  const byLower = new Map([...activeSlugs].map((s) => [s.toLowerCase(), s]));
  const hits = [];
  for (const target of task.links) {
    const slug = byLower.get(target.trim().toLowerCase());
    if (slug && !hits.includes(slug)) hits.push(slug);
  }
  return hits;
}

/*
 * Which columns a task belongs in. Matches on the leading run only, per the
 * wiki convention `- [ ] [[Person]] [[project]] description`, so a project named
 * inside the prose is read as a mention rather than a second assignment.
 *
 * Without this, a task like "[[api-migration]] decide whether to retire
 * [[legacy-export]]" lands in both columns, showing up as outstanding work on
 * the very project it proposes retiring.
 *
 * Falls back to every link when `lead` is absent, so a hand-built task object
 * still routes.
 */
function routeProjects(task, slugs) {
  return resolveProjects({ links: task.lead || task.links }, slugs);
}

/* -------------------------------------------------------------- sorting */

// Due ascending, undated after all dated, then created ascending, then
// priority descending. ISO date strings compare correctly as strings.
function compareTasks(a, b) {
  if (!!a.due !== !!b.due) return a.due ? -1 : 1;
  if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
  if (!!a.created !== !!b.created) return a.created ? -1 : 1;
  if (a.created && b.created && a.created !== b.created) return a.created < b.created ? -1 : 1;
  return b.prio - a.prio;
}

function compareDone(a, b) {
  if (!!a.done !== !!b.done) return a.done ? -1 : 1;
  if (a.done && b.done && a.done !== b.done) return a.done > b.done ? -1 : 1;
  return 0;
}

function daysBetween(fromISO, toISO) {
  const ms = Date.parse(toISO + "T00:00:00Z") - Date.parse(fromISO + "T00:00:00Z");
  return Math.round(ms / 86400000);
}

/* --------------------------------------------------------------- search */

/*
 * Subsequence match, case-insensitive: every character of the term must appear
 * in the text, in order, not necessarily adjacently. "mt sso" reads as two
 * space-separated terms and both must match, each anywhere, so word order in
 * the query does not matter. The board filters rather than ranks, so a plain
 * boolean is all the renderer needs.
 */
function fuzzyMatch(query, text) {
  const hay = String(text || "").toLowerCase();
  const terms = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  for (const term of terms) {
    let at = 0;
    for (const ch of term) {
      at = hay.indexOf(ch, at);
      if (at === -1) return false;
      at++;
    }
  }
  return true;
}

/*
 * Matches against the raw body, not the cleaned description: the leading
 * [[project]] and [[Person]] links stay in, so naming a project or a person in
 * the query finds their tasks too.
 */
function taskMatchesQuery(task, query) {
  return fuzzyMatch(query, task.body);
}

/* -------------------------------------------------------------- columns */

/*
 * projects: [{ slug, status, lastActivity, path }]
 * Returns the Unassigned column first, then active projects ordered by open
 * count descending, last activity descending, slug ascending.
 *
 * `query`, when non-empty, narrows the task pool before anything is bucketed:
 * the toolbar filter and the board must agree on what a match is, and doing it
 * here keeps that rule in one tested place rather than in the DOM.
 */
function buildColumns(tasks, projects, today, settings, wiki, query) {
  const w = wiki || WIKIS.st;
  const s = settings || resolveSettings(null, w);
  const q = String(query || "").trim();
  if (q) tasks = tasks.filter((t) => taskMatchesQuery(t, q));
  // Which statuses earn a column is per wiki, since a wiki may use lifecycle
  // states beyond the four in SHARED.projectStatuses. The parked state is
  // opt-out rather than absent, so a project paused by decision still shows
  // unless the toggle is off. A completed or abandoned one never earns a
  // column: leaving the board is the point, not a display preference.
  const eligible = new Set(w.columnStatuses);
  if (s.show_parked && SHARED.parkedStatus) eligible.add(SHARED.parkedStatus);
  const active = projects.filter((p) => eligible.has(p.status));
  const activeSlugs = new Set(active.map((p) => p.slug));
  const knownSlugs = new Set(projects.map((p) => p.slug));

  const bucket = new Map();
  for (const p of active) bucket.set(p.slug, []);
  const unassigned = [];

  for (const task of tasks) {
    if (task.status === "-") continue; // cancelled, dropped entirely
    if (task.status === "/" && !s.lane_in_progress) continue;
    if (task.status === "x") {
      if (!s.lane_done) continue;
      if (!task.done || daysBetween(task.done, today) > s.done_window_days) continue;
      if (daysBetween(task.done, today) < 0) continue;
    }
    const hits = routeProjects(task, activeSlugs);
    if (hits.length > 0) {
      for (const slug of hits) bucket.get(slug).push(task);
      continue;
    }
    // Assigned to a project that exists but has no column, because it is
    // archived under _old/ or its landing page has an ineligible status. That
    // work belongs to the project, not to triage, so it leaves the board.
    // Unassigned means "names no project", which is the triage signal.
    //
    // Both checks read the leading run, so merely mentioning an archived
    // project mid-sentence cannot silently remove a task from triage.
    if (routeProjects(task, knownSlugs).length > 0) continue;
    unassigned.push(task);
  }

  let columns = active.map((p) => makeColumn(p.slug, p, bucket.get(p.slug)));
  columns = sortColumns(columns, s.column_order, s.column_order_dir, s.column_manual);
  // Filter on open count, not on whether the column has any lane at all. The
  // setting is labelled "projects with no open tasks", so a project with zero
  // open tasks but something completed inside the done window must go too.
  // Filtering on lanes.length left those visible and contradicted the label.
  //
  // Under an active query the rule relaxes to "has any matching task": a
  // search for something just completed should still surface its column even
  // though the done lane does not count toward openCount.
  if (!s.show_empty_columns) {
    columns = columns.filter((c) => (q ? c.lanes.length > 0 : c.openCount > 0));
  }

  // The inbox is always built, and marked hidden rather than dropped, so the
  // settings panel can still report how many tasks are being hidden. Hiding is
  // fine; hiding silently is not. The renderer skips hidden columns.
  const inbox = makeColumn("Unassigned", { unassigned: true }, unassigned);
  inbox.hidden = !s.show_unassigned;
  return [inbox, ...columns];
}

// `auto` means the mode's own natural direction, resolved here rather than
// stored, so an unset or nonsense value always lands somewhere sensible.
function effectiveDir(order, dir) {
  const mode = ORDER_MODES[order] || ORDER_MODES.count;
  if (mode.manual) return "asc";
  return dir === "asc" || dir === "desc" ? dir : mode.dir;
}

function byColumnName(a, b) {
  const x = a.slug.toLowerCase();
  const y = b.slug.toLowerCase();
  return x < y ? -1 : x > y ? 1 : 0;
}

function tieComparator(tie) {
  if (tie === "activity") {
    return (a, b) => {
      const al = a.lastActivity || "";
      const bl = b.lastActivity || "";
      return al === bl ? byColumnName(a, b) : al > bl ? -1 : 1;
    };
  }
  if (tie === "count") {
    return (a, b) => (a.openCount === b.openCount ? byColumnName(a, b) : b.openCount - a.openCount);
  }
  return byColumnName;
}

/*
 * Columns with no value for the active key are partitioned out and always
 * appended last, in name order, in both directions.
 *
 * Letting them flip would put every empty column first the moment you press
 * descending, which is never what "sort by earliest due date, descending" is
 * asking for.
 */
function sortColumns(columns, order, dir, manual) {
  const mode = ORDER_MODES[order] || ORDER_MODES.count;
  if (mode.manual) return resolveManualOrder(columns, manual);

  const sign = effectiveDir(order, dir) === "asc" ? 1 : -1;
  const tie = tieComparator(mode.tie);
  const has = [];
  const missing = [];
  for (const c of columns) {
    const v = mode.key(c);
    (mode.always || (v !== null && v !== undefined && v !== "") ? has : missing).push(c);
  }
  has.sort((a, b) => {
    const ka = mode.key(a);
    const kb = mode.key(b);
    if (ka === kb) return tie(a, b);
    return (ka < kb ? -1 : 1) * sign;
  });
  missing.sort(byColumnName);
  return [...has, ...missing];
}

/*
 * Explicit slug list. Slugs that no longer name a column are dropped, and
 * columns missing from the list append at the end in name order, so a newly
 * created project is never invisible.
 */
function resolveManualOrder(columns, manual) {
  const listed = [];
  const taken = new Set();
  for (const raw of manual || []) {
    const key = String(raw == null ? "" : raw).trim().toLowerCase();
    if (!key || taken.has(key)) continue;
    const hit = columns.find((c) => c.slug.toLowerCase() === key);
    if (!hit) continue;
    taken.add(key);
    listed.push(hit);
  }
  const rest = columns.filter((c) => !listed.includes(c)).sort(byColumnName);
  return [...listed, ...rest];
}

function makeColumn(slug, project, tasks) {
  const lanes = [
    { key: "inprogress", title: "In progress", tasks: tasks.filter((t) => t.status === "/").sort(compareTasks) },
    { key: "open", title: "Open", tasks: tasks.filter((t) => t.status === " ").sort(compareTasks) },
    { key: "done", title: "Done this week", tasks: tasks.filter((t) => t.status === "x").sort(compareDone) },
  ];
  // Sort keys are computed from the open set only: a column's position should
  // reflect outstanding work, not what was finished last week. null means "no
  // value in this mode", which sortColumns parks at the end.
  const openTasks = [...lanes[0].tasks, ...lanes[1].tasks];
  const earliest = (values) => values.filter(Boolean).sort()[0] || null;
  return {
    slug,
    path: project.path || null,
    status: project.status || null,
    lastActivity: project.lastActivity || null,
    created: project.created || null,
    // "project" or "category". Only a project page carries a lifecycle status,
    // so only a project column offers the status menu.
    kind: project.kind || null,
    // One boolean per flag the board declares, keyed by field. Empty on a board
    // that declares none.
    flags: project.flags || {},
    unassigned: !!project.unassigned,
    lanes: lanes.filter((l) => l.tasks.length > 0),
    openCount: openTasks.length,
    nextDue: earliest(openTasks.map((t) => t.due)),
    oldestCreated: earliest(openTasks.map((t) => t.created)),
    topPrio: openTasks.length ? Math.max(...openTasks.map((t) => t.prio)) : null,
  };
}

/* ------------------------------------------------------------ formatting */

function formatDate(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
}

function dueClass(due, today) {
  if (!due) return "";
  if (due < today) return "wkb-due--late";
  if (due === today) return "wkb-due--today";
  return "";
}

/* ---------------------------------------------------------------- render */

async function collectTasks(dv, app, s) {
  // Narrow the Dataview source to the included folders so the whole vault is
  // not walked, then apply the full include/exclude test per page.
  const source = s.include_folders.map((f) => `"${f}"`).join(" or ") || '""';
  const pages = dv.pages(source).where((p) => inScope(p.file.path, s) && p.file.tasks.length > 0);
  const tasks = [];
  for (const page of pages) {
    const file = app.vault.getAbstractFileByPath(page.file.path);
    if (!file) continue;
    const content = await app.vault.cachedRead(file);
    tasks.push(...extractTasks(content, page.file.path));
  }
  return tasks;
}

/*
 * Every project folder, active and archived. Archived ones never become
 * columns, but buildColumns needs to know they exist so a task linking one
 * leaves the board instead of falling into the Unassigned triage column.
 */
async function collectProjects(app, wiki, flags) {
  const declared = flags || [];
  const meta = (landingPath, archived, kind) => {
    const landing = app.vault.getAbstractFileByPath(landingPath);
    const fm = landing ? app.metadataCache.getFileCache(landing)?.frontmatter || {} : {};
    return {
      path: landing ? landingPath : null,
      status: archived ? "archived" : fm.status || SHARED.defaultStatus,
      lastActivity: fm.last_activity ? String(fm.last_activity).slice(0, 10) : null,
      created: fm.created ? String(fm.created).slice(0, 10) : null,
      flags: Object.fromEntries(declared.map((f) => [f.field, flagValue(fm[f.field])])),
      kind,
    };
  };

  const scan = (folderPath, depth, archived) => {
    const root = app.vault.getAbstractFileByPath(folderPath);
    if (!root || !root.children) return [];
    const found = [];
    for (const child of root.children) {
      if (!child.children) continue; // a file at this level is not a container
      if (child.name === SHARED.archivedFolder) continue;
      if (depth === 1) {
        found.push({
          slug: child.name,
          ...meta(`${folderPath}/${child.name}/${child.name}.md`, archived, "project"),
        });
        continue;
      }
      // Depth 2: child is a category folder. Its landing page carries tasks of
      // its own, so it earns a column alongside the projects filed under it.
      found.push({
        slug: child.name,
        ...meta(`${folderPath}/${child.name}/${child.name}.md`, archived, "category"),
      });
      for (const inner of child.children) {
        if (inner.children) {
          if (inner.name === SHARED.archivedFolder) continue;
          found.push({
            slug: inner.name,
            ...meta(`${folderPath}/${child.name}/${inner.name}/${inner.name}.md`, archived, "project"),
          });
        } else if (inner.extension === "md" && inner.basename !== child.name) {
          found.push({
            slug: inner.basename,
            ...meta(`${folderPath}/${child.name}/${inner.name}`, archived, "project"),
          });
        }
      }
    }
    return found;
  };

  return [
    ...scan(wiki.projectsFolder, wiki.projectDepth, false),
    ...scan(`${wiki.projectsFolder}/${SHARED.archivedFolder}`, wiki.projectDepth, true),
  ];
}

// A wiki with no people folder has no assignees: nothing is ever read as one,
// so no byline is rendered and nothing is stripped from a description for one.
function peopleTargets(app, wiki) {
  if (!wiki.peopleFolder) return new Set();
  const folder = app.vault.getAbstractFileByPath(wiki.peopleFolder);
  const set = new Set();
  if (folder && folder.children) {
    for (const child of folder.children) {
      if (child.extension === "md") set.add(child.basename.toLowerCase());
    }
  }
  return set;
}

/*
 * Load view.css ourselves rather than relying on dv.view() to do it.
 *
 * Dataview resolves the stylesheet with metadataCache.getFirstLinkpathDest,
 * which is link resolution and does not dependably find a .css file inside
 * _service/, and it injects the result as <style scope=" ">, an attribute no
 * current browser implements. The board rendered with no layout at all.
 *
 * adapter.read() goes straight to disk by vault-relative path, bypassing the
 * file index entirely, and works the same on desktop and iOS. The
 * getAbstractFileByPath route is kept as a fallback.
 */
/*
 * Locate this component's stylesheet.
 *
 * `SHARED.componentFolder` wins when set. Otherwise the vault is searched for a
 * `view.css` with a `view.js` beside it, which is what this folder looks like
 * wherever it was copied to. Two installs would be ambiguous, so the first hit
 * is taken and the setting exists to disambiguate.
 */
function findStylesheet(app) {
  if (SHARED.componentFolder) return `${SHARED.componentFolder}/view.css`;
  const files = typeof app.vault.getFiles === "function" ? app.vault.getFiles() : [];
  const paths = new Set(files.map((f) => f.path));
  for (const p of paths) {
    // A bare "view.css" is the component installed at the vault root, which is
    // unusual but legal and must not be the one case that renders unstyled.
    if (p !== "view.css" && !p.endsWith("/view.css")) continue;
    if (paths.has(p.replace(/view\.css$/, "view.js"))) return p;
  }
  return null;
}

/*
 * Returns the <style> element rather than placing it, so render() can stage it
 * with the rest of the new board and swap the whole thing in at once.
 */
async function loadStylesheet(app) {
  const cssPath = findStylesheet(app);
  if (!cssPath) return null;
  let css = null;
  try {
    css = await app.vault.adapter.read(cssPath);
  } catch (e) {
    const file = app.vault.getAbstractFileByPath(cssPath);
    if (file) css = await app.vault.cachedRead(file);
  }
  if (!css) return null;
  const style = document.createElement("style");
  style.setAttribute("data-wkb-board", "1");
  style.textContent = css;
  return style;
}

function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/*
 * The statuses the board can set. Bounded by the parser, not chosen: TASK_RE
 * reads exactly these four characters, so writing a fifth would produce a line
 * the board cannot read back and the task would disappear from it. They are
 * also exactly the four the Tasks plugin registers in this vault, core plus
 * custom, and the names are its names.
 */
const STATUSES = [
  { symbol: " ", name: "Todo" },
  { symbol: "/", name: "In Progress" },
  { symbol: "x", name: "Done" },
  { symbol: "-", name: "Cancelled" },
];

/*
 * Rewrite a task line to a given status.
 *
 * One invariant governs the terminal dates: `✅` belongs to done and `❌` to
 * cancelled, and neither belongs to an open or in-progress task. Reopening a
 * done task therefore strips its completion date rather than leaving a line
 * that claims to be both open and finished, which is what the board would then
 * read for the Done lane's window.
 *
 * An existing date of the right kind is kept, so setting done on an already
 * done line does not stamp a second one.
 */
function setStatusLine(raw, symbol, today) {
  const m = TASK_RE.exec(raw);
  if (!m) return raw;
  let line = `${m[1]}- [${symbol}] ${m[3]}`;

  const wanted = symbol === "x" ? E.done : symbol === "-" ? E.cancelled : null;
  for (const glyph of [E.done, E.cancelled]) {
    if (glyph === wanted) continue;
    line = line.replace(new RegExp(`\\s*${glyph}\\s*\\d{4}-\\d{2}-\\d{2}`, "g"), "");
  }
  if (wanted && !line.includes(wanted)) line = `${line.trimEnd()} ${wanted} ${today}`;
  return line.trimEnd();
}

// Open (or in progress) to done. Kept as the name the checkbox path uses.
function completeLine(raw, today) {
  return setStatusLine(raw, "x", today);
}

/*
 * Write a status into a file's content. Fails closed: the line at the recorded
 * index must still be exactly what the board parsed, or the board is stale and
 * nothing is written.
 */
function applyStatus(content, task, symbol, today) {
  const lines = content.split(/\r?\n/);
  if (lines[task.line] !== task.raw) return { ok: false, reason: "stale" };
  // A recurring task's next occurrence is the plugin's job, not a line rewrite.
  // Refusing is the honest outcome: silently dropping the recurrence would lose
  // work that looks like it was merely completed.
  if (task.raw.includes(E_REPEAT)) return { ok: false, reason: "recurring" };
  lines[task.line] = setStatusLine(task.raw, symbol, today);
  // Preserve the file's own terminator so one status change does not rewrite
  // every line ending and make LiveSync replicate a whole-file change.
  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  return { ok: true, content: lines.join(eol) };
}

function applyCompletion(content, task, today) {
  return applyStatus(content, task, "x", today);
}

async function setTaskStatus(app, task, symbol, notice) {
  const file = app.vault.getAbstractFileByPath(task.path);
  if (!file) {
    notice("Source file not found. Board is stale.");
    return false;
  }
  const result = applyStatus(await app.vault.read(file), task, symbol, todayISO());
  if (!result.ok) {
    notice(
      result.reason === "recurring"
        ? "Recurring task: use the pencil, so the next occurrence is created."
        : "Task moved or changed, board is stale. Refresh and retry."
    );
    return false;
  }
  await app.vault.modify(file, result.content);
  return true;
}

async function toggleDone(app, task, notice) {
  return setTaskStatus(app, task, "x", notice);
}

/* ------------------------------------------------------------- add task */

/*
 * Which file a new task goes into, and under which heading.
 *
 * The rule is per wiki and comes from each wiki's own convention rather than
 * from a preference: see the `newTask` block in WIKIS. Returns null when the
 * board cannot answer, which the renderer turns into a disabled button rather
 * than a write that guesses.
 */
function addTaskTarget(wiki, column, today) {
  const cfg = wiki && wiki.newTask;
  if (!cfg) return null;

  // Journal wiki: one target for the whole board, the same file all day.
  if (cfg.journalFolder) {
    return {
      path: `${cfg.journalFolder}/${today}.md`,
      heading: cfg.heading,
      slug: column.unassigned ? null : column.slug,
      template: cfg.journalTemplate || null,
    };
  }

  // Project wiki: the column's own note. Triage has none, hence the fallback.
  if (column.unassigned) {
    if (!cfg.fallbackPath) return null;
    return {
      path: cfg.fallbackPath,
      heading: cfg.heading,
      slug: cfg.fallbackSlug || null,
      template: null,
    };
  }
  if (!column.path) return null;
  return { path: column.path, heading: cfg.heading, slug: column.slug, template: null };
}

/*
 * What the Tasks modal opens with. The slug goes in the leading run, because
 * that is the run routeProjects reads: a slug typed mid-sentence is a mention
 * and would leave the task in triage.
 */
function seedTaskLine(slug) {
  return slug ? `- [ ] [[${slug}]] ` : "- [ ] ";
}

/*
 * Created date. The Tasks modal does not add one, because `setCreatedDate` is
 * off in this vault's Tasks settings, yet every task already in either wiki
 * carries one and the board's "Longest waiting" and "Project age" sorts read
 * it. So a line arriving without one is stamped here, and a date set by hand
 * in the modal wins.
 *
 * Placed before the first glyph that conventionally follows created, rather
 * than at end of line, so the emoji order matches what the plugin itself emits
 * and what every existing line in the vault looks like.
 */
const AFTER_CREATED = [E.start, E.scheduled, E.due, E.cancelled, E.done];

function stampCreated(line, today) {
  if (line.includes(E.created)) return line;
  let at = line.length;
  for (const glyph of AFTER_CREATED) {
    const i = line.indexOf(glyph);
    if (i !== -1 && i < at) at = i;
  }
  const head = line.slice(0, at).replace(/\s+$/, "");
  const tail = line.slice(at);
  const stamp = `${E.created} ${today}`;
  return tail ? `${head} ${stamp} ${tail}` : `${head} ${stamp}`;
}

/*
 * Insert a task line into a file's content, under the section that holds that
 * file's tasks. Pure, so the whole rule is testable without a vault.
 *
 * Three anchors, tried in order:
 *
 *   1. The named heading. The line goes at the end of its section, after the
 *      last task already there, so the newest task reads as the newest.
 *   2. No such heading, but the file already has task lines. A page that keeps
 *      its tasks under some other heading is common enough, and opening a
 *      second section there would split one project's tasks across two places
 *      in the same note.
 *   3. Neither. A new section is opened above the first heading that holds a
 *      tasks query, so literal tasks stay above the aggregate that summarises
 *      them, and at the end of the body when there is no such heading.
 *
 * Fence-aware for the same reason extractTasks is: a checkbox inside a fenced
 * block is a query or a documented example, never an anchor.
 *
 * `line` may hold several lines. editTaskLineModal newline-joins what it
 * returns, which is how a recurring task hands back its next occurrence too.
 */
function insertTaskLine(content, heading, line) {
  const incoming = String(line == null ? "" : line)
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l) => l.trim() !== "");
  if (incoming.length === 0) return { ok: false, reason: "empty" };
  if (!incoming.every((l) => TASK_RE.test(l))) return { ok: false, reason: "not a task line" };

  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  const wanted = heading.trim().toLowerCase();
  const level = (/^#+/.exec(heading.trim()) || ["#"])[0].length;

  let inFence = false;
  let headingAt = -1;
  let sectionClosed = false;
  let lastTaskInSection = -1;
  let lastTaskAnywhere = -1;
  let queryHeading = -1;

  for (let i = 0; i < lines.length; i++) {
    if (FENCE_RE.test(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const hm = /^(#+)\s/.exec(lines[i]);
    if (hm) {
      const text = lines[i].trim().toLowerCase();
      if (headingAt === -1 && text === wanted) {
        headingAt = i;
        continue;
      }
      if (headingAt !== -1 && !sectionClosed && hm[1].length <= level) sectionClosed = true;
      if (queryHeading === -1 && /\btasks?\b/.test(text)) queryHeading = i;
      continue;
    }
    if (TASK_RE.test(lines[i])) {
      lastTaskAnywhere = i;
      if (headingAt !== -1 && !sectionClosed) lastTaskInSection = i;
    }
  }

  const out = lines.slice();
  if (headingAt !== -1) {
    out.splice(lastTaskInSection !== -1 ? lastTaskInSection + 1 : headingAt + 1, 0, ...incoming);
  } else if (lastTaskAnywhere !== -1) {
    out.splice(lastTaskAnywhere + 1, 0, ...incoming);
  } else if (queryHeading !== -1) {
    out.splice(queryHeading, 0, heading, ...incoming, "");
  } else {
    // End of the body, not end of the file. A trailing blank line belongs to
    // the file, and appending past it grows one blank line per task added.
    let end = out.length;
    while (end > 0 && out[end - 1].trim() === "") end--;
    out.splice(end, 0, "", heading, ...incoming);
  }
  return { ok: true, content: out.join(eol) };
}

/*
 * Resolve a periodic-notes template for a given day. Only the `{{date}}`
 * family is handled, which is all the journal template uses: `{{date:FORMAT}}`
 * and `{{date+7d:FORMAT}}`.
 *
 * A placeholder this does not understand is left verbatim rather than replaced
 * with a blank, so a template that grows a construct unknown here degrades
 * visibly in the note instead of silently dropping a query's filter and
 * widening what that query matches.
 */
const TEMPLATE_DATE_RE = /\{\{date([+-]\d+[dwmy])?(?::([^}]*))?\}\}/g;

function shiftISO(iso, shift) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (shift) {
    const sm = /^([+-])(\d+)([dwmy])$/.exec(shift);
    if (!sm) return null;
    const n = (sm[1] === "-" ? -1 : 1) * Number(sm[2]);
    if (sm[3] === "d") d.setUTCDate(d.getUTCDate() + n);
    else if (sm[3] === "w") d.setUTCDate(d.getUTCDate() + n * 7);
    else if (sm[3] === "m") d.setUTCMonth(d.getUTCMonth() + n);
    else d.setUTCFullYear(d.getUTCFullYear() + n);
  }
  return d.toISOString().slice(0, 10);
}

function formatISO(iso, fmt) {
  const [y, m, d] = iso.split("-");
  const out = fmt.replace(/YYYY/g, y).replace(/MM/g, m).replace(/DD/g, d);
  // Anything alphabetic left over is a token this does not implement. Fail, so
  // the caller keeps the placeholder rather than writing half a date.
  return /[A-Za-z]/.test(out) ? null : out;
}

function resolveTemplateDates(template, today) {
  TEMPLATE_DATE_RE.lastIndex = 0;
  return String(template).replace(TEMPLATE_DATE_RE, (whole, shift, fmt) => {
    const iso = shiftISO(today, shift);
    if (!iso) return whole;
    const value = formatISO(iso, (fmt == null ? "YYYY-MM-DD" : fmt).trim() || "YYYY-MM-DD");
    return value == null ? whole : value;
  });
}

/*
 * The journal template, resolved for a day that has no note yet. Returns null
 * when there is nothing to resolve, having said why.
 */
async function templateContent(app, target, notice, today) {
  const tpl = app.vault.getAbstractFileByPath(target.template);
  if (!tpl) {
    notice(`No note at ${target.path}, and no template at ${target.template} to create it from.`);
    return null;
  }
  return resolveTemplateDates(await app.vault.read(tpl), today);
}

/*
 * The whole add-task round trip: open the plugin's modal, stamp, insert, write.
 *
 * The modal is the Tasks plugin's own, reached through apiV1, rather than a
 * form of the board's. Two reasons: the due, priority and recurrence pickers
 * then behave exactly as they do when editing a note, and there is no second
 * implementation of the task syntax here to drift from the plugin's.
 *
 * A missing journal is created with the task already in it, in one write rather
 * than a create followed by a modify. That keeps the two paths identical up to
 * the final call, and leaves no moment where the journal exists without the
 * task that caused it to be created.
 */
async function addTask(app, wiki, column, notice, today) {
  const target = addTaskTarget(wiki, column, today);
  if (!target) {
    notice(`${column.slug} has no file to add a task to.`);
    return false;
  }
  const plugin = app.plugins && app.plugins.plugins && app.plugins.plugins["obsidian-tasks-plugin"];
  const api = plugin && plugin.apiV1;
  if (!api || typeof api.editTaskLineModal !== "function") {
    notice("Tasks plugin not available, so the task editor cannot open.");
    return false;
  }

  const returned = await api.editTaskLineModal(seedTaskLine(target.slug));
  if (!returned || !returned.trim()) return false; // cancelled, say nothing

  const file = app.vault.getAbstractFileByPath(target.path);
  let base;
  if (file) {
    base = await app.vault.read(file);
  } else if (target.template) {
    base = await templateContent(app, target, notice, today);
    if (base === null) return false;
  } else {
    notice(`Cannot find ${target.path}.`);
    return false;
  }

  const stamped = returned
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((l) => stampCreated(l, today))
    .join("\n");
  const result = insertTaskLine(base, target.heading, stamped);
  if (!result.ok) {
    notice(`Could not add the task to ${target.path}: ${result.reason}.`);
    return false;
  }

  try {
    if (file) {
      await app.vault.modify(file, result.content);
    } else {
      const folder = target.path.slice(0, target.path.lastIndexOf("/"));
      if (folder && !app.vault.getAbstractFileByPath(folder)) {
        try {
          await app.vault.createFolder(folder);
        } catch (e) {
          // A concurrent create is fine; anything else surfaces on create.
        }
      }
      await app.vault.create(target.path, result.content);
    }
  } catch (e) {
    notice(`Could not write ${target.path}: ${e.message}`);
    return false;
  }

  // Name the file. On a wiki that files into a journal, the task lands there
  // rather than in the project whose column was pressed, and a silent write
  // somewhere the user was not looking reads as the button having done nothing.
  notice(file ? `Task added to ${target.path}.` : `Task added to a new ${target.path}.`);
  return true;
}

function renderDescription(el, text, sourcePath, app) {
  LINK_RE.lastIndex = 0;
  let last = 0;
  let m;
  while ((m = LINK_RE.exec(text)) !== null) {
    if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
    const a = document.createElement("a");
    a.className = "internal-link wkb-link";
    a.textContent = m[1].trim();
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      app.workspace.openLinkText(m[1].trim(), sourcePath, false);
    });
    el.appendChild(a);
    last = m.index + m[0].length;
  }
  if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
}

/*
 * Status menu on a card, opened by right-clicking its checkbox.
 *
 * A `<details>` that expands inline inside the card, not Obsidian's `Menu` and
 * not an absolutely positioned popover. Two reasons, both already established
 * elsewhere in this file: `.wkb-board` sets `overflow-y: hidden`, so a
 * positioned popover is clipped by the scroll container, which is why the
 * column menu works this way too; and `require("obsidian")` is treated here as
 * possibly unreachable, see makeNotifier, so `Menu` is not a dependency this
 * component can take.
 *
 * The summary is hidden. The checkbox's `contextmenu` handler is what toggles
 * it, so the card gains no visible control and looks exactly as it did. That
 * makes right-click the only way in, which is the point: the gesture the Tasks
 * plugin's own query-result checkboxes offer, on a board card, acting on the
 * task the card already holds rather than on wherever the editor cursor
 * happens to be.
 */
function renderStatusMenu(task, app, notice, refresh) {
  const menu = document.createElement("details");
  menu.className = "wkb-status";

  const summary = document.createElement("summary");
  summary.className = "wkb-status__summary";
  summary.setAttribute("aria-label", "Task status");
  menu.appendChild(summary);

  const body = document.createElement("div");
  body.className = "wkb-status__body";

  const head = document.createElement("div");
  head.className = "wkb-menu__head";
  head.textContent = "Set status";
  body.appendChild(head);

  for (const status of STATUSES) {
    const item = document.createElement("button");
    const current = task.status === status.symbol;
    item.className = "wkb-status__item" + (current ? " is-current" : "");
    item.textContent = `[${status.symbol === " " ? " " : status.symbol}] ${status.name}`;
    item.disabled = current;
    item.setAttribute("aria-label", `Set status to ${status.name}`);
    item.addEventListener("click", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      item.disabled = true;
      if (await setTaskStatus(app, task, status.symbol, notice)) {
        // Say what happened when the card is about to leave. Cancelled drops
        // off the board entirely and Todo leaves the Done lane, so a silent
        // refresh reads as the card having been deleted.
        if (status.symbol === "-") notice(`Cancelled, removed from the board.`);
        await refresh();
      } else {
        item.disabled = false;
      }
    });
    body.appendChild(item);
  }

  menu.appendChild(body);
  return menu;
}

function renderCard(task, column, people, today, app, notice, refresh, s) {
  const card = document.createElement("div");
  card.className = "wkb-card" + (task.status === "x" ? " wkb-card--done" : "");

  // Assignees are the people named in the leading run, per the wiki's task
  // convention. People mentioned inside the sentence stay in the prose.
  const leading = leadingTags(task.body);
  const names = leading.filter((t) => people.has(t.toLowerCase()));
  const drop = new Set(names);
  if (!column.unassigned) drop.add(column.slug);

  const top = document.createElement("div");
  top.className = "wkb-card__top";

  const box = document.createElement("button");
  const isDone = task.status === "x";
  // Done is a class, not the disabled attribute. A disabled button receives no
  // mouse events in any browser, contextmenu included, which would make the
  // status menu below unreachable on exactly the done cards where reopening is
  // the reason it exists. The click is made inert instead, and the styling and
  // the assistive-tech state are unchanged.
  box.className = "wkb-check" + (isDone ? " is-done" : "");
  box.setAttribute("aria-label", isDone ? "Done" : "Mark done");
  box.setAttribute("aria-disabled", isDone ? "true" : "false");
  box.textContent = isDone ? "✓" : "";
  box.addEventListener("click", async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (isDone) return;
    // Transient only, to swallow a second click while the write is in flight.
    box.disabled = true;
    if (await toggleDone(app, task, notice)) await refresh();
    else box.disabled = false;
  });
  // Right-click opens the status menu below, on this task. Without this the
  // gesture falls through to Obsidian's editor menu, where any Tasks command
  // added to it acts on the editor's cursor line rather than on this card, and
  // fails with "line is not a task" whenever the cursor is elsewhere.
  const statusMenu = renderStatusMenu(task, app, notice, refresh);
  box.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    statusMenu.open = !statusMenu.open;
  });
  box.setAttribute("title", "Click to complete, right-click for status");
  top.appendChild(box);

  const desc = document.createElement("div");
  desc.className = "wkb-card__desc";
  renderDescription(desc, cleanDescription(task.body, drop), task.path, app);
  top.appendChild(desc);

  const edit = document.createElement("button");
  edit.className = "wkb-edit";
  edit.setAttribute("aria-label", "Edit task");
  edit.textContent = "✎";
  edit.addEventListener("click", async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const file = app.vault.getAbstractFileByPath(task.path);
    if (!file) return notice("Source file not found. Board is stale.");
    const leaf = app.workspace.getLeaf(false);
    await leaf.openFile(file, { eState: { line: task.line } });
    setTimeout(() => app.commands.executeCommandById("obsidian-tasks-plugin:edit-task"), 120);
  });
  top.appendChild(edit);

  card.appendChild(top);
  card.appendChild(statusMenu);

  const meta = document.createElement("div");
  meta.className = "wkb-meta";
  const bits = [];
  if (task.status === "x" && task.done) {
    if (s.chip_done) bits.push(["", `done ${formatDate(task.done)}`]);
  } else if (task.due) {
    if (s.chip_due) bits.push([dueClass(task.due, today), `due ${formatDate(task.due)}`]);
    else if (s.chip_created && task.created) bits.push(["", `created ${formatDate(task.created)}`]);
  } else if (task.created && s.chip_created) {
    bits.push(["", `created ${formatDate(task.created)}`]);
  }
  // Only flag priorities that actually differentiate. Most open tasks are
  // medium, so a "medium" chip on nearly every card is noise, not signal.
  if (s.chip_priority && task.status !== "x" && task.prioLabel && (task.prio >= 4 || task.prio <= 1)) {
    bits.push([`wkb-prio wkb-prio--${task.prioLabel}`, task.prioLabel]);
  }
  if (s.chip_assignees && names.length) bits.push(["wkb-who", names.join(", ")]);
  if (s.chip_source) bits.push(["wkb-src", task.path.split("/").pop().replace(/\.md$/, "")]);

  for (const [cls, text] of bits) {
    const span = document.createElement("span");
    span.className = "wkb-chip " + cls;
    span.textContent = text;
    meta.appendChild(span);
  }
  if (bits.length) card.appendChild(meta);

  return card;
}

function renderColumn(column, wiki, people, today, app, dv, notice, refresh, s, order) {
  const el = document.createElement("section");
  el.className =
    "wkb-col" +
    (column.unassigned ? " wkb-col--unassigned" : "") +
    (column.unassigned && s.pin_unassigned ? " is-pinned" : "");

  const head = document.createElement("header");
  head.className = "wkb-col__head";

  const title = document.createElement(column.path ? "a" : "span");
  title.className = "wkb-col__title";
  title.textContent = column.slug;
  if (column.path) {
    title.addEventListener("click", (ev) => {
      ev.preventDefault();
      app.workspace.openLinkText(column.path, "", false);
    });
  }
  head.appendChild(title);

  const count = document.createElement("span");
  count.className = "wkb-col__count";
  count.textContent = String(column.openCount);
  head.appendChild(count);

  head.appendChild(renderAddButton(wiki, column, app, notice, refresh, today));

  // Only a project landing carries flags, and only on a board that declares
  // some. A category landing and the unassigned column are not projects, so
  // writing a project flag to them would be wrong.
  if (!column.unassigned && column.kind === "project") {
    for (const flag of s.flags) {
      head.appendChild(renderFlagPill(column, flag, app, notice, refresh));
    }
  }

  // Unassigned is not a project, so it has no lifecycle to manage. The menu
  // lives inside the header and expands inline: .wkb-board sets
  // overflow-y: hidden, so an absolutely positioned dropdown would be clipped.
  // Manual mode only. Placed before the menu so the menu keeps its
  // margin-left: auto and stays at the header's trailing edge.
  if (!column.unassigned && s.column_order === "manual") {
    head.appendChild(renderMoveButtons(column, order, app, dv, notice, refresh));
  }

  // A category landing is not a project page and has no lifecycle to manage, so
  // writing `status` to it would be wrong. Only project columns get the menu.
  if (!column.unassigned && column.kind === "project") {
    head.appendChild(renderColumnMenu(column, wiki, s.flags, app, notice, refresh));
  }

  el.appendChild(head);

  if (column.lanes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "wkb-empty";
    empty.textContent = column.unassigned ? "nothing to triage" : "no open tasks";
    if (column.lastActivity) {
      const sub = document.createElement("div");
      sub.className = "wkb-empty__sub";
      sub.textContent = `last activity ${formatDate(column.lastActivity)}`;
      empty.appendChild(sub);
    }
    el.appendChild(empty);
    return el;
  }

  for (const lane of column.lanes) {
    const laneEl = document.createElement("div");
    laneEl.className = `wkb-lane wkb-lane--${lane.key}`;

    const laneHead = document.createElement("div");
    laneHead.className = "wkb-lane__head";
    laneHead.textContent = `${lane.title} (${lane.tasks.length})`;
    laneEl.appendChild(laneHead);

    for (const task of lane.tasks) {
      laneEl.appendChild(renderCard(task, column, people, today, app, notice, refresh, s));
    }
    el.appendChild(laneEl);
  }
  return el;
}

/*
 * Settings panel.
 *
 * A native <details> disclosure: keyboard accessible, works on touch, and its
 * open/closed handling costs no custom code. Open state lives on `window`
 * rather than in frontmatter, so a re-render does not slam the panel shut but
 * merely opening it never writes to the note.
 */
function renderSettingsPanel(wiki, s, hiddenUnassigned, app, dv, notice, refresh) {
  const panel = document.createElement("details");
  panel.className = "wkb-settings";
  // globalThis, not window: view.js also runs under node in the test harness,
  // where window does not exist.
  //
  // Keyed per wiki, so two boards open side by side do not share one open
  // state and opening one panel does not spring the other's open on its next
  // re-render.
  const panelState = (globalThis.__wkbPanelOpen ||= {});
  panel.open = !!panelState[wiki.slug];
  panel.addEventListener("toggle", () => {
    panelState[wiki.slug] = panel.open;
  });

  const summary = document.createElement("summary");
  summary.className = "wkb-settings__summary";
  summary.textContent = "Board settings";
  if (hiddenUnassigned > 0) {
    const warn = document.createElement("span");
    warn.className = "wkb-settings__warn";
    warn.textContent = `${hiddenUnassigned} unassigned hidden`;
    summary.appendChild(warn);
  }
  panel.appendChild(summary);

  const body = document.createElement("div");
  body.className = "wkb-settings__body";

  const write = async (key, value) => {
    const ok = await writeSetting(app, dv, key, value, notice);
    if (ok) await refresh();
  };

  for (const group of ["Columns", "Chips", "Lanes", "Density", "Scope"]) {
    const section = document.createElement("div");
    section.className = "wkb-settings__group";

    const head = document.createElement("div");
    head.className = "wkb-settings__grouphead";
    head.textContent = group;
    section.appendChild(head);

    for (const spec of SETTINGS.filter((x) => x.group === group)) {
      section.appendChild(renderSettingControl(spec, s[spec.key], write));
    }
    body.appendChild(section);
  }

  body.appendChild(renderFlagEditor(s, app, dv, notice, refresh));

  const reset = document.createElement("button");
  reset.className = "wkb-settings__reset";
  reset.textContent = "Reset to defaults";
  reset.addEventListener("click", async () => {
    reset.disabled = true;
    if (await resetSettings(app, dv, notice)) await refresh();
    else reset.disabled = false;
  });
  body.appendChild(reset);

  panel.appendChild(body);
  return panel;
}

/*
 * Session-only focus memory for the flag editor, for the same reason the search
 * box has one: every commit re-renders the whole board, which replaces the
 * input being typed into. The handler records which entry and which key had
 * focus, and render() puts the caret back afterwards.
 *
 * Keyed by nothing: one editor is open at a time, inside one panel, and a
 * second board's panel replaces the record rather than fighting over it.
 */
function flagFocusState() {
  return (globalThis.__wkbFlagFocus ||= { index: null, key: null, committing: false });
}

/*
 * The flags group: the one group in the panel not backed by a SETTINGS spec.
 * One block per declared flag with its five fields, a Remove button each, and
 * an Add flag button under the list.
 *
 * Every commit writes the whole `board_flags` list, so the frontmatter is
 * always the complete declaration and a partial list cannot drift, which is
 * the same rule the manual column order follows.
 */
function renderFlagEditor(s, app, dv, notice, refresh) {
  const section = document.createElement("div");
  section.className = "wkb-settings__group wkb-settings__group--flags";

  const title = document.createElement("div");
  title.className = "wkb-settings__grouphead";
  title.textContent = "Flags";
  section.appendChild(title);

  // The working copy. Add pushes to it without writing, so a row you have not
  // typed into yet costs the note nothing; the first edit commits the lot.
  const entries = s.flagsDeclared.map((e) => ({ ...e }));

  const commit = async () => {
    const ok = await writeFlags(app, dv, entries, notice);
    if (ok) await refresh();
  };

  const list = document.createElement("div");
  entries.forEach((entry, i) => {
    list.appendChild(renderFlagFields(entry, i, entries, commit));
  });
  section.appendChild(list);

  // Problems sit under the blocks rather than inside one: a duplicate field is
  // a problem with the pair, and naming the flag in the text is what points at
  // the block to fix.
  for (const problem of s.flagProblems) {
    const row = document.createElement("div");
    row.className = "wkb-settings__flagproblem";
    row.textContent = problem;
    section.appendChild(row);
  }

  const add = document.createElement("button");
  add.className = "wkb-settings__add";
  add.textContent = "Add flag";
  add.addEventListener("click", (ev) => {
    ev.preventDefault();
    const entry = flagEntry(null);
    entries.push(entry);
    const block = renderFlagFields(entry, entries.length - 1, entries, commit);
    list.appendChild(block);
    const first = block.querySelector("input");
    if (first) first.focus();
  });
  section.appendChild(add);

  const note = document.createElement("div");
  note.className = "wkb-settings__note";
  note.textContent = entries.length
    ? `Stored as ${FLAG_KEY} in this note's frontmatter. Reset to defaults leaves them alone.`
    : `A flag puts a switch on every project column and writes a boolean to that project's page. Nothing here knows what reads it.`;
  section.appendChild(note);

  return section;
}

const FLAG_LABELS = {
  field: "Field",
  label: "Label",
  glyph: "Glyph",
  on_hint: "When on",
  off_hint: "When off",
};

const FLAG_PLACEHOLDERS = {
  field: "publish",
  label: "Publish",
  glyph: "P",
  on_hint: "What being on means (optional)",
  off_hint: "What being off means (optional)",
};

function renderFlagFields(entry, index, entries, commit) {
  const block = document.createElement("div");
  block.className = "wkb-settings__flag";

  const head = document.createElement("div");
  head.className = "wkb-settings__flaghead";

  // The pill as the board draws it, so the config and the column are visibly
  // the same thing. A glyph nobody has typed yet shows the empty box.
  const preview = document.createElement("span");
  preview.className = "wkb-settings__glyph";
  preview.textContent = entry.glyph;
  head.appendChild(preview);

  const name = document.createElement("span");
  name.className = "wkb-settings__flagname";
  name.textContent = entry.label || entry.field || "New flag";
  head.appendChild(name);

  const remove = document.createElement("button");
  remove.className = "wkb-settings__remove";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", `Remove ${entry.label || entry.field || "this flag"}`);
  remove.addEventListener("click", async (ev) => {
    ev.preventDefault();
    remove.disabled = true;
    entries.splice(index, 1);
    // Removing a flag leaves its field on every project page. That is the
    // conservative half of the trade: the board stops offering the switch and
    // stops reading the field, and nothing silently rewrites every project.
    await commit();
  });
  head.appendChild(remove);
  block.appendChild(head);

  const focus = flagFocusState();
  for (const key of FLAG_FIELDS) {
    const row = document.createElement("label");
    row.className = `wkb-set wkb-set--flag wkb-set--flag-${key}`;

    const text = document.createElement("span");
    text.className = "wkb-set__flaglabel";
    text.textContent = FLAG_LABELS[key];
    row.appendChild(text);

    const input = document.createElement("input");
    input.type = "text";
    input.className = "wkb-set__flagfield";
    input.value = entry[key];
    input.placeholder = FLAG_PLACEHOLDERS[key];
    input.spellcheck = false;
    if (key === "glyph") input.maxLength = 2;
    // Commit on change, which fires on blur, not on every keystroke: a write
    // per character would re-render the board under the cursor.
    input.addEventListener("change", async () => {
      const value = input.value.trim();
      if (value === entry[key]) return;
      entry[key] = value;
      // change fires just before blur, so this is what tells the blur handler
      // the record is worth keeping: a field left untouched should not pull the
      // caret back to itself on the next re-render.
      focus.committing = true;
      await commit();
    });
    input.addEventListener("focus", () => {
      focus.index = index;
      focus.key = key;
    });
    input.addEventListener("blur", () => {
      if (focus.committing) focus.committing = false;
      else if (focus.index === index && focus.key === key) {
        focus.index = null;
        focus.key = null;
      }
    });
    row.appendChild(input);
    block.appendChild(row);
  }

  return block;
}

/*
 * Writes the flag list itself, not a prefixed setting, so it cannot go through
 * writeSetting. An empty list deletes the key rather than leaving an empty
 * array behind: a board with no flags should look like a board that never had
 * any.
 *
 * Empty optional keys are dropped, and an entirely empty entry never reaches
 * the note, so the frontmatter stays the shape the docs describe.
 */
async function writeFlags(app, dv, entries, notice) {
  const file = dashboardFile(app, dv);
  if (!file) {
    notice("Cannot find the dashboard note to save flags into.");
    return false;
  }
  const clean = entries.filter((e) => !flagEntryEmpty(e)).map((e) => {
    const out = {};
    for (const key of FLAG_FIELDS) if (e[key]) out[key] = e[key];
    return out;
  });
  try {
    await app.fileManager.processFrontMatter(file, (fm) => {
      if (clean.length) fm[FLAG_KEY] = clean;
      else delete fm[FLAG_KEY];
    });
    return true;
  } catch (e) {
    notice(`Could not save flags: ${e.message}`);
    return false;
  }
}

function renderSettingControl(spec, value, write) {
  const row = document.createElement("label");
  row.className = "wkb-set";

  if (spec.type === "bool") {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = !!value;
    box.addEventListener("change", () => write(spec.key, box.checked));
    row.appendChild(box);
    const text = document.createElement("span");
    text.textContent = spec.label;
    row.appendChild(text);
    return row;
  }

  const text = document.createElement("span");
  text.className = "wkb-set__label";
  text.textContent = spec.label;
  row.appendChild(text);

  if (spec.type === "list") {
    row.className = "wkb-set wkb-set--stacked";
    const area = document.createElement("textarea");
    area.className = "wkb-set__list";
    area.rows = Math.max(3, (value || []).length + 1);
    area.value = (value || []).join("\n");
    area.spellcheck = false;
    area.placeholder = "One vault-relative folder per line";
    // Commit on change (blur), not on every keystroke: each write re-renders,
    // which would rip the textarea out from under the cursor mid-typing.
    area.addEventListener("change", () =>
      write(spec.key, area.value.split(/\n/).map((x) => x.trim()).filter(Boolean))
    );
    row.appendChild(area);
    return row;
  }

  if (spec.type === "enum") {
    const select = document.createElement("select");
    for (const [val, label] of spec.options) {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = label;
      if (val === value) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener("change", () => write(spec.key, select.value));
    row.appendChild(select);
    return row;
  }

  const num = document.createElement("input");
  num.type = "number";
  num.value = String(value);
  num.min = String(spec.min);
  num.max = String(spec.max);
  num.addEventListener("change", () => write(spec.key, Number(num.value)));
  row.appendChild(num);
  return row;
}

/*
 * Sort control, above the board rather than inside the collapsed settings
 * panel: column order is the setting reached for most often. It owns the whole
 * Sort group, so no key has two controls.
 *
 * Rendered as a sibling of .wkb-board, never inside it: the board sets
 * overflow-y: hidden for clean horizontal scrolling, which would clip the
 * dropdown, and the toolbar would scroll away with the columns.
 *
 * The search box lives here too. Its state is session-only in
 * globalThis.__wkbSearch, keyed by wiki slug, for the same reasons the panel
 * open state is: typing must never write to the note, and two boards side by
 * side must not share one query. Each keystroke re-renders (debounced), so the
 * handler records whether the box had focus, and render() restores it
 * afterwards. Scroll is not its business: boardScrollState below covers every
 * rebuild, not just a search one.
 */
function searchState(wiki) {
  const all = (globalThis.__wkbSearch ||= {});
  return (all[wiki.slug] ||= { query: "", focused: false, timer: null });
}

/*
 * Scroll position, kept so it survives a rebuild. render() throws the board
 * away and builds a new one on every refresh: a task ticked, a status changed,
 * Dataview re-running the block after a sync.
 *
 * `left` is the board's own horizontal position. A fresh .wkb-board starts at
 * scrollLeft 0, so without this the board jumps back to the first column every
 * time, which on a board wider than the screen means losing your place on
 * every edit.
 *
 * `top` is the note pane's vertical position, which is not the board's own:
 * .wkb-board is overflow-y: hidden and .wkb-col has no max-height, so a column
 * taller than the window makes the *note* scroll, not the board. Emptying the
 * container collapses the note, the pane clamps scrollTop to the new maximum,
 * and refilling it restores the height but not the position. Measured in
 * Chromium: scrollTop 900 before the teardown, 0 while empty, 0 once the board
 * is back. `el` is the pane the listener is on, so a second render re-uses it
 * rather than stacking another listener on an element that, unlike the board,
 * outlives the rebuild.
 *
 * Session-only and keyed by wiki slug, in globalThis for the same reasons as
 * the search state: nothing here belongs in the note, and two boards side by
 * side must keep their own positions.
 */
function boardScrollState(wiki) {
  const all = (globalThis.__wkbScroll ||= {});
  return (all[wiki.slug] ||= { left: 0, top: 0, el: null, handler: null });
}

/*
 * The element that actually scrolls the note. Obsidian uses
 * .markdown-preview-view in reading view and .cm-scroller in live preview, and
 * a theme can put its own scroller between them, so the pane is found by
 * walking up from the block container to the first ancestor that can scroll
 * rather than by naming either class.
 *
 * The test is the computed overflow, not scrollHeight > clientHeight: at the
 * moment render() runs the container can already be empty, which makes the
 * real pane momentarily unscrollable and would send this straight past it.
 *
 * Returns null where there is no layout to read, which is the node harness.
 * With no pane the vertical restore is inert instead of throwing, and the
 * render tests keep passing.
 */
function findScroller(el) {
  if (typeof getComputedStyle !== "function") return null;
  for (let node = el && el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow === "auto" || overflow === "scroll" || overflow === "overlay") return node;
  }
  return document.scrollingElement || document.documentElement || null;
}

function renderToolbar(wiki, s, orderedSlugs, app, dv, notice, refresh, search) {
  const bar = document.createElement("div");
  bar.className = "wkb-toolbar";

  const searchBox = document.createElement("input");
  searchBox.type = "search";
  searchBox.className = "wkb-toolbar__filter";
  searchBox.placeholder = "Filter tasks…";
  searchBox.setAttribute("aria-label", "Filter tasks");
  searchBox.value = search.query;
  const queueRefresh = (delay) => {
    clearTimeout(search.timer);
    search.timer = setTimeout(() => {
      // Read focus off the live DOM now, before the re-render rebuilds it; a
      // blur listener would fire mid-rebuild and lie. Scroll needs no capture
      // here: the board's own scroll listener keeps boardScrollState current.
      search.focused = document.activeElement === searchBox;
      refresh();
    }, delay);
  };
  searchBox.addEventListener("input", () => {
    search.query = searchBox.value;
    queueRefresh(150);
  });
  searchBox.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && searchBox.value) {
      ev.preventDefault();
      search.query = "";
      queueRefresh(0);
    }
  });
  bar.appendChild(searchBox);

  const label = document.createElement("span");
  label.className = "wkb-toolbar__label";
  label.textContent = "Sort";
  bar.appendChild(label);

  const select = document.createElement("select");
  select.className = "wkb-toolbar__mode";
  for (const [value, mode] of Object.entries(ORDER_MODES)) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = mode.label;
    if (value === s.column_order) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener("change", async () => {
    // Reset the direction with the mode, and seed the manual list from what is
    // on screen, so switching to manual never reshuffles the board under you.
    const patch = { column_order: select.value, column_order_dir: "auto" };
    if (select.value === "manual") patch.column_manual = orderedSlugs.slice();
    if (await writeSettings(app, dv, patch, notice)) await refresh();
  });
  bar.appendChild(select);

  const manual = s.column_order === "manual";
  const dir = effectiveDir(s.column_order, s.column_order_dir);
  const flip = document.createElement("button");
  flip.className = "wkb-toolbar__dir";
  flip.textContent = dir === "asc" ? "↑" : "↓";
  flip.disabled = manual;
  flip.setAttribute(
    "aria-label",
    manual ? "Direction not used in manual order" : `Sorting ${dir}ending, click to reverse`
  );
  flip.addEventListener("click", async (ev) => {
    ev.preventDefault();
    flip.disabled = true;
    const next = dir === "asc" ? "desc" : "asc";
    if (await writeSettings(app, dv, { column_order_dir: next }, notice)) await refresh();
    else flip.disabled = false;
  });
  bar.appendChild(flip);

  if (manual) {
    const hint = document.createElement("span");
    hint.className = "wkb-toolbar__hint";
    hint.textContent = "Reorder with the arrows in each column header";
    bar.appendChild(hint);
  }

  return bar;
}

/*
 * Add-task button, one per column header.
 *
 * The column is the target selector: pressing it seeds that column's slug into
 * the modal, so the task routes straight back to the column pressed. Which
 * *file* the line lands in is the wiki's business, not the column's, and the
 * label says so out loud, because on a journal-filing wiki the write does not
 * go to the project whose column was pressed.
 *
 * Disabled rather than hidden when the board has no target: an absent button
 * reads as a layout bug, a disabled one with a reason reads as an answer.
 */
function renderAddButton(wiki, column, app, notice, refresh, today) {
  const target = addTaskTarget(wiki, column, today);
  const btn = document.createElement("button");
  btn.className = "wkb-add";
  btn.textContent = "+";
  btn.disabled = !target;
  btn.setAttribute(
    "aria-label",
    target
      ? `Add a task to ${target.slug || "triage"}, written to ${target.path}`
      : `No file to add a task to for ${column.slug}`
  );
  btn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    // Held disabled on success: refresh() rebuilds this button from scratch.
    btn.disabled = true;
    if (await addTask(app, wiki, column, notice, today)) await refresh();
    else btn.disabled = false;
  });
  return btn;
}

/*
 * Manual reordering, as two buttons rather than drag and drop.
 *
 * .wkb-board is a horizontal scroll container, where HTML5 drag is awkward on
 * desktop and effectively broken on touch, which is where this board is used
 * most. Buttons behave identically on both and reuse the same 44 by 44 hit area
 * as the card controls.
 *
 * Each press writes the whole visible order, not a delta, so the list in
 * frontmatter is always complete and a partial list cannot drift.
 */
function renderMoveButtons(column, order, app, dv, notice, refresh) {
  const box = document.createElement("span");
  box.className = "wkb-moves";
  const at = order.indexOf(column.slug);
  for (const [delta, glyph, name] of [[-1, "◀", "left"], [1, "▶", "right"]]) {
    const to = at + delta;
    const btn = document.createElement("button");
    btn.className = "wkb-move";
    btn.textContent = glyph;
    btn.disabled = at < 0 || to < 0 || to >= order.length;
    btn.setAttribute("aria-label", `Move ${column.slug} ${name}`);
    btn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      btn.disabled = true;
      const next = order.slice();
      [next[at], next[to]] = [next[to], next[at]];
      if (await writeSettings(app, dv, { column_manual: next }, notice)) await refresh();
      else btn.disabled = false;
    });
    box.appendChild(btn);
  }
  return box;
}

function dashboardFile(app, dv) {
  const path = dv && (dv.currentFilePath || (dv.current && dv.current() && dv.current().file.path));
  return path ? app.vault.getAbstractFileByPath(path) : app.workspace.getActiveFile();
}

// processFrontMatter is the sanctioned write path: it parses, mutates and
// re-serialises the YAML rather than string-patching it, so a malformed edit
// cannot corrupt the note. It works on iOS.
async function writeSettings(app, dv, patch, notice) {
  const file = dashboardFile(app, dv);
  if (!file) {
    notice("Cannot find the dashboard note to save settings into.");
    return false;
  }
  try {
    await app.fileManager.processFrontMatter(file, (fm) => {
      for (const [key, value] of Object.entries(patch)) fm[SETTING_PREFIX + key] = value;
    });
    return true;
  } catch (e) {
    notice(`Could not save setting: ${e.message}`);
    return false;
  }
}

// Several keys land as one edit, so a mode change and its direction reset are a
// single write and a single re-render rather than two of each.
function writeSetting(app, dv, key, value, notice) {
  return writeSettings(app, dv, { [key]: value }, notice);
}

/*
 * Per-project menu: set lifecycle status, and hand archiving off.
 *
 * Status is a single frontmatter field on the project's landing page, exactly
 * what `/project <wiki> status <slug> <new-status>` writes, so the board can
 * own it safely and reversibly.
 *
 * Archiving is not offered as a button. In this wiki it means moving the
 * folder to _old/, rewriting wikilinks, and editing three index lists whose
 * entries carry hand-written prose ("dormant (product live; knowledge in
 * [[...]])"). A button can move the line but cannot write the annotation that
 * makes those indexes worth having, and a half-applied archive leaves the wiki
 * inconsistent. The plugin command is interactive for that reason, so the menu
 * surfaces the command instead of imitating it.
 */
/*
 * One pill per declared flag. Two states, and the click flips it.
 *
 * Rendered in the column header rather than buried in the ⋯ menu, because the
 * point of putting a frontmatter flag on the board is that its state is visible
 * without opening anything.
 */
function renderFlagPill(column, flag, app, notice, refresh) {
  const on = column.flags[flag.field] === true;

  const btn = document.createElement("button");
  btn.className = `wkb-flag wkb-flag--${on ? "on" : "off"}`;
  btn.textContent = flag.glyph;

  // Colour never carries the state on its own, so the pill also says it in
  // words, in the config's own vocabulary where the config supplies one.
  const detail = on ? flag.onHint : flag.offHint;
  const explain =
    `${flag.label} is ${on ? "on" : "off"} for ${column.slug}.` +
    (detail ? ` ${detail}` : "") +
    ` Click to turn it ${on ? "off" : "on"}.`;
  btn.title = explain;
  btn.setAttribute("aria-label", explain);
  btn.setAttribute("aria-pressed", String(on));

  btn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    btn.disabled = true;
    if (await setProjectFlag(app, column, flag, !on, notice)) await refresh();
    else btn.disabled = false;
  });
  return btn;
}

/*
 * Deliberately does not stamp last_activity, unlike setProjectStatus, and that
 * holds for every flag with no per-flag opt-out. Flipping a flag is not work on
 * the project, and last_activity feeds both the board's activity sort and
 * whatever consumes the flag downstream: pressing a pill must never make a
 * dormant project look alive.
 *
 * Off writes an explicit false rather than deleting the key, so a no stays
 * readable in the frontmatter instead of looking like a question never asked.
 */
async function setProjectFlag(app, column, flag, value, notice) {
  if (!column.path) {
    notice(`${column.slug} has no landing page to write to.`);
    return false;
  }
  const file = app.vault.getAbstractFileByPath(column.path);
  if (!file) {
    notice(`Cannot find ${column.path}.`);
    return false;
  }
  try {
    await app.fileManager.processFrontMatter(file, (fm) => {
      fm[flag.field] = value;
    });
  } catch (e) {
    notice(`Could not update ${column.slug}: ${e.message}`);
    return false;
  }
  notice(`${flag.label} is now ${value ? "on" : "off"} for ${column.slug}.`);
  return true;
}

/*
 * The statuses the column menu offers: the documented lifecycle states, plus
 * any status this wiki treats as column-eligible that is not one of them.
 *
 * The second half is what stops a menu lying. A wiki may earn columns with a
 * status of its own, and a project in one then had a menu offering four states
 * with none of them marked, which reads as "this project is in no state at
 * all", and left choosing one of the four as the only way out of a status that
 * was legitimate. Extras are appended rather than sorted into place: their
 * position in a lifecycle is the wiki's business, not this component's.
 */
function menuStatuses(wiki) {
  const extra = [...new Set((wiki && wiki.columnStatuses) || [])].filter(
    (s) => !SHARED.projectStatuses.includes(s)
  );
  return [...SHARED.projectStatuses, ...extra];
}

function renderColumnMenu(column, wiki, flags, app, notice, refresh) {
  const menu = document.createElement("details");
  menu.className = "wkb-menu";

  const summary = document.createElement("summary");
  summary.className = "wkb-menu__button";
  summary.setAttribute("aria-label", `Manage ${column.slug}`);
  summary.textContent = "⋯";
  menu.appendChild(summary);

  const body = document.createElement("div");
  body.className = "wkb-menu__body";

  const head = document.createElement("div");
  head.className = "wkb-menu__head";
  head.textContent = "Set status";
  body.appendChild(head);

  for (const status of menuStatuses(wiki)) {
    const item = document.createElement("button");
    const current = (column.status || SHARED.defaultStatus) === status;
    item.className = "wkb-menu__item" + (current ? " is-current" : "");
    item.textContent = status;
    item.disabled = current;
    item.addEventListener("click", async (ev) => {
      ev.preventDefault();
      item.disabled = true;
      if (await setProjectStatus(app, column, status, notice, wiki)) await refresh();
      else item.disabled = false;
    });
    body.appendChild(item);
  }

  // The header pill is the switch. This block is the labelled version, one
  // section per flag, so a pill is discoverable and its state readable in words
  // rather than only as a colour.
  for (const flag of flags) {
    const on = column.flags[flag.field] === true;
    const box = document.createElement("div");
    box.className = "wkb-menu__flag";

    const boxHead = document.createElement("div");
    boxHead.className = "wkb-menu__head";
    boxHead.textContent = flag.label;
    box.appendChild(boxHead);

    // The config's own words for what the current state means. A flag that
    // declares none still gets its label and its two choices.
    const detail = on ? flag.onHint : flag.offHint;
    if (detail) {
      const hint = document.createElement("div");
      hint.className = "wkb-menu__hint";
      hint.textContent = `${on ? "On" : "Off"}. ${detail}`;
      box.appendChild(hint);
    }

    for (const choice of [true, false]) {
      const item = document.createElement("button");
      // Its own class, not wkb-menu__item: that one means "a lifecycle status"
      // to anything selecting inside the menu, and widening it to mean "any
      // button in the menu" makes the status section uncountable.
      item.className = "wkb-menu__choice" + (on === choice ? " is-current" : "");
      item.textContent = choice ? "On" : "Off";
      item.disabled = on === choice;
      item.addEventListener("click", async (ev) => {
        ev.preventDefault();
        item.disabled = true;
        if (await setProjectFlag(app, column, flag, choice, notice)) await refresh();
        else item.disabled = false;
      });
      box.appendChild(item);
    }
    body.appendChild(box);
  }

  const archive = document.createElement("div");
  archive.className = "wkb-menu__archive";
  const label = document.createElement("div");
  label.className = "wkb-menu__head";
  label.textContent = "Archive";
  archive.appendChild(label);

  const hint = document.createElement("div");
  hint.className = "wkb-menu__hint";
  hint.textContent = "Moves the folder and rewrites the indexes. Run:";
  archive.appendChild(hint);

  const cmd = `/project ${wiki.slug} archive ${column.slug}`;
  const code = document.createElement("code");
  code.className = "wkb-menu__cmd";
  code.textContent = cmd;
  archive.appendChild(code);

  const copy = document.createElement("button");
  copy.className = "wkb-menu__copy";
  copy.textContent = "Copy";
  copy.addEventListener("click", async (ev) => {
    ev.preventDefault();
    try {
      await navigator.clipboard.writeText(cmd);
      copy.textContent = "Copied";
    } catch (e) {
      // Clipboard can be unavailable; the command stays selectable on screen.
      notice(`Copy failed. Command: ${cmd}`);
    }
  });
  archive.appendChild(copy);

  body.appendChild(archive);
  menu.appendChild(body);
  return menu;
}

async function setProjectStatus(app, column, status, notice, wiki) {
  if (!column.path) {
    notice(`${column.slug} has no landing page to write to.`);
    return false;
  }
  const file = app.vault.getAbstractFileByPath(column.path);
  if (!file) {
    notice(`Cannot find ${column.path}.`);
    return false;
  }
  try {
    await app.fileManager.processFrontMatter(file, (fm) => {
      fm.status = status;
      fm.last_activity = todayISO();
    });
  } catch (e) {
    notice(`Could not update ${column.slug}: ${e.message}`);
    return false;
  }
  // Say it out loud: a status outside columnStatuses removes the column, and a
  // silent disappearance reads as a bug. Tested against the wiki's own list
  // rather than a single literal, since more than one status can keep a column.
  const keeps = new Set((wiki && wiki.columnStatuses) || []);
  notice(
    keeps.has(status)
      ? `${column.slug} set to ${status}.`
      : `${column.slug} set to ${status}, removed from the board.`
  );
  return true;
}

async function resetSettings(app, dv, notice) {
  const file = dashboardFile(app, dv);
  if (!file) {
    notice("Cannot find the dashboard note to reset settings in.");
    return false;
  }
  try {
    await app.fileManager.processFrontMatter(file, (fm) => {
      for (const spec of SETTINGS) delete fm[SETTING_PREFIX + spec.key];
    });
    return true;
  } catch (e) {
    notice(`Could not reset settings: ${e.message}`);
    return false;
  }
}

// Phone only: a name plus a dot per column, tracking horizontal scroll.
function renderPositionStrip(board, columns) {
  const strip = document.createElement("div");
  strip.className = "wkb-strip";

  const label = document.createElement("span");
  label.className = "wkb-strip__label";
  label.textContent = columns[0] ? columns[0].slug : "";
  strip.appendChild(label);

  const dots = document.createElement("span");
  dots.className = "wkb-strip__dots";
  columns.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "wkb-dot" + (i === 0 ? " is-active" : "");
    dots.appendChild(dot);
  });
  strip.appendChild(dots);

  board.addEventListener(
    "scroll",
    () => {
      const first = board.querySelector(".wkb-col");
      if (!first) return;
      const step = first.getBoundingClientRect().width + 12;
      const i = Math.min(columns.length - 1, Math.max(0, Math.round(board.scrollLeft / step)));
      label.textContent = columns[i].slug;
      dots.querySelectorAll(".wkb-dot").forEach((d, j) => d.classList.toggle("is-active", j === i));
    },
    { passive: true }
  );

  return strip;
}

/*
 * `Notice` is not a dependable global inside Dataview's JS sandbox; it
 * normally comes from require("obsidian"), which may not be reachable. Try
 * both, and fall back to an inline banner so a failed write is never silent.
 */
function makeNotifier(container) {
  return (msg) => {
    try {
      const Ctor =
        typeof Notice !== "undefined"
          ? Notice
          : typeof require === "function"
          ? require("obsidian").Notice
          : null;
      if (Ctor) return void new Ctor(msg);
    } catch (e) {
      /* fall through to the banner */
    }
    console.warn("[wkb-board]", msg);
    let banner = container.querySelector(".wkb-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.className = "wkb-banner";
      container.prepend(banner);
    }
    banner.textContent = msg;
  };
}

async function render(dv, container, app) {
  const notice = makeNotifier(container);
  const today = todayISO();

  const file = dashboardFile(app, dv);
  const fm = file ? app.metadataCache.getFileCache(file)?.frontmatter : null;
  const wiki = resolveWiki(fm, file ? file.path : "");

  // Build the new board detached and swap it in at the end, rather than
  // emptying the container up front. collectTasks below walks the whole wiki,
  // so clearing first leaves the note blank for the length of that walk and
  // every refresh reads as a flash. The old board now stays on screen until
  // the new one is ready to replace it.
  const staged = [];
  const swapIn = () => {
    container.empty ? container.empty() : (container.innerHTML = "");
    for (const node of staged) container.appendChild(node);
  };

  const style = await loadStylesheet(app);
  if (style) staged.push(style);

  // No wiki, no board. Guessing one would render another wiki's tasks under
  // this note's settings, so say what is missing instead.
  if (!wiki) {
    const warn = document.createElement("div");
    warn.className = "wkb-banner";
    warn.textContent =
      `Board cannot tell which wiki it belongs to. Add "board_wiki: ` +
      `${Object.keys(WIKIS).join(" or ")}" to this note's frontmatter.`;
    staged.push(warn);
    swapIn();
    return;
  }

  const s = resolveSettings(fm, wiki);
  const search = searchState(wiki);
  const query = search.query.trim();

  const [tasks, projects] = await Promise.all([collectTasks(dv, app, s), collectProjects(app, wiki, s.flags)]);
  const people = peopleTargets(app, wiki);
  const columns = buildColumns(tasks, projects, today, s, wiki, query);
  const visible = columns.filter((c) => !c.hidden);
  const hiddenUnassigned = columns.filter((c) => c.hidden).reduce((n, c) => n + c.openCount, 0);

  const wrap = document.createElement("div");
  // The wiki identity rides on the root as a scope class rather than in the
  // prefix, so every structural rule in view.css is written once and shared,
  // and per-wiki looks live in the same file behind `.wkb-wrap.is-<slug>`.
  wrap.className =
    `wkb-wrap is-${wiki.slug}` + (s.compact ? " wkb-wrap--compact" : "");
  wrap.style.setProperty("--wkb-col-width", `${s.column_width}px`);

  if (!style) {
    const warn = document.createElement("div");
    warn.className = "wkb-banner";
    warn.textContent =
      "Stylesheet not found. view.css must sit next to view.js, or " +
      "SHARED.componentFolder must name the folder holding them. " +
      "The board will render unstyled.";
    wrap.appendChild(warn);
  }

  // A dropped flag has to say so. A pill that silently never appears looks
  // exactly like a board that declared none, and the frontmatter is the last
  // place anyone thinks to look.
  for (const problem of s.flagProblems) {
    const warn = document.createElement("div");
    warn.className = "wkb-banner";
    warn.textContent = `Flag not rendered: ${problem}.`;
    wrap.appendChild(warn);
  }

  const board = document.createElement("div");
  board.className = "wkb-board";

  // Keep the remembered position current as the user scrolls, rather than
  // reading it off the old board at teardown: Dataview rebuilds the block by
  // itself after a sync and never gives this function the chance to look.
  const scroll = boardScrollState(wiki);
  board.addEventListener("scroll", () => (scroll.left = board.scrollLeft), { passive: true });

  // Same for the note pane's vertical position, with two differences that
  // matter.
  //
  // First, the board element is new every render, so its listener is thrown
  // away with it, but the pane outlives every rebuild. Attaching per render
  // would leave one more listener on it each time a task is ticked, so the
  // pane is attached once and re-attached only when the note has moved to a
  // different one.
  //
  // Second, the teardown fires this listener. Dataview clears the block and
  // only then re-runs it, so the pane paints with no board in it, collapses to
  // its own height, and the browser clamps scrollTop to the vanished maximum
  // and reports it as a scroll. Measured in Chromium: one event, value 0,
  // arriving after the position we want to restore. Recording it would
  // overwrite the answer with the symptom, so a scroll is only trusted while
  // the pane can actually scroll. With the board gone a board note is short
  // enough that scrollHeight equals clientHeight and the teardown event is
  // rejected; a user scroll always has room to spare.
  const pane = findScroller(container);
  if (pane && scroll.el !== pane) {
    if (scroll.el && scroll.handler) scroll.el.removeEventListener("scroll", scroll.handler);
    scroll.handler = () => {
      if (pane.scrollHeight - pane.clientHeight < 1) return;
      scroll.top = pane.scrollTop;
    };
    pane.addEventListener("scroll", scroll.handler, { passive: true });
    scroll.el = pane;
  }

  // The project columns in current visual order. Both the reorder arrows and the
  // seed written when switching to manual mode read this, so what you see is
  // exactly what gets persisted.
  const order = visible.filter((c) => !c.unassigned).map((c) => c.slug);

  const refresh = () => render(dv, container, app);
  for (const column of visible) {
    board.appendChild(renderColumn(column, wiki, people, today, app, dv, notice, refresh, s, order));
  }

  // A query that matches nothing empties every column; say so, or the blank
  // board reads as lost data.
  if (query && visible.every((c) => c.lanes.length === 0)) {
    const none = document.createElement("div");
    none.className = "wkb-nomatch";
    none.textContent = `No tasks match "${query}".`;
    board.appendChild(none);
  }

  wrap.appendChild(renderSettingsPanel(wiki, s, hiddenUnassigned, app, dv, notice, refresh));
  wrap.appendChild(renderToolbar(wiki, s, order, app, dv, notice, refresh, search));
  wrap.appendChild(renderPositionStrip(board, visible));
  wrap.appendChild(board);
  staged.push(wrap);
  swapIn();

  // Put back what the rebuild threw away: both scroll positions, and focus with
  // the caret at the end of the query. Scroll is set after the swap because a
  // detached element has no scrollable extent to set it on, and the pane's own
  // maximum only grows back once the new board is in the document, so writing
  // scrollTop any earlier would be clamped straight back to zero.
  board.scrollLeft = scroll.left;
  if (pane) pane.scrollTop = scroll.top;
  if (search.focused) {
    const box = wrap.querySelector(".wkb-toolbar__filter");
    if (box) {
      box.focus();
      box.setSelectionRange(box.value.length, box.value.length);
    }
  }

  // Same for the flag editor, which commits on blur and so re-renders between
  // one field and the next. Without this, editing a flag means clicking back
  // into the panel for every field.
  const flagFocus = flagFocusState();
  if (flagFocus.key !== null) {
    const block = wrap.querySelectorAll(".wkb-settings__flag")[flagFocus.index];
    const row = block ? block.querySelectorAll(`.wkb-set--flag-${flagFocus.key}`)[0] : null;
    const input = row ? row.querySelector("input") : null;
    flagFocus.index = null;
    flagFocus.key = null;
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}

/* ----------------------------------------------------------- entry point */

if (typeof dv !== "undefined") {
  render(dv, dv.container, app).catch((err) => {
    console.error("[wkb-board]", err);
    dv.paragraph(`Board failed to render: ${err.message}`);
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    WIKIS,
    SHARED,
    resolveWiki,
    E,
    inScope,
    extractTasks,
    parseTaskLine,
    cleanDescription,
    leadingTags,
    resolveProjects,
    routeProjects,
    compareTasks,
    compareDone,
    fuzzyMatch,
    taskMatchesQuery,
    buildColumns,
    makeColumn,
    formatDate,
    dueClass,
    daysBetween,
    completeLine,
    applyCompletion,
    STATUSES,
    menuStatuses,
    renderStatusMenu,
    setStatusLine,
    applyStatus,
    render,
    inScope,
    SETTINGS,
    SETTING_PREFIX,
    resolveSettings,
    coerceSetting,
    ORDER_MODES,
    effectiveDir,
    sortColumns,
    resolveManualOrder,
    addTaskTarget,
    seedTaskLine,
    stampCreated,
    insertTaskLine,
    resolveTemplateDates,
    shiftISO,
    flagValue,
    resolveFlags,
    flagEntry,
    FLAG_KEY,
    FLAG_FIELDS,
    RESERVED_FLAG_FIELDS,
  };
}
