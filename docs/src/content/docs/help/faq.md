---
title: FAQ
description: Common questions about running obsidian-wiki without Obsidian, multiple wikis, updates, and undoing changes
---

### Does this work without Obsidian?

Yes. The output is plain markdown with wikilinks and YAML frontmatter, readable in any editor. The Obsidian community plugins are only needed if you want the dashboards, Tasks queries, and Dataview blocks to render. The agent reads and writes files directly on disk.

### Can I run multiple wikis in one vault?

Yes. Each wiki is registered with its own slug and root folder, and commands address them by slug. The only restriction is that wiki roots must not nest inside each other, enforced at setup.

### Will a plugin update break or change my wiki?

No. The two plugin-managed files (`CLAUDE.md` per wiki, shared docs) refresh only when you explicitly run `/upgrade` or `/update-docs`. Everything else, your `wiki-config.md`, custom procedures, feedback rules, and content, is never touched by an update. See [Plugin updates](/obsidian-wiki/extending/plugin-updates/).

### Can the agent modify my hand-written notes?

Only inside declared zones, and even there the lifecycle protects you: pages you have edited are `reviewed` or higher and get merged into, never overwritten. `protected_paths` folders are never cleared by `/rebuild`, `read_only` entry points are never modified at all, and dashboards are rewritten only on an explicit restructure request.

### What happens if I drop the same file in twice?

Nothing. Every source is hashed (SHA-256) and recorded in the manifest; unchanged files are skipped on every later ingest. A changed file (same path, different content) is re-processed.

### How do I undo a bad ingest or rebuild?

`/archive` snapshots the knowledge at any time, and `/rebuild` and `/restore` always archive before making changes. Run `/restore list` to see snapshots and `/restore <archive-id>` to roll back.

## Where to go next

- [The daily workflow](/obsidian-wiki/using/daily-workflow/): the loop once a wiki is set up
- [Commands](/obsidian-wiki/using/commands/): the full command reference
- [Plugin updates](/obsidian-wiki/extending/plugin-updates/): what an update touches
