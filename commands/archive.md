---
description: Snapshot a wiki's structured knowledge into _archives/
argument-hint: [wiki-slug] optional reason (free-text)
---

Create a timestamped snapshot of the wiki's structured knowledge.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. Command file `archive-<slug>.md` resolves to slug `<slug>`; otherwise first argument is the wiki slug and the rest is the reason.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `archive` and entries scoped `global`.

2. Compute archive ID: `YYYY-MM-DD-HHMM`.

3. Create `<wiki-root>/_service/_archives/<archive-id>/`.

4. Copy each structured-knowledge folder declared in `CLAUDE.md` plus service metadata (`_service/.manifest.json`, `_service/log.md`, `_service/sources/`, `<wiki-root>/index.md`) into the archive. Do NOT copy entry points, `_service/_archives/`, `_service/_attachments/`, or dashboard files.

5. Compute statistics for `<wiki-root>/_service/_archives/<archive-id>/info.json`:
   ```json
   {
     "archived_at": "ISO-8601",
     "reason": "<reason>",
     "page_count": int,
     "project_count_active": int,
     "project_count_old": int,
     "source_count": int,
     "word_count": int,
     "manifest_hash": "sha256 of .manifest.json"
   }
   ```

6. Append to `<wiki-root>/_service/log.md`: `[ISO-8601] ARCHIVE id="<id>" reason="<reason>" pages=<n> ...`

7. Report: archive location, counts.

## Constraints

- Never delete existing archives.
- Never modify archived content.
- If the archive ID exists, append `-2`, `-3`, etc.
