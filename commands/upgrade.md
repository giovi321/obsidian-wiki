---
description: Refresh plugin-managed files (CLAUDE.md and shared docs) without touching user-owned files
argument-hint: [wiki-slug] (optional, defaults to all registered wikis)
---

Refresh `CLAUDE.md` in one or every registered wiki, plus the shared docs folder. Does NOT touch `wiki-config.md`, `_service/custom-procedures/`, the registry, or any wiki content.

Args: $ARGUMENTS

## Procedure

1. Read `~/.claude/obsidian-wiki/wiki-registry.json`. If missing, abort and tell the user to run `/setup-wiki` first.

2. Determine the target set:
   - If `$ARGUMENTS` is a slug present in the registry: refresh that wiki only.
   - If `$ARGUMENTS` is empty: refresh every registered wiki.
   - If `$ARGUMENTS` is a slug not in the registry: abort with the list of registered slugs.

3. For each wiki in the target set:

   a. Read the current `<wiki-root>/CLAUDE.md` if it exists, and compute its SHA-256.
   b. Read `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md.tmpl` and compute its SHA-256.
   c. If the hashes match, log "up to date" for this wiki and skip the write.
   d. If they differ, copy `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md.tmpl` to `<wiki-root>/CLAUDE.md`, overwriting. Log the old hash, new hash, and number of lines changed.

4. Refresh the shared docs at `<vault_root>/_service/docs/`:
   - Copy `${CLAUDE_PLUGIN_ROOT}/README.md` to `<vault_root>/_service/docs/README.md`. Overwrite.
   - Copy every `${CLAUDE_PLUGIN_ROOT}/docs/diagrams/*.svg` to `<vault_root>/_service/docs/diagrams/`. Overwrite each.

5. Verify nothing else was touched. Specifically, do NOT modify:
   - `<wiki-root>/wiki-config.md`
   - `<wiki-root>/_service/custom-procedures/` and its contents
   - `<wiki-root>/_service/` files (manifest, log, hot.md, feedback.md, sources, archives, entry-points)
   - `<wiki-root>/index.md`
   - The wiki registry
   - Any structured-knowledge content
   - Any entry-point content

6. Report: per wiki, whether `CLAUDE.md` was refreshed or already up to date. Shared docs: number of files refreshed. If `wiki-config.md` in any wiki references schema fields that are no longer supported by the current `wiki-setup` SKILL.md, flag them in the report and tell the user to edit their `wiki-config.md` manually. The agent does not auto-migrate `wiki-config.md` schema; that is intentional.

## Constraints

- Idempotent. Safe to run multiple times.
- Never touches user-authored files.
- If `${CLAUDE_PLUGIN_ROOT}` does not resolve (plugin not installed or path broken), abort with an explanation.
- If the registry's `vault_root` field is missing or points at a non-existent path, log a warning and skip the shared-docs refresh; do not block CLAUDE.md updates.
