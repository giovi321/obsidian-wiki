---
title: Demo project board
summary: Kanban of open tasks, one column per active project, sourced from demo/Projects.
type: dashboard
board_wiki: demo
cssclasses:
  - wkb-board-page
board_show_unassigned: true
board_show_empty_columns: false
board_flags:
  - field: publish
    label: Publish
    glyph: P
    on_hint: Included the next time the site is built.
    off_hint: Kept out of the site build.
board_column_order: count
---
```dataviewjs
await dv.view("templates/board")
```

> [!info]- Board not rendering?
> This board is a DataviewJS view. Enable it under Settings, Community plugins,
> Dataview, Enable JavaScript Queries. The setting is per device, so it must be
> turned on separately in Obsidian on a phone.
>
> The logic is in `view.js` and the styling in `view.css`. Design notes and the
> reasoning behind the layout are in `DESIGN.md`.
