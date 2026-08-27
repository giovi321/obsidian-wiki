---
title: Project board design
summary: "Design notes for the kanban board: one column per project, tasks split into status lanes, eight column-order modes, from one DataviewJS view serving any number of wikis."
type: design-spec
---

# Project board design

**One horizontally scrolling kanban, with a column per project sourced automatically from a wiki's projects folder, tasks split into status lanes, and a visible sort control over eight column-order modes.** It is built as a DataviewJS view stored inside the vault rather than as an Obsidian plugin, so it syncs to every device as ordinary notes.

One component serves any number of wikis. Everything wiki-specific is a `WIKIS` entry in `view.js`; nothing about a wiki's folder layout is baked into the code.

This file records why each decision went the way it did, and the traps found while building it. Read it before changing `view.js`. `README.md` is the install and usage guide; this is the reasoning behind it.

## Decisions taken

| Question | Decision |
|---|---|
| Interactivity | Checkbox toggle, a right-click status menu on the card, an add-task button per column, and the native Tasks edit modal. No drag and drop |
| Board width | All column-eligible projects as columns, horizontal scroll |
| Lane split | Status lanes (In progress, Open, Done recently), date as sort key |
| Column order | Eight modes with a direction toggle, from a visible toolbar. Open-task count descending by default |
| Tasks with no project link | Unassigned column, first and pinned by default. Both settable |
| Other dashboard content | None. Pure kanban, no triage band, no projects table, no Plaud list |
| Implementation | DataviewJS view (`dv.view`), not a custom Obsidian plugin |
| Serving two wikis | One component; per-wiki structure in a `WIKIS` table, wiki named by `board_wiki` frontmatter |
| Per-wiki styling | One stylesheet, one class prefix, wiki identity as an `is-<slug>` scope class on the board root |
| Phone layout | Scroll-snap carousel at 88% of the container per column, Unassigned first but never pinned |
| Display configuration | 20 settings, stored as `board_*` frontmatter keys |
| Project lifecycle | Status changes from a per-column menu, project pages only. Archiving hands off to `/project` |
| Task status | All four parseable statuses, from a right-click menu on the card's checkbox, acting on the task's own line rather than the editor cursor |
| New tasks | The Tasks plugin's own modal via `apiV1`, filed per the wiki's own convention: journal on the demo wiki, project page on Personal |

## Why not a plugin

LiveSync is configured with `syncInternalFiles: false` and `usePluginSync: false`, so `.obsidian/` does not travel between devices. A custom plugin would need manual installation and manual reinstallation on every device on every iteration. A DataviewJS view stored under `_service/` syncs for free. The cost is enabling Dataview's JavaScript Queries once per device.

The same reasoning rules out a `.obsidian/snippets/` CSS file: the stylesheet has to live inside the synced tree. It sits next to `view.js` and is loaded explicitly by the script, not by `dv.view`. See the stylesheet-loading note under Styling for why that distinction is load-bearing.

## Files

The component is a folder you copy into a vault. Put it outside any single wiki
if more than one wiki will use it: editing one `view.css` then changes every
board.

| Path | Role |
|---|---|
| `view.js` | Per-wiki config, parse, discover, route, sort, render, write-back, add task, card status menu, settings, toolbar, project menu |
| `view.css` | Layout and card styling for every board, plus the per-wiki scope blocks |
| `test-board.mjs` | Node harness for the pure logic. Not loaded by Obsidian |
| `test-render.mjs` | Node harness for the render path, using a DOM and `app` shim |
| `DESIGN.md` | This file |
| `README.md` | Install and usage |
| `demo/` | An invented wiki the harnesses run against. Not loaded by Obsidian |

A board note is an ordinary vault note. Its body is one block:

    ```dataviewjs
    await dv.view("<folder holding view.js>")
    ```

The path is vault-relative, not wiki-relative, so it is the same in every board
note whatever wiki the note belongs to. Its frontmatter carries `board_wiki`,
`cssclasses: [wkb-board-page]`, and any `board_*` display settings.

The board is a second dashboard, not a replacement for whatever else a wiki has.
Nothing here writes to a wiki's other dashboards.

## Per-wiki configuration

Two objects, both in `view.js`. `SHARED` holds what does not vary: where the
component's own files live, the archive folder name, and the four lifecycle
states offered in the column menu. `WIKIS` holds one entry per wiki, keyed by the
slug a board note names in `board_wiki`.

Folder names are configuration, not constants, because they are whatever a
wiki's own `wiki-config.md` declares. A field that describes a wiki's *shape*
belongs here; a field that describes how a board *looks* belongs in the board
note's frontmatter, as a `board_*` key. That split is the reason two boards on
one wiki can look different while agreeing on what a task is.

| Field | Meaning |
|---|---|
| `slug` | Key in the table, and the value a board note puts in `board_wiki` |
| `label` | Display name, used in messages |
| `root` | The wiki root, vault-relative. Also what a board note's path is matched against when `board_wiki` is absent |
| `projectsFolder` | Where projects live |
| `projectDepth` | `1` for `<projectsFolder>/<slug>/<slug>.md`. `2` to additionally read a level of category folders, each with its own landing page carrying tasks, and to allow flat projects as `<category>/<slug>.md` |
| `peopleFolder` | Every page here is read as an assignee. `null` for a single-user wiki |
| `columnStatuses` | Which project lifecycle statuses earn a column |
| `newTask` | Where the add button writes. See **Adding a task** |
| `settingDefaults.include_folders` | The tree the board searches |
| `settingDefaults.exclude_folders` | Folders inside it holding checkbox lines that are not project tasks |

`columnStatuses` is per wiki because a wiki may use statuses beyond the four in
`SHARED.projectStatuses`. A status a project actually carries but the wiki does
not list here silently removes that project's tasks from the board. That is the
worst failure this component has, because nothing is broken and nothing is said;
work simply stops appearing. It is the first thing to check when a column goes
missing.

`peopleFolder: null` means the assignee set is empty, so nothing is ever read as
an assignee, no byline renders, and nothing is stripped from a description for
one. The Assignees chip setting stays visible on such a board and does nothing,
which is inert rather than wrong.

