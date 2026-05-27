---
description: Show a wiki's health summary and ingest recommendations
argument-hint: [wiki-slug]
---

Compute and display the wiki's current state.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md`, `<wiki-root>/CLAUDE.md`, and `<wiki-root>/wiki-config.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `status` and entries scoped `global`.

2. Read `<wiki-root>/_service/.manifest.json`.

3. **Compute delta**: walk all entry points declared in `wiki-config.md`. For each file, compute SHA-256 and compare to the manifest:
   - New files (not in manifest).
   - Changed files (hash differs).
   - Unchanged files (skip).

4. **Wiki statistics**:
   - Total pages per structured-knowledge folder.
   - Active vs archived projects.
   - Source count in manifest.
   - Pages by lifecycle state (draft, reviewed, verified, disputed, archived).
   - Average `base_confidence`.
   - Stale page count (`(today - updated) > 90 days`).
   - Orphan count (pages with 0 incoming links).

5. **Recent activity**: read `<wiki-root>/_service/hot.md` for the last 20 operations.

6. **Recommendation**:
   - If delta is small (fewer than 10 files), recommend `/ingest` (append mode).
   - If delta is large (more than 30% of manifest) or schema has changed, recommend `/rebuild`.
   - If no delta, "Wiki is up to date."

7. Report all statistics and the recommendation. Do not write any files.

## Constraints

- Read-only. No file modifications.
- All shared rules from SKILL.md apply.
