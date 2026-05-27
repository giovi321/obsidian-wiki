---
description: Show the wiki command reference
argument-hint: [wiki-slug] (optional, shows wiki-specific addressing if provided)
---

Print the command reference.

Args: $ARGUMENTS

## Procedure

1. Read `~/.claude/obsidian-wiki/wiki-registry.json` to determine `addressing_mode` and the list of registered wikis.

2. Adapt the table below: if `addressing_mode` is `suffixed`, replace each `/<verb>` with `/<verb>-<slug>` for each registered wiki and show one table per wiki. If `argument`, show one table with `[wiki-slug]` as the first argument.

## Commands

| Command | Description |
|---------|-------------|
| `/ingest` | Ingest sources and curate changed pages. Accepts a filename, URL, `quick-notes` keyword, or omit for all new files. |
| `/ingest-claude` | Ingest LLM conversations. `session` for current session, `folder [filter]` for files, omit for both. |
| `/ingest-url` | Fetch and ingest a single URL. |
| `/update` | Update a specific page with new information. |
| `/query` | Answer a question using only wiki contents. |
| `/capture` | Save knowledge from the current conversation. |
| `/status` | Show wiki health summary and ingest recommendations. |
| `/lint` | Audit for orphans, broken links, stale pages. |
| `/cross-linker` | Audit and fix wikilinks. |
| `/research` | Research a topic via web and create or enrich pages. |
| `/project` | Manage projects: `list`, `new`, `archive`, `reactivate`, `status`. |
| `/archive` | Snapshot structured knowledge to `_archives/`. |
| `/rebuild` | Archive and rebuild from all sources. |
| `/restore` | Restore from a previous archive. |
| `/feedback` | Record a behavioral rule. |
| `/daily-note` | Create today's daily journal note from template (only if the wiki has a journal entry point). |
| `/setup-wiki` | Register a new wiki or reconfigure an existing one. Not per-wiki. |

## Notes

- All commands read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` for shared logic, the target wiki's `CLAUDE.md` for config, and `<wiki-root>/_service/feedback.md` for behavioral rules.
- Entry points and structured-knowledge folders are declared in each wiki's `CLAUDE.md`. Run `/setup-wiki` to create or modify them.
- Source-quality scoring, confidence formula, provenance markers, lifecycle states, and the reflection step are documented in `SKILL.md` and in `docs/QUICK-REFERENCE.md`.