Scope defaults live on the wiki rather than in `SETTINGS`, because they describe
the wiki's shape rather than a display preference. The two Scope specs therefore
carry `def: null` and `resolveSettings(frontmatter, wiki)` layers
`wiki.settingDefaults` over them. Clearing the include field falls back to *that
wiki's* default, never to no filter at all: an empty include would mean "search
nothing", which is never what anyone meant. Clearing the exclude field is
honoured as given, because "exclude nothing" is a coherent choice.

`exclude_folders` is the setting to get right before any other. Any folder
holding checkbox lines that are not project tasks belongs in it: meeting
transcripts, imported checklists, reading lists, shopping lists. A folder of
transcripts can hold an order of magnitude more checkbox lines than a wiki has
real tasks. Including it does not break the board. It buries every real task
under the triage column, and nothing on screen says that is what happened.

### Resolving the wiki

`resolveWiki(frontmatter, notePath)`: explicit `board_wiki` wins; otherwise the note's own path is matched against each wiki's root. Inference means a board note that predates the key still renders, and a new note in either wiki works before anyone remembers to set it.

An unresolvable wiki, from a typo or a note outside both roots, renders a banner naming the valid slugs. It does not guess. Guessing would render one wiki's tasks under another's settings, which is worse than rendering nothing.

## Scope of tasks

Scope is a setting, not a constant, and its defaults are per wiki, as above. A markdown file is in scope when it matches an include folder and no exclude folder, matched on path segments. Details under Settings, Scope.

## Parsing

Dataview is used only to enumerate in-scope files and to trigger re-render when the index updates. Task text is parsed from the raw file content, not from Dataview's `task.text`, because Dataview strips recognised emoji shorthand from that field and its behaviour varies by version.

Procedure:

