---
description: Save knowledge from the current conversation into a wiki
argument-hint: [wiki-slug] <what to capture, or omit for auto-detect>
---

Extract substantive knowledge from the current conversation and file it.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. Command file `capture-<slug>.md` resolves to slug `<slug>`; otherwise first argument is slug.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `capture` and entries scoped `global`.

2. Identify what is worth preserving (decisions, findings, frameworks, facts not in the wiki). Discard logistics, greetings, already-captured content.

3. Classify per `CLAUDE.md` routing rules into the structured-knowledge folders.

4. Rewrite as declarative knowledge. Apply provenance markers.

5. Generate slug and title per `CLAUDE.md` naming rules.

6. Check for existing pages via retrieval cost escalation. Update instead of creating duplicates.

7. Write the page with full frontmatter: `base_confidence: 0.42`, `lifecycle: draft`, `summary` ≤200 characters, provenance fractions. Minimum 250 words, two or more outgoing wikilinks.

8. Update `index.md`, `_service/log.md`, `_service/hot.md`. Touch project `last_activity` if relevant.

9. Confirm to the user.

## Constraints

- Write inside structured-knowledge folders and `_service/` only.
- Never fabricate claims not in the conversation.
- If nothing is worth preserving, say so and stop.
