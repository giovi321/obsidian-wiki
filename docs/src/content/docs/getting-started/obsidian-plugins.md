---
title: Obsidian plugins
description: The Obsidian community and core plugins the shipped dashboards depend on
---

Install the required Obsidian plugins before `/setup-wiki` if you want the dashboards to render. The shipped templates (todo dashboard, daily-note, project board) and several command outputs depend on the Obsidian community and core plugins below.

## Required community plugins

| Plugin | Why |
|---|---|
| [Dataview](https://github.com/blacksmithgu/obsidian-dataview) | The daily-note template uses `dataview` query blocks for "created today", "modified today", and project listings. The project board is a DataviewJS view and additionally needs **Enable JavaScript Queries**, which is a per-device setting |
| [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) | The todo dashboard, daily-note, and `/project new` generate `tasks` query blocks for due, overdue, and done filters. The project board parses and writes Tasks syntax itself, and uses the plugin's own modals for its add and edit buttons |
| [Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes) | `/daily-note` and the daily-note template rely on the `{{date:YYYY-MM-DD}}`, `{{date+1d:YYYY-MM-DD}}`, `{{date+7d:YYYY-MM-DD}}` placeholders this plugin provides |
| [Front Matter Timestamps](https://github.com/Joschua-Conrad/front-matter-timestamps) | Auto-populates the `created` and `modified` fields the daily-note's Dataview queries filter on. Without it those queries return nothing |
| [Folder Notes](https://github.com/LostPaul/obsidian-folder-notes) | Each subfolder of a knowledge folder has a `<folder-name>.md` index; Folder Notes shows that index when you click the folder |

## Required core (built-in) plugins

| Core plugin | Why |
|---|---|
| Canvas | Not used by any shipped template. Listed because vaults created before the project board replaced the canvas dashboard may still hold a `.canvas` file |
| Properties | Reads and edits the YAML frontmatter the agent writes on every page |
| Backlinks | Surfaces incoming wikilinks; the cross-link conventions assume you see them |
| Daily notes | Required by Periodic Notes |
| Templates | Variable substitution for the daily-note template |

## Recommended community plugins (not required)

| Plugin | What it adds |
|---|---|
| [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) | UI for navigating daily notes; pairs with Periodic Notes |
| [Omnisearch](https://github.com/scambier/obsidian-omnisearch) | Better search than the built-in. Useful when querying the wiki by hand |
| [Hidden Folder](https://github.com/dragonprogrammer/obsidian-hidden-folder) | Hides `_service/` from the file explorer so working state stays out of your way |
| [Iconic](https://github.com/gfxholo/iconic) | Custom icons per folder; useful to distinguish zones |
| [Tray](https://github.com/cmoog/obsidian-tray) | System tray shortcuts for opening daily notes or specific files |
| [Task Board](https://github.com/Atif-Shafi/obsidian-task-board) | Kanban view over Tasks; an alternative to the shipped project board |
| [Commander (cmdr)](https://github.com/phibr0/obsidian-commander) | Custom buttons in toolbars and side panels |
| [Table Editor](https://github.com/ganesshkumar/obsidian-table-editor) | Better table editing. The plugin writes many tables |
| [Recent Files](https://github.com/tgrosinger/recent-files-obsidian) | An Obsidian-native counterpart to `_service/hot.md` |
| [Actions URI](https://github.com/czottmann/obsidian-actions-uri) | URL-scheme actions for triggering Obsidian from outside |
| [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) | Only needed if you connect the [obsidian MCP server](https://github.com/MarkusPfundstein/mcp-obsidian) so Claude reads or writes to Obsidian over HTTP. Direct filesystem access via Read/Write works without it |

## Next steps

- Register your first wiki: [First run](/obsidian-wiki/getting-started/first-run/)
