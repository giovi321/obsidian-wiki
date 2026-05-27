---
description: Answer a question using only a wiki's contents
argument-hint: [wiki-slug] <your question>
---

Answer the user's question using only the target wiki.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. Command file `query-<slug>.md` resolves to slug `<slug>`; otherwise first argument is slug.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `query` and entries scoped `global`.

2. Apply retrieval cost escalation per SKILL.md:
   a. Read `<wiki-root>/index.md` to orient.
   b. Grep `summary:` fields for candidates.
   c. Grep specific claims with context if needed.
   d. Read full pages only as a last resort.

3. Identify relevant pages across the structured-knowledge folders.

4. Answer in the voice prescribed by `CLAUDE.md`. Cite each claim with wikilinks. Note `base_confidence` and `lifecycle` when relevant. Distinguish wiki knowledge from inference.

5. If the wiki cannot answer, say so and recommend a source that would close the gap.

6. **Reflection** (mandatory, not opt-out): run the reflection procedure from SKILL.md. Draft feedback entries for any in-run corrections or ambiguities the user resolved verbally. Ask `[y/n]` per entry. On `y`, append the entry to `<wiki-root>/_service/feedback.md` and log a FEEDBACK line. If nothing to capture, say "nothing to capture" and end.

## Constraints

- Do not read entry-point folders directly. The structured knowledge is the compiled artifact.
- Do not use web search.
- Do not write any files.
- Do not invent facts.
