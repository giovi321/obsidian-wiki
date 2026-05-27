---
description: Research a topic on the web and create or enrich wiki pages
argument-hint: [wiki-slug] <topic or question>
---

Research a topic and create or enrich wiki pages with findings.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `research` and entries scoped `global`.

2. **Check existing knowledge**: use retrieval cost escalation to find what the wiki already knows about the topic.

3. **Identify gaps**: what questions remain unanswered? What claims lack sources?

4. **Research**: use WebSearch and WebFetch to find high-quality sources. Prefer official docs, papers, and reputable articles. Fetch 3 to 5 sources minimum.

5. **Save raw sources**: save each fetched page to the article entry point (typically the one with `source_type: article`) at `<entry-point>/<YYYY-MM-DD>-<slug>.md`.

6. **Distill**: for each source:
   a. Classify source quality per SKILL.md buckets.
   b. Create a source page at `<wiki-root>/_service/sources/`.
   c. Extract knowledge, merge into existing pages or create new ones.
   d. Apply provenance markers. Mark web-sourced claims as extracted if the source states them directly.
   e. `base_confidence`: computed per formula (typically 0.85+ with multiple high-quality sources).
   f. Minimum 250 words per new page.

7. Cross-link all touched pages.

8. Update manifest, log, hot.md, and index.md.

9. Report: sources found, pages created or updated, confidence levels, remaining gaps.

10. **Reflection** (mandatory, not opt-out): run the reflection procedure from SKILL.md. Draft feedback entries for any in-run corrections or ambiguities the user resolved verbally. Ask `[y/n]` per entry. On `y`, append to `<wiki-root>/_service/feedback.md` and log a FEEDBACK line. If nothing to capture, say "nothing to capture" and end.

## Constraints

- Save raw source content before processing.
- Never fabricate claims. If a source does not support a claim, do not make it.
- All shared rules from SKILL.md apply.
