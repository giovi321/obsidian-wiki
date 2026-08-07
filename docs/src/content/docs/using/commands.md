---
title: Commands
description: The full list of obsidian-wiki commands with arguments, zones written, and side effects
---

The plugin ships 24 commands. Every verb takes the wiki slug as its first argument; if exactly one wiki is registered the slug is optional. The summary table below is the quick index, and the command reference under it gives arguments, the zones each command writes, and its side effects.

See [Two or more wikis](/obsidian-wiki/using/multiple-wikis/) for how the slug argument resolves.

## The 24 commands

| Command | Does |
|---|---|
| `/help` | Print the command reference and registered wikis |
| `/setup-wiki` | Register a new wiki or reconfigure an existing one |
| `/ingest` | Ingest sources from entry points and curate changed pages |
| `/ingest-url` | Alias for `/ingest <URL>` |
| `/ingest-claude` | Ingest the current LLM session or saved conversation exports |
| `/capture` | Save durable knowledge from the current conversation. Add `--quick` to stage findings to `_raw/` in under 60 seconds without touching the manifest |
| `/query` | Answer using only the wiki contents; path questions traverse typed relationships |
| `/narrate` | Render a cited readout of a topic from the wiki in a briefing, plain-language, or lecturer voice; `--save` writes to `_readouts/` |
| `/update` | Targeted update of one page with new info |
| `/research` | Search the web for a topic and distill 3 to 5 sources into pages |
| `/synthesize` | Find concepts that co-occur across pages but lack a synthesis page and write cross-cutting synthesis pages |
| `/lint` | Audit for orphans, broken links, stale pages, contradictions, and structural drift between `wiki-config.md` and the disk |
| `/cross-linker` | Audit and repair wikilinks across the wiki |
| `/taxonomy` | Audit or normalize the tag vocabulary against `wiki-config.md` `tags:` |
| `/project` | List, create, archive, reactivate, or update project status |
| `/status` | Health summary plus an ingest recommendation |
| `/insights` | Analyze the wiki's link graph (hubs, bridges, cohesion) into `_service/insights.md` |
| `/archive` | Snapshot structured knowledge into `_archives/` |
| `/rebuild` | Archive, then reprocess every source from scratch |
| `/restore` | Restore from a previous archive |
| `/feedback` | Record a behavioral rule in `_service/feedback.md` |
| `/daily-note` | Create today's daily journal note from template |
| `/update-docs` | Refresh the shared docs folder from the plugin's current README and diagrams |
| `/upgrade` | Refresh plugin-managed files (CLAUDE.md per wiki plus shared docs) after a plugin update |

## Command reference

Every verb takes the wiki slug as its first argument. The table uses `<wiki>` as the placeholder.

| Command | Arguments | Zones written | Side effects |
|---|---|---|---|
| `/help` | empty | none (read-only) | Prints the command table and registered wikis |
| `/setup-wiki` | `[slug]` to reconfigure, empty to add | n/a | Creates wiki folders, writes `CLAUDE.md`, registers wiki |
| `/ingest <wiki>` | `<file>`, `<URL>`, `quick-notes`, or empty | structured knowledge, `_service/` | Updates manifest, log, hot.md; moves processed files per `post_ingest`; promotes `_raw/` staged files |
| `/ingest-url <wiki>` | `<URL>` | structured knowledge, `_service/` | Alias for `/ingest <URL>` |
| `/ingest-claude <wiki>` | `session`, `folder [filter]`, or empty | structured knowledge, `_service/` | Heavy filtering; default `base_confidence: 0.42` |
| `/capture <wiki>` | `[--quick] [topic]` | structured knowledge or `_raw/` | Normal: `base_confidence: 0.42`, full pipeline. `--quick`: stages to `_raw/` in <60 s, no manifest writes |
| `/query <wiki>` | `[--visibility <level>] <question>` | none (read-only) | Reflection step at end |
| `/narrate <wiki>` | `<topic> [--voice briefing\|plain-language\|lecturer] [--visibility public] [--save]` | none (read-only); `_readouts/` with `--save` | Cited readout from wiki evidence only; `--save` writes `_readouts/<slug>.md` (excluded from index and manifest) |
| `/update <wiki>` | `<page> <info>` | target page, `_service/` | Recomputes `base_confidence` and `provenance` |
| `/research <wiki>` | `<topic>` | structured knowledge, `_service/` | Saves raw web content to article entry point; 3 to 5 sources minimum |
| `/synthesize <wiki>` | `[domain filter]` | `synthesis/` under the primary knowledge folder, index, log, hot.md | Writes cross-cutting synthesis pages; reflection step at end |
| `/lint <wiki>` | empty | `_service/lint-<date>.md`, log, hot.md | Read-only on wiki content |
| `/cross-linker <wiki>` | `[scope]` or `all` | wikilinks and `aliases` only | Never deletes links |
| `/taxonomy <wiki>` | `[audit \| normalize]` | `_service/taxonomy-<date>.md`; `normalize` also writes pages, `wiki-config.md`, `_service/taxonomy.md` | `audit` (default) read-only; `normalize` runs reflection |
| `/project <wiki>` | `list \| new <name> \| archive <slug> \| reactivate <slug> \| status <slug> <new>` | project folders, index, log | Moves to `_old/` on archive, never deletes |
| `/status <wiki>` | empty | none (read-only) | Computes delta, recommends `/ingest` or `/rebuild` |
| `/insights <wiki>` | empty | `_service/insights.md` (regenerable), log, hot.md | Read-only on wiki content; skips wikis under 20 pages |
| `/archive <wiki>` | `[reason]` | `_service/_archives/<id>/` | Never modifies archived content |
| `/rebuild <wiki>` | `[reason]` | structured knowledge (cleared), `_service/` | Archives first; respects `protected_paths` |
| `/restore <wiki>` | `<archive-id>` or `list` | structured knowledge, `_service/` | Archives current state first |
| `/feedback <wiki>` | `<rule text>` or empty | `_service/feedback.md`, log, hot.md | Confirms before appending; never overwrites |
| `/daily-note <wiki>` | `[YYYY-MM-DD]` | journal entry point only | Does not touch manifest or log |
| `/update-docs` | empty | `<vault_root>/_service/docs/` | Refreshes README and diagrams from the plugin folder |
| `/upgrade` | `[wiki-slug]` or empty | `CLAUDE.md` per target wiki, `<vault_root>/_service/docs/` | Refreshes plugin-managed files only; never touches `wiki-config.md`, `_service/custom-procedures/`, or wiki content |

## Where to go next

- [The daily workflow](/obsidian-wiki/using/daily-workflow/): the cadence these commands settle into
- [Retrieval and modes](/obsidian-wiki/reference/retrieval-and-modes/): how read commands escalate and how the append, rebuild, and restore modes differ
- [Adding a custom command](/obsidian-wiki/extending/custom-commands/): author your own verb
