---
title: The project board
description: An optional kanban of open tasks, one column per active project, rendered from a DataviewJS view stored in the vault
---

An optional dashboard: a horizontally scrolling kanban of open tasks, one column per
active project, discovered from the wiki's projects folder. It ships in
`templates/board/` and `/setup-wiki` offers to install it.

Tasks are read wherever they are already written, in Obsidian Tasks syntax, and routed
to a column by the wikilinks at the start of the line. Nothing is copied into a board
file, and no task ever moves between notes: the source note stays the only copy.

## What it gives you

- One column per project whose lifecycle status the wiki lists as column-eligible. A
  dormant or completed project keeps its tasks off the board without them being deleted
- A triage column for tasks that name no project, which is the signal that they need a
  home
- Three lanes per column: in progress, open, and recently done
- Eight column-order modes with a direction toggle, plus a manual order set by arrows in
  the column headers
- A filter box that narrows every column as you type
- Click a checkbox to complete a task, right-click it for the full status set, and use
  the `+` in a column header to add one through the Tasks plugin's own modal
- 20 display settings stored as `board_*` keys in the board note's frontmatter, so two
  boards in one vault are configured independently

## Why a view, not a plugin

A custom Obsidian plugin lives in `.obsidian/`, which most sync setups deliberately
leave out. That means installing and reinstalling it on every device on every change. A
DataviewJS view stored in the vault syncs with the notes.

The same reasoning rules out a CSS snippet in `.obsidian/snippets/`: the stylesheet has
to live in the synced tree. It sits next to `view.js` and is loaded by the script
itself, not by `dv.view`, which resolves a sibling stylesheet by wikilink and injects it
with a `scope` attribute no browser implements.

The cost is enabling Dataview's JavaScript Queries once per device.

## Prerequisites

- **Dataview** with **Enable JavaScript Queries** switched on. That setting is per
  device, so it has to be switched on again in Obsidian on a phone or tablet. Without
  it the board note shows a raw code block, and the note carries a callout saying so
- **Tasks** for the add and edit buttons. The board parses and writes Tasks syntax
  itself, so everything else works without it
- A `purpose: projects` folder in the wiki. Without one the board would have no columns,
  and `/setup-wiki` will not offer it

## Configuration, in two places

Structure lives in the `WIKIS` table in `view.js`: folder layout, project depth, people
folder, which statuses earn a column, where the add button writes, and what is in scope.
These describe a wiki's shape, so they are shared by every board on that wiki.

Appearance lives in the board note's own frontmatter as `board_*` keys, and the settings
panel on the board writes them for you.

The setting to get right before any other is `exclude_folders`. Any folder holding
checkbox lines that are not project tasks belongs in it: meeting transcripts, imported
checklists, reading lists. A folder of transcripts can hold an order of magnitude more
checkbox lines than a wiki has real tasks. Including it does not break the board, it
buries every real task under the triage column, and nothing on screen says that is what
happened.

## Task syntax

The board routes on the leading run of wikilinks:

```
- [ ] [[Person]] [[project-slug]] description ➕ 2026-01-05 📅 2026-01-09 🔼
```

- Statuses: `[ ]` open, `[/]` in progress, `[x]` done, `[-]` cancelled
- Dates: `➕` created, `📅` due, `✅` done, `❌` cancelled
- Priorities, highest to lowest: `🔺 ⏫ 🔼 🔽 ⏬`

Links after the leading run are mentions, not assignments. A task reading
`[[project-a]] decide whether to retire [[project-b]]` belongs to project-a only, so it
does not show up as outstanding work on the project it proposes retiring. A task naming
two projects in its leading run does appear in both columns; that is deliberate.

## Writes

Three code paths modify notes: ticking a checkbox, setting a status from the card menu,
and adding a task. All three write one line to the task's own source note, and all three
fail closed. If the line the board parsed is no longer there, nothing is written and the
board says it is stale rather than guessing which line was meant.

Only the four statuses above are offered, because the parser reads exactly those
characters. Writing a fifth would produce a line the board cannot read back, and the
task would vanish from it.

A recurring task is refused rather than completed, since a line rewrite would not create
the next occurrence. The edit pencil hands it to the Tasks plugin instead.

## Trying it without touching your notes

`templates/board/demo/` is a small invented wiki that the board's own tests run against.
Copy it into a scratch vault alongside `view.js` and `view.css`, then open
`demo/Board.md`.

## Further reading

`templates/board/README.md` is the install and usage guide.
`templates/board/DESIGN.md` records why each decision went the way it did, and the traps
found while building it.
