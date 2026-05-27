---
description: Update specific wiki pages with new information
argument-hint: [wiki-slug] <page path or topic> <new information or source>
---

Targeted update of specific pages.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md`, `<wiki-root>/CLAUDE.md`, and `<wiki-root>/wiki-config.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `update` and entries scoped `global`.

2. Parse the remaining arguments: identify the target page (path or topic search) and the new information or source to integrate.

3. **Find the target page** using retrieval cost escalation:
   a. Read `<wiki-root>/index.md` for candidates.
   b. Grep `summary:` fields.
   c. If needed, grep for the topic in structured-knowledge folders.
   d. Read the full target page.

4. If the target is ambiguous, list candidates and ask the user to pick.

5. **Integrate new information**:
   - If the argument includes a URL, fetch it, save to the article entry point, create a source page, then integrate.
   - If the argument is free text, treat as conversation-sourced (`source_quality: 0.5`).
   - Merge into the existing page content. Do not overwrite; add, refine, or correct.
   - Flag contradictions with existing content in the log.
   - Update `updated`, append to `sources`, recompute `base_confidence` (now has one more source).
   - Recompute `provenance` fractions.
   - Update `summary` if the page's focus has shifted.
   - Default `base_confidence` for update operations is `0.59` (existing page plus new source).

6. Cross-link: verify 2 out, 1 in still holds. Add links if needed.

7. Update manifest `curated_pages`, log, hot.md.

8. Report: page updated, what changed, new confidence score.

9. **Reflection** (mandatory, not opt-out): run the reflection procedure from SKILL.md. Draft feedback entries for any in-run corrections or ambiguities the user resolved verbally. Ask `[y/n]` per entry. On `y`, append to `<wiki-root>/_service/feedback.md` and log a FEEDBACK line. If nothing to capture, say "nothing to capture" and end.

## Constraints

- Only modifies the target page and tracking files.
- Never creates new pages (use `/ingest` or `/capture` for that).
- All shared rules from SKILL.md apply.