1. `dv.pages()` filtered by the scope rules above
2. For each page, `await app.vault.cachedRead(file)`
3. Split on newline and track fenced-code-block state, toggling on any line matching `/^\s*(```|~~~)/`. Lines inside a fence are skipped
4. Match each remaining line against `/^(\s*)- \[([ x\/\-])\] (.*)$/`
5. Parse the captured body

Step 3 is not optional. `wiki-config.md` documents the task syntax with a worked example inside a fenced block:

    - [ ] [[Person]] [[ProjectSlug]] description ➕ YYYY-MM-DD 📅 YYYY-MM-DD 🔼

Without fence tracking this parses as a real open task, resolves to no project, and appears in the Unassigned column forever. Any future documentation page carrying an example task would do the same.

Field extraction from the body, applied in this order:

| Field | Pattern | Notes |
|---|---|---|
| Links | `/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g` | Capture group 1 is the target, before any alias or heading |
| Created | `➕ (\d{4}-\d{2}-\d{2})` | U+2795 |
| Due | `📅 (\d{4}-\d{2}-\d{2})` | U+1F4C5 |
| Done | `✅ (\d{4}-\d{2}-\d{2})` | U+2705 |
| Cancelled | `❌ (\d{4}-\d{2}-\d{2})` | U+274C |
| Start | `🛫 (\d{4}-\d{2}-\d{2})` | U+1F6EB, stripped only |
| Scheduled | `⏳ (\d{4}-\d{2}-\d{2})` | U+23F3, stripped only |
| Recurrence | `🔁 [^➕📅✅❌🛫⏳]*` | U+1F501, stripped only |
| Priority | one of `🔺 ⏫ 🔼 🔽 ⏬` | See mapping below |

Priority mapping, highest to lowest: `🔺` U+1F53A highest, `⏫` U+23EB high, `🔼` U+1F53C medium, absent = normal, `🔽` U+1F53D low, `⏬` U+23EC lowest. Sort weights 5, 4, 3, 2, 1, 0. Both wikis use `⏫`, `🔼` and `🔽`, with `🔼` dominant by a wide margin, which is why the medium chip is not rendered.

The rendered description is the body with every matched date, priority and recurrence token removed, the leading run of dropped tags removed, and whitespace collapsed. Only the leading run: stripping a dropped link from mid-sentence mangles the prose.

The task record is `{ path, line, raw, body, status, links, prio, prioLabel, created, due, done, cancelled, start, scheduled }`, where `raw` is the untouched source line, retained for write-back verification, and `body` is everything after the checkbox.

## Project discovery

Discovery walks the wiki's projects folder to `projectDepth` and returns a landing page per candidate column, each carrying `slug`, `path`, `status`, `lastActivity`, `created` and `kind`.

Depth 1: each child folder of `projectsFolder` is a project, landing at `<slug>/<slug>.md`, `kind: project`.

Depth 2, Personal: inside each category folder `C` of `1_Projects/`,

- `C/C.md`, the category landing, becomes column `C` with `kind: category`
- each `S.md` where `S` is not `C` becomes flat project column `S`
- each subfolder `S` becomes folder project column `S`, landing at `C/S/S.md`

Category landings earn columns because they carry tasks of their own, and a lot of them: `build.md` alone holds 39 open. Excluding them would drop most of the Personal board's content on the floor. That gives 28 columns today, 18 projects and 10 categories.

`kind` is load-bearing, not decoration. A category landing is `type: category` and carries no lifecycle status, so writing `status: dormant` to it would be wrong. The per-column status menu renders only on `kind: project`.

Both scans also run over `_old/`, forced to `status: archived` by location whatever their frontmatter says. The archived set never becomes columns, but it must be known, for the reason in step 3 below.

## Task routing

1. Columns are the slugs whose status is in `wiki.columnStatuses`
2. For each task, intersect the link targets in its **leading run** with the column-eligible slug set, compared on basename, case-insensitive. One match assigns the column; two or more place it in every matching column
3. Zero matches, but at least one leading-run link resolving to a known project with no column (archived, or an ineligible status), drops the task from the board entirely
4. Zero matches of any kind assigns Unassigned

Step 3 exists because Unassigned is a triage inbox whose only useful meaning is "this task names no project". A completed task against an archived project is not something to triage. Found by the render smoke test rather than by reasoning: a task completed against `[[retired-project]]` on 2026-08-05 was landing in Unassigned, since that project lives under `_old/`.

### Why the leading run, not every link

Routing reads `task.lead`, the links before any prose, matching the convention `- [ ] [[Person]] [[project]] description`. A project named inside the sentence is a mention, not a second assignment.

Routing on every link put two Personal tasks in two columns each:

    - [ ] [[website-redesign]] decide whether to retire [[legacy-export]] or keep it active

That showed as outstanding work *on* `legacy-export`, the project the task proposes retiring. The distinction already existed for descriptions, where only the leading run is stripped; routing simply had not been given it.

Measured before changing: zero the demo wiki tasks route differently, and exactly those two Personal tasks are fixed. Both the eligible-slug check and the drop-off check in step 3 read the leading run, so merely mentioning an archived project mid-sentence cannot silently remove a task from triage either.

A task whose leading run genuinely names two projects still appears in both columns. That is the intended behaviour, and the harness asserts every multi-column task names each of its columns in its leading run.

### Assignees

Assignees are the person links (targets resolving to the wiki's `peopleFolder`) in the leading run, before any prose. They are removed from the rendered description and shown as a byline. Person links inside the sentence are mentions and stay inline.

On a wiki with no `peopleFolder`, the set is empty and no link is ever read as an assignee. The Personal wiki is single-user, so its cards carry no byline.

## Lanes

Cancelled tasks (status `-`) are dropped entirely. Both wikis have a substantial number, 42 in the Personal wiki alone, so this is not a rare case.

| Lane | Selector | Sort |
|---|---|---|
| In progress | status `/` | Due ascending; undated after all dated; then created ascending; then priority descending |
| Open | status ` ` | Same |
| Done recently | status `x` and `done` within `board_done_window_days`, default 7 | Completion date descending |

Empty lanes are not rendered. The In progress and Done lanes can each be switched off entirely. Most open tasks have no due date, so creation-date order is the dominant sort in practice; every open task carries a `➕` created date, so the fallback sort key is always present, and tasks missing both sort last.

The `[/]` status is unused in both wikis, so the In progress lane renders nowhere until it starts being used. This is expected, not a fault. The lane is built regardless so it works the day a task is marked in progress.

## Column ordering

1. Unassigned first, pinned with `position: sticky; left: 0` when `board_pin_unassigned` is on. Rendered even at count zero so a filling inbox is visible, unless `board_show_unassigned` is off
2. Project columns sorted by `board_column_order` and `board_column_order_dir`

Open count is In progress plus Open. Done does not count.

### Modes

Each mode in `ORDER_MODES` names one primary key, the direction that reads naturally for it, and how ties break. Ties resolve in their own natural direction whatever the primary direction is, so flipping the sort does not also scramble everything that tied.

| Mode | Key | Natural | Ties |
|---|---|---|---|
| Open task count | open count | descending | last activity, then name |
| Last activity | `last_activity` | descending | name |
| Alphabetical | slug | ascending | name |
| Earliest due date | soonest due among open tasks | ascending | name |
| Highest priority | highest priority among open tasks | descending | open count, then name |
| Longest waiting | oldest `created` among open tasks | ascending | name |
| Project age | landing page `created` | descending | name |
| Manual | explicit slug list | n/a | n/a |

The four task-derived keys (`nextDue`, `topPrio`, `oldestCreated`, and open count) are computed from the open set only. A column's position should reflect outstanding work, not what was finished last week, so a column whose only content is a recent Done card carries no sort keys at all.

### Direction, and what does not flip

`board_column_order_dir` is `auto`, `asc` or `desc`. `auto` means the mode's own natural direction, resolved at use rather than stored: it keeps an existing note rendering as before, and means changing mode never inherits a direction that only made sense for the mode you left. Changing mode from the toolbar writes `auto` alongside the new mode in the same edit, so `alpha` never arrives sorting Z to A because `count` was descending.

Columns with **no value** for the active key are partitioned out and always appended last, in name order, in both directions. Letting them flip would put every empty column first the moment you press descending, which is never what "sort by earliest due date, descending" is asking for.

Absence and zero are different. A column with zero open tasks has a value for the count mode and sorts with everything else; a column with no due date at all has no value for the due mode and goes to the end.

### Manual order

`board_column_order: manual` reads `board_column_manual`, a list of slugs. Slugs that no longer name a column are dropped on read, and columns missing from the list append at the end in name order, so a newly created project is never invisible. Matching is case-insensitive and duplicates collapse.

Switching to manual from another mode writes the current visible order as the seed, in the same edit as the mode change, so the board does not reshuffle to alphabetical the instant you switch.

Reordering is two arrow buttons per column header, shown only in manual mode, disabled at the ends. Each press writes the whole visible order rather than a delta, so the stored list is always complete.

**Not drag and drop.** `.wkb-board` is a horizontal scroll container, where HTML5 drag is awkward on desktop and effectively broken on touch, which is where this board is used most. Buttons behave identically on both and reuse the same 44 by 44 hit area as the card controls.

### Empty columns

A column with no lane to show renders a single muted card reading `no open tasks` with `last activity <D MMM>` beneath. The Unassigned column reads `nothing to triage` instead.

With `board_show_empty_columns` off, columns are filtered on open count, not on whether they have any lane at all. The setting is labelled "projects with no open tasks", so a project whose only content is a recently completed task must go too. Filtering on lane count left those visible and quietly contradicted the label. Under an active search query the rule relaxes to "has any matching task", so searching for something just completed still surfaces its column even though the done lane does not count toward open count.

## Search filter

The toolbar leads with a filter box. Typing narrows every column to the matching tasks; Escape or the native clear button of the `type="search"` input restores the full board. Matching is subsequence-based, case-insensitive, one term per space-separated word, every term required, order-free: `mt sso` matches "Migrate to SSO". It runs against the raw task body, not the cleaned card description, so naming a project or a person finds their tasks through the leading wikilinks. The board filters, it does not rank, so the matcher is a plain boolean.

Filtering happens inside `buildColumns`, before routing and bucketing, not in the DOM: the toolbar and the board cannot disagree on what a match is, and the rule stays in one tested place. A query that matches nothing renders a `No tasks match "…"` line instead of a silently empty board.

The query is session state in `globalThis.__wkbSearch`, keyed by wiki slug, never frontmatter: typing must not write to the note, and two boards side by side must not share one query. Each keystroke re-renders, debounced 150 ms, because the alternative — toggling card visibility in the DOM — would leave column counts, lane heads and empty columns stale. Before the rebuild the handler records focus and horizontal scroll; `render()` restores both afterwards, so typing never loses the caret or the board position.

## Card

Line 1: checkbox, then the description with the *leading run* of tags removed, meaning the project wikilink and the assignee wikilinks that precede the prose. Links appearing inside the sentence stay, clickable, routed through `app.workspace.openLinkText`. Stripping a dropped link from mid-sentence mangled the text: `Check with [[Name]] whether the old export is still used` became "Check with whether the old export is still used".

Line 2, in order, omitting absent parts and anything switched off by a chip setting: due date rendered `due 04 Aug`, coloured red when before today and amber when today; or `created 04 Jul` when there is no due date; priority chip; assignee names; source note name. Priority is shown only for high, highest, low and lowest, never medium: most tasks carry medium, so that chip carried no information.

Compact mode drops the whole meta line, which makes the chip toggles moot. Compact is the blunt instrument, chips the fine one.

Interactions:

- Checkbox tap toggles the task done. The checkbox sits in a 44 by 44 pixel hit area regardless of its visual size, meeting Apple's minimum touch target
- An explicit edit affordance (a small pencil at the card's trailing edge, also in a 44 by 44 hit area) opens the source note at the task line, then executes `obsidian-tasks-plugin:edit-task` to raise the native edit modal

Tapping the card body does nothing. Whole-card tap was rejected because on touch it fights text selection and swallows taps meant for the wikilinks inside the description. Remaining wikilinks in the description stay individually tappable.

## Write-back

Ticking a checkbox, and setting a status from the card menu: both route through
`setStatusLine` and `applyStatus`, so there is one implementation of what a
status change means. Two of the three code paths that modify user notes, the
third being **Adding a task**. All fail closed.

1. `await app.vault.read(file)` (not `cachedRead`)
2. Split on `/\r?\n/`, take `lines[task.line]`
3. If it does not equal `task.raw` exactly, abort, show `new Notice("Task moved or changed, board is stale. Refresh and retry.")`, and return without writing
4. Replace the status character in place: `- [ ]` becomes `- [x]`
5. Append ` ✅ <today>` in `YYYY-MM-DD` unless a `✅` token is already present
6. Rejoin with the file's own dominant terminator, `\r\n` if the original contained any, otherwise `\n`
7. `await app.vault.modify(file, joined)`

Every file in the vault is LF today. Steps 2 and 6 are defensive: parsing must not break if an editor or a sync round-trip introduces CRLF, and a single checkbox tick must not silently rewrite an entire file's line endings, which LiveSync would replicate as a whole-file change.

The checkbox itself still only goes open-to-done, matching the no-drag decision. Every other direction is the card's status menu, below.

## Card status menu

Right-click a card's checkbox. A `<details>` expands inside the card offering the
four statuses; picking one rewrites that task's line in its own file.

**Why this exists.** Right-clicking a checkbox anywhere in Obsidian brings up the
editor context menu, and any Tasks command added to it, by Commander or
otherwise, is an *editor* command. Their shared wrapper reads the line at the
cursor:

    let a = r.getCursor(), o = a.line, l = r.getLine(o), u = n(l, s);

So the command acts on wherever the text cursor was last left, not on the
checkbox that was right-clicked, and its availability check is only
`view instanceof MarkdownView` — it never checks a task is under the cursor. The
item therefore always renders enabled and fails at run time with
`Cannot set status: line is not a task or does not match global filter`. The
mention of a global filter is a red herring; this vault's is empty.

The card already knows the file, the line and the exact raw text, so it needs no
cursor at all. The handler calls `preventDefault()`, which is also what stops the
editor menu, and with it the misfiring command, from appearing over a card.

**The statuses are bounded by the parser, not chosen.** `TASK_RE` reads
`[ ]`, `[/]`, `[x]` and `[-]`; a fifth would be written to the file and the task
would then vanish from the board, because nothing would parse it back. They
happen to be exactly the four the Tasks plugin registers in this vault, core plus
custom, and the names are its names. The harness asserts every offered status
parses back and survives a write-and-re-read, so the menu cannot drift from the
parser.

**One invariant governs the terminal dates.** `✅` belongs to done and `❌` to
cancelled; an open or in-progress task carries neither. Reopening a done task
therefore strips its `✅` rather than leaving a line that claims to be both open
and finished, which is what the Done lane's window would then read. An existing
date of the right kind is kept, so setting done on a done line does not stamp a
second one. `completeLine` is now a call to `setStatusLine(raw, "x", today)`, so
the checkbox and the menu cannot disagree about what completion means.

**Recurring tasks are refused, not completed.** A `🔁` line's next occurrence is
the plugin's job, and a line rewrite here would complete the task and silently
drop the recurrence, which looks like work finished rather than work lost. The
notice points at the pencil, which drives the plugin's own command. There are no
recurring tasks in either wiki today, so this is a guard rather than a feature.
It applies to the checkbox too, which previously would have dropped the
recurrence without saying so.

**Inline, not `Menu`, and not positioned.** `.wkb-board` sets
`overflow-y: hidden`, so an absolutely positioned popover is clipped by the
scroll container — the same constraint that shapes the column menu. And
`require("obsidian")` is treated throughout this file as possibly unreachable,
see `makeNotifier`, so Obsidian's `Menu` is not a dependency this component can
take. The stylesheet lint asserts both: the panel is not positioned, and its
`<summary>` stays `display: none` so the card gains no visible control and
right-click remains the only way in.

**A done card's checkbox is not `disabled`.** It carries `.is-done` and
`aria-disabled` instead, and its click returns early. A disabled button receives
no mouse events in any browser, `contextmenu` included, so disabling it made the
status menu unreachable on exactly the done cards where reopening is the reason
the menu exists. The look is unchanged: `.is-done` and `:disabled` share one
rule, and `:disabled` is now only the transient in-flight state that swallows a
second click. The render harness asserts no resting checkbox is disabled, since
a DOM shim cannot reproduce a browser withholding events.

Cancelled and Todo both make the card move or leave: `buildColumns` drops `-`
tasks entirely and `[x]` to `[ ]` moves the card out of the Done lane. Cancelling
says so in a notice, for the same reason the column status menu does — a card
vanishing silently reads as data loss.

## Adding a task

A `+` in every column header. It opens the **Tasks plugin's own** Create-task
modal through `apiV1.editTaskLineModal(seed)`, which takes a task line, opens
the modal seeded from it, and resolves with the finished line, or with the empty
string when cancelled. Nothing about the task syntax is reimplemented here, so
the due, priority and recurrence pickers behave exactly as they do when editing
a note, and they cannot drift from the plugin's own parser.

The button reuses the 18px visual, 44 by 44 hit-area control rules shared with
the reorder arrows and the toolbar direction flip, so every touch target on the
board behaves the same on the phone. It overrides nothing about that box, not
font-size and not `align-self`. `.wkb-col__head` aligns its children on the
baseline, and a title that wraps contributes its first line's baseline, which is
what keeps the count and the arrows level with the top line. A grid box with a
centred glyph takes its baseline from that glyph, so a font-size of its own
moves the button off the row and `align-self: center` drops it to the middle of
a two-line title. Both were shipped and both were wrong; the stylesheet lint now
asserts the rule declares neither.

**The column is the target selector, not the target.** Pressing it seeds that
column's slug as `- [ ] [[slug]] `, which is what routes the task back to the
column pressed: `routeProjects` reads the leading run of wikilinks. Which *file*
the line lands in is the wiki's business, declared in `WIKIS[slug].newTask`:

| Wiki declares | Column pressed | File written | Heading |
|---|---|---|---|
| `newTask.journalFolder` | any | `<journalFolder>/<today>.md` | `newTask.heading` |
| no `journalFolder` | a project or category | that column's own landing page | `newTask.heading` |
| no `journalFolder` | Unassigned | `newTask.fallbackPath`, seeded with `fallbackSlug` | `newTask.heading` |

Both modes are filing conventions a wiki already has, not preferences invented
here. A wiki whose convention is that tasks live in a daily note and project
pages aggregate them by query wants the first mode, and no column on it should
write to a project page even when a project column was pressed. A wiki whose
project pages hold their own task lists wants the second. Triage is not a project
and has no page of its own, hence the fallback.

Because the the demo wiki write does not go where the pressed column points, the
button's `aria-label` and the notice both name the file. A silent write into the
journal reads as the button having done nothing.

**Insertion** is a pure function on the file's content, so the whole rule is
testable without a vault. Three anchors, tried in order:

1. The named heading. The line goes at the end of that section, after the last
   task already there, so the newest task reads as the newest
2. No such heading, but the file already has task lines. A page that
   keeps its tasks under `## Projects`; opening a second section would split one
   project's tasks across two places in the same note
