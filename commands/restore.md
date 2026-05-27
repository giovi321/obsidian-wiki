---
description: Restore a wiki from a previous archive
argument-hint: [wiki-slug] <archive-id> or "list"
---

Restore from a previous archive.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. Command file `restore-<slug>.md` resolves to slug `<slug>`; otherwise first argument is the wiki slug.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `restore` and entries scoped `global`.
2. If the target is `list` or empty, list archives from `<wiki-root>/_service/_archives/` with `info.json` metadata. Ask the user which to restore.
3. Confirm with the user.
4. Run `/archive` with reason "pre-restore: restoring from <archive-id>".
5. Clear current structured knowledge.
6. Copy archived content back.
7. Log the restore.
8. Report.

## Constraints

- Always archive current state first.
- Always confirm.
- Never delete archives.
