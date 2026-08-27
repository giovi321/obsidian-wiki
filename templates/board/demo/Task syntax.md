---
type: note
created: 2026-01-02
---

# Task syntax

How a task is written in this wiki. Every example below is inside a fenced code
block, which is exactly why the board tracks fences while parsing: without that,
this page's examples would parse as real open tasks and sit in the triage column
forever.

The convention is one leading run of wikilinks, then the description:

```
- [ ] [[Person]] [[project-slug]] description ➕ 2026-01-05 📅 2026-01-09 🔼
- [x] [[project-slug]] [[Person]] something finished ➕ 2026-01-05 ✅ 2026-01-08
```

Statuses: `[ ]` open, `[/]` in progress, `[x]` done, `[-]` cancelled.

Dates: `➕` created, `📅` due, `✅` done, `❌` cancelled.
Priorities, highest to lowest: `🔺 ⏫ 🔼 🔽 ⏬`.

Links after the leading run are mentions, not assignments. A task reading
"[[project-a]] decide whether to retire [[project-b]]" belongs to project-a
only.