3. Neither. A new section is opened above the first heading holding a tasks
   query, so literal tasks stay above the aggregate that summarises them, and at
   the end of the body when there is no such heading

Fence-aware for the same reason `extractTasks` is: a checkbox inside a ```tasks
block is a query or a documented example, never an anchor. Line endings are
preserved the same way write-back preserves them.

**The created date is stamped by the board**, as `➕ <today>`, and only when the
returned line carries none. `setCreatedDate` is off in this vault's Tasks
settings, so the modal adds nothing, yet every task already in either wiki has a
`➕` and the "Longest waiting" and "Project age" sort modes read it. The stamp
goes before the first glyph that conventionally follows created, not at end of
line, so the emoji order matches what the plugin emits. A date set by hand in
the modal wins.

**A missing journal is created from the template.** On the first press of a day
`demo/Journal/<today>.md` does not exist yet, and the button must not
fail on that. `resolveTemplateDates` resolves the `{{date}}` family from
`demo/Journal/_template.md`, which is all that template uses. A placeholder it does
not implement is left verbatim rather than blanked: a half-resolved `due before`
silently matches more than it should, a visible `{{date:dddd}}` does not.

The note is created **with the task already in it**, one `vault.create` rather
than a create followed by a modify. Both paths are then identical up to the
final call, and there is no moment where the journal exists without the task
that caused it to be created.

The button fails closed at every step: no `newTask` block for the wiki, no
resolvable file, or no Tasks plugin renders it disabled or refuses with a notice;
a cancelled modal writes nothing and says nothing; and a returned line that is
not a task line is refused before the file is touched, whole rather than in part
when the modal hands back several lines.

## Styling

Class names are prefixed `wkb-`, one prefix for both wikis, to avoid collision with theme and plugin CSS.

- `.wkb-board` flex row, `overflow-x: auto`, `overflow-y: hidden`, `gap: 12px`, `align-items: flex-start`
- `.wkb-col` `flex: 0 0 var(--wkb-col-width)`, set inline from `board_column_width`
- `.wkb-col--unassigned.is-pinned` `position: sticky; left: 0; z-index: 2`, opaque `var(--background-primary)` so columns scroll behind it. The `is-pinned` class is applied only when `board_pin_unassigned` is on
- `.wkb-toolbar*`, `.wkb-moves`, `.wkb-move` for the sort control and the manual reorder arrows
- `.wkb-lane`, `.wkb-card`, `.wkb-meta`, `.wkb-due--late`, `.wkb-due--today`, `.wkb-empty`, `.wkb-settings*`, `.wkb-menu*`
- `.wkb-wrap--compact` hides `.wkb-meta`

### One stylesheet, two wikis

The wiki identity rides on the board root as a scope class, `.wkb-wrap.is-st` or `.wkb-wrap.is-p`, not in the class prefix.

A per-wiki prefix (`st-board`, `p-board`) was considered and rejected: CSS cannot parameterise a prefix, so every one of roughly 200 shared rules would have to list both, and a third wiki would mean editing all of them. With a scope class, every structural rule is written once and per-wiki looks live in the same file:

```css
.wkb-wrap.is-st { --wkb-accent: var(--text-accent) }
.wkb-wrap.is-p  { --wkb-accent: var(--color-green, var(--text-accent)) }
```

The rule is that anything wiki-specific resolves through a token declared in those blocks, so no shared rule ever needs a second selector. A bare `.wkb-wrap` declares the same token as a fallback, so a wiki added without a block of its own renders plain rather than unstyled; it sits after the scoped blocks but loses to them on specificity, not order.

Only identity surfaces take the accent: the Unassigned column border and the active position dot. Interactive colours stay on the theme accent so affordances match the rest of Obsidian.

### Layout constraints

The board sets its own `box-sizing: border-box` for everything under `.wkb-wrap`. Inheriting a content-box host would make the column padding add to the declared width and push each column past its container.

`.wkb-board` clipping on the y axis is why the settings panel and the per-column menu expand inline rather than as absolutely positioned popovers, and why the sort toolbar is a sibling of `.wkb-board` rather than a child. A positioned dropdown would be cut off by the scroll container, and a toolbar inside it would scroll away with the columns.

Colours come from Obsidian CSS variables only (`--background-primary`, `--background-modifier-border`, `--text-muted`, `--text-error`, `--color-orange`), so the board follows the active theme in both light and dark.

### Loading the stylesheet

`view.js` loads `view.css` itself via `app.vault.adapter.read`, and does **not** rely on `dv.view` to do it. Dataview resolves a sibling stylesheet with `metadataCache.getFirstLinkpathDest`, which is wikilink resolution and does not dependably find a `.css` file inside `_service/`, and it injects the result as `<style scope=" ">`, an attribute no current browser implements. The board rendered with no layout at all until this was replaced.

`adapter.read` takes a vault-relative path straight to disk, bypassing the file index, and behaves the same on iOS. `getAbstractFileByPath` plus `cachedRead` is the fallback. When both fail the board renders a visible banner, so a missing stylesheet can never be silent again.

The `cssclasses: [wkb-board-page]` frontmatter scopes a readable-line-width override to this note alone, so the board uses the full pane width without changing global settings.

## Settings

Twenty display, sort and scope settings, stored as flat `board_*` keys in the dashboard note's frontmatter. Defaults live in the `SETTINGS` array in `view.js`, overlaid per wiki by `settingDefaults`; frontmatter only overrides. A note with no `board_*` keys renders exactly as it did before settings existed.

| Key | Group | Type | Default |
|---|---|---|---|
| `board_show_unassigned` | Columns | bool | true |
| `board_pin_unassigned` | Columns | bool | true |
| `board_show_empty_columns` | Columns | bool | true |
| `board_column_width` | Columns | number 180-600 | 280 |
| `board_column_order` | Sort | one of the eight modes | count |
| `board_column_order_dir` | Sort | auto / asc / desc | auto |
| `board_column_manual` | Sort | list of slugs | `[]` |
| `board_chip_assignees` | Chips | bool | true |
| `board_chip_due` | Chips | bool | true |
| `board_chip_created` | Chips | bool | true |
| `board_chip_priority` | Chips | bool | true |
| `board_chip_done` | Chips | bool | true |
| `board_chip_source` | Chips | bool | false |
| `board_lane_in_progress` | Lanes | bool | true |
| `board_lane_done` | Lanes | bool | true |
| `board_done_window_days` | Lanes | number 0-365 | 7 |
| `board_compact` | Density | bool | false |
| `board_include_folders` | Scope | list | per wiki |
| `board_exclude_folders` | Scope | list | per wiki |

`board_wiki` is deliberately **not** in `SETTINGS`. It is structural, not a display preference, and keeping it out means Reset to defaults, which deletes every key in `SETTINGS`, cannot delete the one key the board needs to know what it is.

Values are validated on read, never trusted. An unknown `column_order` falls back to `count`, an unknown direction falls back to the mode's natural one, numbers clamp to their range, non-numeric numbers and unparseable booleans fall back to the default. A typo in the YAML costs one setting, not the board. `resolveSettings` is pure and exported, so all of this is tested directly.

### Where each control lives

The Sort group is rendered by a `.wkb-toolbar` row above the board: a mode select and a direction toggle, plus a hint in manual mode. Column order is the setting reached for most often, so it is one click away rather than behind a disclosure. The settings panel skips the Sort group entirely, so no key has two controls that can disagree. `board_column_manual` has no control at all; it is written by the column arrows. The toolbar also carries the search filter, which is not a setting at all — it is session state, see Search filter.

Everything else is a collapsed `<details>` disclosure above the board, grouped as in the table. Native element: keyboard accessible, works on touch, no custom show/hide code.

Writes go through `app.fileManager.processFrontMatter`, which parses and re-serialises the YAML rather than string-patching it, so a bad edit cannot corrupt the note. `writeSettings` takes several keys at once, so a mode change and its direction reset land as one edit and one re-render rather than two of each. Every change re-renders, and every handler awaits that re-render rather than leaving it in flight.

Panel open state lives in `globalThis.__wkbPanelOpen`, keyed by wiki slug, not in frontmatter: a re-render must not slam the panel shut, merely opening it must not write to the note, and two boards open side by side must not share one flag. `globalThis` rather than `window` because `view.js` also runs under Node in the harness.

Two behaviours worth stating:

- With `board_show_unassigned` off, the inbox column is still built and marked `hidden` rather than dropped, so the panel summary can read "3 unassigned hidden". Hiding is fine; hiding silently is not. The renderer skips hidden columns
- `board_pin_unassigned` controls `position: sticky` via an `is-pinned` class. Below the phone breakpoint the column is never pinned regardless of the setting, for the reasons in the mobile section. The setting is labelled "desktop only" in the panel

### Scope

The include and exclude folder lists are the one pair of structural settings exposed in the UI, as two textareas taking one vault-relative folder per line. A path is in scope when it matches an include folder and no exclude folder. Matching is on path segments, so `demo` does not also swallow a sibling `demo-archive`.

Lists accept a YAML array or a string split on newlines or commas, and entries are normalised by stripping surrounding slashes. Blank entries are dropped. An empty exclude list is honoured, since wanting to scan everything is a legitimate choice. An empty include list is not: it would silently scan the entire vault, which is never what clearing a field means, so it falls back to the default.

The Dataview source is narrowed to the include folders rather than scanning the whole vault, then the full include/exclude test runs per page.

Array defaults are cloned on read. Handing back the shared default array let any caller that mutated its settings corrupt the default for every later call in the session.

Still not exposed: the projects folder, its depth, the people folder, and the column-eligible statuses. Those define what a board *is* for a given wiki, not how it looks, and belong in `WIKIS`.

## Project management

Each project column carries a `⋯` menu with the four lifecycle states from `wiki-config.md`: active, dormant, completed, abandoned. Choosing one writes `status` and `last_activity` to that project's landing page via `processFrontMatter`, which is exactly what `/project <wiki> status <slug> <new-status>` does, with the slug taken from the column's own wiki. The current state is marked and disabled. Since columns are the projects whose status is column-eligible, anything else removes the column immediately, so the notice says so rather than letting it vanish silently.

Category columns carry no menu. A category landing is `type: category` with no lifecycle status, so offering to set one would write a field that means nothing there. This is gated on the column's `kind`, and the render harness asserts no category column renders a menu.

The menu expands inline, not as an absolute dropdown: `.wkb-board` sets `overflow-y: hidden`, so a positioned popover would be clipped by the scroll container. It takes a full row of the wrapped column header when open.

**Archiving is deliberately not a button.** In a wiki of this shape it means moving the folder to `_old/`, rewriting wikilinks vault-wide, and editing three index lists (the projects index, `_old/_old.md`, `index.md`) plus a log entry. `fileManager.renameFile` would handle the move and the wikilinks, and the list edits are mechanical, but the entries carry hand-written prose:

    - [[legacy-export]] — dormant (still deployed; superseded by [[api-migration]])

A button can move that line but cannot write the annotation, which is the part that makes the index worth having. A half-applied archive also leaves the wiki inconsistent across four files. The plugin's `/project archive` is interactive for exactly these reasons, so the menu surfaces the command with a copy button instead of imitating it. The render harness asserts no menu item matches `/archive|delete|move/`, so this boundary cannot erode by accident.

## Mobile and iOS

Dataview 0.5.68, Tasks 8.3.0 and Folder Notes all declare `isDesktopOnly: false`, so the stack runs on iOS Obsidian. The risks are layout and touch, not availability.

One breakpoint at 600px. Above it, the desktop layout described above. Below it, phone layout.

Phone layout:

- `.wkb-col` becomes `flex-basis: 88%`, so one column fills the screen with a peek of the next signalling that the board scrolls. Percent of the container, never `vw`: the board sits inside the note's content area, which is narrower than the viewport by the note margins, and sizing against the viewport clipped every column
- `.wkb-board` gets `scroll-snap-type: x mandatory` and each column `scroll-snap-align: start`, so swiping lands cleanly on a column instead of stopping mid-gutter
- The Unassigned column keeps its first position but drops `position: sticky`. Pinning a 280px column on a 390pt screen would leave nothing for the board. This is a deliberate departure from the desktop behaviour
- A position strip above the board shows the current column name and a dot per column, driven by a `scroll` listener reading `scrollLeft` against column width
- `.wkb-board` gets `touch-action: pan-x` and `overscroll-behavior-x: contain` so horizontal swipes do not leak into the note's vertical scroll or trigger back-navigation

iOS-specific care:

- `position: sticky` inside a horizontal scroller is supported on modern iOS but flickers against momentum scrolling. Sticky is therefore only applied above the breakpoint, where the desktop and iPad cases live. The phone case avoids the bug entirely rather than working around it
- Do not set `-webkit-overflow-scrolling`. It is deprecated and interacts badly with sticky
- All interactive elements get `-webkit-tap-highlight-color: transparent` and an explicit `:active` state, since iOS otherwise paints a grey box over the whole card
- Card text gets `-webkit-user-select: text` so long-press selection still works where it is wanted

The 44 by 44 hit areas on the checkbox and edit affordance apply at all widths, not just phone. Oversized hit areas cost nothing on desktop and prevent two distinct mis-tap classes on touch.

Verification on iOS cannot be automated from this machine. It is a manual checklist, run on the actual iPhone after implementation: board renders, swipe snaps one column at a time, the position strip tracks, vertical note scroll still works, a checkbox tap marks the source line done in correct Tasks format, the pencil raises the Tasks edit modal, and no grey tap-highlight boxes appear.

## Verification

`view.js` guards its entry point with `if (typeof dv !== "undefined")` and exports its pure functions under `if (typeof module !== "undefined")`. Obsidian's DataviewJS context defines `dv` and not `module`; Node defines the reverse. The same file is therefore both the view and the unit under test, with no duplicated logic.

Two harnesses, both requiring the same `view.js` Obsidian loads, and both running every assertion against **every wiki** by default:

```
node test-board.mjs
node test-render.mjs
```

Add `--wiki st`, `--wiki p` or `--wiki both` to narrow the run. An unknown slug exits 2 rather than silently testing nothing.

`test-board.mjs` covers the pure logic: parsing, scope, discovery, routing, sorting, settings resolution, write-back. `test-render.mjs` covers the render path with a hand-rolled DOM shim and a stubbed Obsidian `app`, one per wiki. Its `vault.modify` throws by construction and its `processFrontMatter` only mutates an in-memory object, so neither harness can write to the vault by mistake. The add-task tests are the one exception, and an explicit one: they swap `modify` and `create` for recorders so the write target and the exact content can be asserted, then put the originals back. What the button would have written is checked; nothing is written.

Both harnesses mirror discovery independently: `test-board.mjs` against the filesystem, `test-render.mjs` against its own tree. A divergence between either mirror and the view shows up as a failing count rather than as a silently wrong board.

**Assert invariants, not counts.** These run against a live vault that changes every time a task is added or ticked, so hardcoded totals fail for reasons that have nothing to do with the code. The counts are printed as information. The assertions are properties that hold at any vault state, for any wiki:

- Every open task routes exactly one way: a column-eligible project, dropped for naming an ineligible one, or Unassigned
- The Unassigned column holds precisely the open tasks whose leading run names no project
- Project columns hold precisely the routed open placements, where a task naming two projects counts twice
- No task appears in more columns than its leading run names
- Every column-eligible project has a column and no archived project does
- Cancelled tasks never reach a column
- Every sort mode is a permutation of the same column set, nothing lost or duplicated
- Unassigned is first in every mode and direction
- Columns with no value for the active key stay last in both directions
- Rendered columns, cards, empty states and strip dots all match the model
- Settings never change the open-task set, only its presentation

Regression guards that must not be relaxed:

- The example tasks inside fenced blocks in `wiki-config.md` and `Task syntax.md` must not appear in any column. Without fence tracking they do, as Unassigned. Both directions are asserted: fenced lines are skipped, and the same line outside a fence parses
- Nothing from any folder the wiki excludes may appear, asserted per excluded folder rather than by name. Typically that is `demo/Archive`'s 550 transcript checkbox lines against roughly two dozen real tasks; on Personal it is `demo/Archive`' 103 checklist lines. A scope regression is a twentyfold blowout, not a subtle one
- A task naming only an archived project leaves the board and does not reach Unassigned, while a task naming no project at all still does. Fixing one by breaking the other is the obvious failure mode
- A mid-sentence project mention must not add a column
- Card descriptions must carry actual content, tested as at least one letter or digit. A shim regression once blanked every description while leaving the element in place, and the preview looked plausible. This was a three-word minimum until real data broke it: `12-factor-agents (GitHub)` is a complete two-word task
- No `.wkb-menu__item` may match `archive|delete|move`, so the deliberate boundary against destructive project operations cannot erode
- No category column may render a status menu
- The add-task button must never write without a returned task line. A missing
  Tasks plugin, a cancelled modal and a non-task return are each asserted to
  leave the vault untouched, and a batch containing one bad line is refused
  whole rather than in part
- The seed the modal receives must parse as a leading tag, so a task added from
  a column routes back to that column. Asserted through `leadingTags` and
  `routeProjects` rather than by string comparison alone
- No placeholder may survive `resolveTemplateDates` against the real journal
  template, and an unimplemented token must be left verbatim rather than
  blanked. A blanked `due before` widens what that query matches, silently
- `view.css` must contain no viewport units. Sizing a column in `vw` measures the viewport rather than the note's content area and clipped every column on phone
- Neither `view.css` nor `view.js` may contain the old `stb-` prefix, and every wiki must have a scope block. The prefix guard assembles its search string from pieces, because written as a literal the next rename would rewrite the guard along with everything else and it would pass by renaming itself

Write-back is tested against strings and a temp file: clean toggle, already-done task left alone, stale-line mismatch aborting without a write, and CRLF files keeping their terminators.

`node test-render.mjs --html <file>` writes a standalone preview using the real markup and real stylesheet, with stand-ins for Obsidian's theme variables and a wrapper mimicking the note's margins. With more than one wiki in the run each gets its own file, `-st` and `-p` suffixed, rather than the second overwriting the first. It is the only way to see the board's actual appearance from outside Obsidian, and it is what caught the missing descriptions, the empty number inputs and the clipped phone columns.

Manual check in Obsidian after any change, on both boards: board renders, horizontal scroll works, the settings panel toggles and persists, the sort toolbar changes column order and writes frontmatter, manual mode keeps the current order and the arrows reorder it, the filter box narrows the columns while typing without losing focus or scroll position and Escape restores the full board, a checkbox click marks the source line done in correct Tasks format, and the pencil opens the edit modal.

The `+` in a column header needs one manual pass per board, because the modal is
the plugin's own and no harness can drive it: press it, confirm the description
opens pre-filled with `[[slug]]`, save, and confirm the card appears in that
column on the refresh. On the the demo wiki board confirm the line landed in today's
journal under `# New tasks` and not in the project page, and check it once on a
morning before that journal has been opened, which is the only time the
create-from-template path runs. On the Personal board confirm the line landed in
the column's own note under `## Tasks`. Cancel the modal once on each board and
confirm nothing was written.

