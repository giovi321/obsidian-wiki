# Project board

A horizontally scrolling kanban of open tasks for an Obsidian wiki, one column per
active project, discovered from the wiki's projects folder. It renders as a
DataviewJS view inside an ordinary vault note, not as an Obsidian plugin.

Tasks are read wherever they are written, in Obsidian Tasks syntax, and routed to a
column by the wikilinks at the start of the line. Nothing is duplicated into a board
file: the source note stays the only copy.

## What it does

- One column per project whose lifecycle status you list as column-eligible. Projects
  that are dormant or finished keep their tasks off the board without deleting them
- Tasks that name no project collect in a triage column, which is the signal that they
  need a home
- Three lanes per column: in progress, open, and recently done
- Eight column-order modes with a direction toggle, plus a manual order you set with
  arrows in the column headers
- A filter box that narrows every column as you type
- Click a checkbox to complete a task, right-click it for the full status set, and use
  the `+` in a column header to add one through the Tasks plugin's own modal
- 20 display settings, stored as `board_*` keys in the board note's own frontmatter, so
  two boards in one vault are configured independently

Writes go to the task's own source note, one line at a time, and fail closed: if the
line the board parsed is no longer there, nothing is written and the board says it is
stale.

## Requirements

- [Dataview](https://github.com/blacksmithgu/obsidian-dataview) with **Enable JavaScript
  Queries** turned on. This is per device, so it must be turned on again in Obsidian on
  a phone. Without it the board renders as a raw code block
- [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) for the add and edit
  modals. The board parses and writes Tasks syntax itself, so the plugin is only needed
  for those two buttons

## Install

1. Copy `view.js` and `view.css` into your vault, in a folder of their own. Anywhere
   works; a service folder keeps them out of your notes
2. Add an entry for your wiki to the `WIKIS` table at the top of `view.js`. The `demo`
   entry is a worked example and every field is commented. At minimum you need `slug`,
   `root`, `projectsFolder` and `settingDefaults.include_folders`
3. Create a board note anywhere in that wiki, with this body:

   ````markdown
   ```dataviewjs
   await dv.view("<path to the folder from step 1>")
   ```
   ````

   The path is vault-relative, not wiki-relative
4. Add `board_wiki: <slug>` and `cssclasses: [wkb-board-page]` to the note's
   frontmatter. `board_wiki` can be omitted if the note sits inside the wiki root you
   declared, in which case the wiki is inferred from the note's path

`demo/Board.md` is a board note you can copy.

## Task syntax

The board reads Obsidian Tasks syntax and routes on the leading run of wikilinks:

```
- [ ] [[Person]] [[project-slug]] description ➕ 2026-01-05 📅 2026-01-09 🔼
```

- Statuses: `[ ]` open, `[/]` in progress, `[x]` done, `[-]` cancelled
- Dates: `➕` created, `📅` due, `✅` done, `❌` cancelled
- Priorities, highest to lowest: `🔺 ⏫ 🔼 🔽 ⏬`
- Links after the leading run are mentions, not assignments. A task reading
  `[[project-a]] decide whether to retire [[project-b]]` belongs to project-a only, so
  it does not appear as outstanding work on the project it proposes retiring

A task naming two projects in its leading run does appear in both columns. That is
deliberate, not a bug.

`demo/Task syntax.md` documents the same thing as a page you can copy into a wiki.

## Configuration

Structure lives in `view.js`, in the `WIKIS` table: folder layout, project depth,
people folder, which statuses earn a column, where the add button writes, and what is
in scope. These describe a wiki's shape, so they are code-level configuration and are
shared by every board on that wiki.

Appearance lives in the board note's frontmatter as `board_*` keys, and the settings
panel on the board writes them for you. Because they are per note, two boards on the
same wiki can look different.

The one setting worth getting right before anything else is
`settingDefaults.exclude_folders`. Any folder holding checkbox lines that are not
project tasks belongs there: meeting transcripts, reading lists, imported checklists. A
folder of transcripts can hold an order of magnitude more checkbox lines than the wiki
has real tasks. Including it does not break the board, it buries every real task under
the triage column.

## The demo wiki

`demo/` is a small invented wiki the tests run against. It covers both project depths,
a category landing that carries its own tasks, all four task statuses, a task naming
two projects, tasks naming none, a fenced example that must not parse as a task, and an
excluded folder whose checkbox lines must never reach the board.

To see the board without touching your own notes, copy `demo/` into a scratch vault
alongside `view.js` and `view.css` and open `demo/Board.md`.

## Tests

```
node test-board.mjs
node test-render.mjs
```

`test-board.mjs` covers the pure logic: parsing, scope, project discovery, routing,
sorting, settings resolution, and every write path. `test-render.mjs` covers the render
path against a hand-rolled DOM shim and a stubbed Obsidian `app`, so it runs in node
with no vault and no Obsidian. Neither writes to disk outside a temp directory.

`node test-render.mjs --html out.html` writes a standalone preview using the real markup
and the real stylesheet. It is the only way to see the board's appearance from outside
Obsidian.

Both run against `demo/`, so a change that breaks the component fails the tests without
needing a real wiki.

## Known limitations

- Dataview's JavaScript Queries must be enabled once per device
- No drag and drop, for tasks or for columns. Moving a task between projects means
  editing its wikilink in the source note; moving a column means the header arrows in
  manual order
- Only the four statuses above are offered. The board's parser reads exactly those
  characters, so writing a fifth would produce a line it cannot read back and the task
  would vanish from the board
- A recurring task is refused rather than completed from the board, because a line
  rewrite would not create the next occurrence. Use the edit pencil, which hands the
  task to the Tasks plugin
- iOS behaviour is verified by hand. Nothing in the tests exercises WebKit, so
  scroll-snap and touch are confirmed on a device or not at all

## Design notes

`DESIGN.md` records what the board is, why each decision went the way it did, and the
traps found while building it. Read it before changing anything in `view.js`.
