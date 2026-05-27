---
description: Create a daily journal note from template
argument-hint: [wiki-slug] optional date YYYY-MM-DD (defaults to today)
---

Create a daily journal note.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. Command file `daily-note-<slug>.md` resolves to slug `<slug>`; otherwise first argument is the wiki slug.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `daily-note` and entries scoped `global`. `CLAUDE.md` declares the journal entry point and the template path. Abort if no `daily_journal` entry point is configured.

2. Determine target date: `YYYY-MM-DD` from the remaining argument, or today. Reject other formats.

3. Check if `<journal-entry-point>/<date>.md` exists. If yes, ask the user: open existing or recreate.

4. Read the template file at the path declared by `CLAUDE.md` (typically `<journal-entry-point>/_template.md`).

5. Substitute placeholders:
   - `{{date:YYYY-MM-DD}}` to target date.
   - `{{date+1d:YYYY-MM-DD}}` to plus one day.
   - `{{date+7d:YYYY-MM-DD}}` to plus seven days.
   - `{{date-1d:YYYY-MM-DD}}` to minus one day.

6. Write to `<journal-entry-point>/<date>.md`.

7. Do NOT touch manifest or log. Daily-note creation is routine.

8. Confirm to the user.

## Constraints

- Never modify existing notes without confirmation.
- Never write outside the journal entry point.
- Never modify `_template.md`.
- Unmatched placeholders are left as-is.