The status menu needs one manual pass too, since no harness exercises a real
right-click: right-click a card's checkbox, confirm the panel opens inside the
card rather than being clipped at the column edge, set In Progress and confirm
the card moves lanes, then set Cancelled on a throwaway task and confirm it
leaves the board and the source line reads `- [-] … ❌ <today>`. On iOS, confirm
whether a long press opens it; WebKit fires `contextmenu` on long press in
recent versions, but if it does not, the pencil remains the way in and that is
the accepted fallback.

## Accepted limitations

- Dataview's JavaScript Queries must be enabled once per device. The failure mode is a visible raw code block, and each note carries a callout explaining the fix
- No drag and drop, for tasks or for columns. Moving a task between projects means editing its `[[slug]]` wikilink in the source note; moving a column means the header arrows in manual mode
- A task whose leading run names two projects appears in both columns. Two such tasks exist on the Personal board, both deliberate
- The default column order shifts as task counts change, so column position is not stable muscle memory. `alpha` or `manual` fixes positions for anyone who wants that
- The board reads the whole in-scope tree on every Dataview refresh. Personal is the larger of the two at roughly 30 task-bearing files; widening `board_include_folders` to a large tree would make this a concern
- On phone the Unassigned column is never pinned, whatever `board_pin_unassigned` says, so the desktop and phone boards differ at the left edge. Accepted as the alternative to an unusable 390pt screen
- Archiving a project is not possible from the board by design. See Project management
- Settings are per-note, so the two boards are configured independently. That is correct, but there is no shared default and no way to set one
- The Personal board has no assignees, since the wiki has no people folder. The Assignees chip setting is visible there and does nothing
- Triage on the Personal board is empty as of 2026-08-27, because every task there leads with a project wikilink. `Inbox.md`'s four unlinked tasks, which used to be the standing example, moved to `office-move` on 2026-08-18. The triage column still renders, and the harness asserts the invariant rather than that file's contents
- `build` carries 39 open tasks, making one very tall column. There is no per-lane cap
- iOS verification is manual. Nothing in the harness exercises WebKit, so scroll-snap and touch behaviour are confirmed on device or not at all
- A task written with a task-like line inside a fenced block in a *journal* note would still be skipped, which is correct, but a genuine task accidentally indented inside a fence would silently vanish from the board. The source note remains the truth
