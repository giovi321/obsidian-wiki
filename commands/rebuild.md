---
description: Archive a wiki and rebuild from all sources
argument-hint: [wiki-slug] optional reason (free-text)
---

Rebuild the wiki from scratch.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `rebuild` and entries scoped `global`.
2. Confirm with the user.
3. Run `/archive` with reason "pre-rebuild: <reason>".
4. Clear structured-knowledge folders. Respect any `protected_paths` list declared in `CLAUDE.md` (folders that are hand-written and must not be cleared, e.g. dashboards or hand-curated subfolders). Reset manifest, log, index.
5. Run `/ingest` with no arguments to reprocess all sources.
6. Log the rebuild.
7. Report: archive location, sources reprocessed, pages created, comparison with pre-rebuild count.

## Constraints

- Always archive first.
- Always confirm with the user.
- Never delete entry-point folders.
- Never clear paths listed under `protected_paths` in `CLAUDE.md`.
