---
description: Restore a wiki from a previous archive
argument-hint: [wiki-slug] <archive-id> or "list"
---

Restore from a previous archive.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md`, `<wiki-root>/CLAUDE.md`, and `<wiki-root>/wiki-config.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `restore` and entries scoped `global`.
2. If the target is `list` or empty, list archives from `<wiki-root>/_service/_archives/` with `info.json` metadata. Ask the user which to restore.
3. Confirm with the user.
4. Run `/archive` with reason "pre-restore: restoring from <archive-id>".
5. Clear current structured-knowledge folders, except paths listed under `protected_paths` in `wiki-config.md`.
6. Copy back from the archive, mirroring what `/archive` snapshots:
   - Each structured-knowledge folder (skipping `protected_paths` — never overwrite those).
   - `<wiki-root>/index.md`.
   - `_service/sources/`.
   - `_service/.manifest.json` — required: the manifest must match the restored content, or the next `/ingest` re-processes every source.
   Do NOT restore `_service/log.md` (append-only audit trail; the archived copy stays in the archive for forensics). Do NOT touch `hot.md`, `feedback.md`, or `_service/custom-procedures/`.
7. Append to `<wiki-root>/_service/log.md`: `- [ISO-8601] RESTORE id="<archive-id>" pages=<n>`.
8. Report: archive restored, page count, manifest state.

## Constraints

- Always archive current state first.
- Always confirm.
- Never delete archives.
- Never overwrite `protected_paths` content or the log.
