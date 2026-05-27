---
description: Show the wiki command reference
---

Print the command reference.

## Procedure

1. Read `~/.claude/obsidian-wiki/wiki-registry.json` to list the registered wikis.

2. Print the command table below. After the table, list the registered wikis so the user knows which slugs they can pass.

## Commands

All verbs take an optional wiki slug as the first argument. If the slug is omitted and exactly one wiki is registered, that wiki is used.

| Command | Description |
|---------|-------------|
| `/ingest [wiki]` | Ingest sources and curate changed pages. Accepts a filename, URL, `quick-notes` keyword, or omit for all new files. |
| `/ingest-claude [wiki]` | Ingest LLM conversations. `session` for current session, `folder [filter]` for files, omit for both. |
| `/ingest-url [wiki]` | Fetch and ingest a single URL. |
| `/update [wiki]` | Update a specific page with new information. |
| `/query [wiki]` | Answer a question using only wiki contents. |
| `/capture [wiki]` | Save knowledge from the current conversation. |
| `/status [wiki]` | Show wiki health summary and ingest recommendations. |
| `/lint [wiki]` | Audit for orphans, broken links, stale pages. |
| `/cross-linker [wiki]` | Audit and fix wikilinks. |
| `/research [wiki]` | Research a topic via web and create or enrich pages. |
| `/project [wiki]` | Manage projects: `list`, `new`, `archive`, `reactivate`, `status`. |
| `/archive [wiki]` | Snapshot structured knowledge to `_archives/`. |
| `/rebuild [wiki]` | Archive and rebuild from all sources. |
| `/restore [wiki]` | Restore from a previous archive. |
| `/feedback [wiki]` | Record a behavioral rule. |
| `/daily-note [wiki]` | Create today's daily journal note from template (only if the wiki has a journal entry point). |
| `/setup-wiki` | Register a new wiki or reconfigure an existing one. Not per-wiki. |

## Notes

- All commands read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` for shared logic, the target wiki's `CLAUDE.md` for config, and `<wiki-root>/_service/feedback.md` for behavioral rules.
- Entry points and structured-knowledge folders are declared in each wiki's `CLAUDE.md`. Run `/setup-wiki` to create or modify them.
- Source-quality scoring, confidence formula, provenance markers, lifecycle states, and the reflection step are documented in `SKILL.md` and in `docs/QUICK-REFERENCE.md`.
