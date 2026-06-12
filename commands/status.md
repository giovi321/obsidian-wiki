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

3. **Compute delta**: run the manifest helper:

   ```
   python "${CLAUDE_PLUGIN_ROOT}/scripts/manifest.py" delta "<wiki-root>/_service/.manifest.json" <absolute path of each entry point>
   ```

   Each output line is `reason<TAB>absolute-path` with reason ∈ {`new`, `changed`}; unchanged files are omitted. The helper honors the `WIKI_SKIP_PROJECTS` env var. Fallback: if `python` is unavailable or the script errors, walk the entry points manually — compute SHA-256 per file and compare to the manifest (not present = new, hash differs = changed). Either way, drop files matched by entry-point `exclude` globs and `ignore_paths` from the result.

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
