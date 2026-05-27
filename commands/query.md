---
description: Answer a question using only a wiki's contents
argument-hint: [wiki-slug] [--visibility public|internal|pii] <your question>
---

Answer the user's question using only the target wiki.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md`, `<wiki-root>/CLAUDE.md`, and `<wiki-root>/wiki-config.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `query` and entries scoped `global`.

2. **Parse visibility filter** (optional). If `$ARGUMENTS` contains a flag of the form `--visibility <level>` (e.g. `--visibility public`, `--visibility internal`), set the filter level. Strip the flag from the question before answering.
   - `public`: include only pages tagged `visibility/public`.
   - `internal`: include pages tagged `visibility/internal` or no visibility tag at all. Exclude `visibility/public`-only filtering.
   - `pii`: include only pages tagged `visibility/pii`.
   - No flag: include all pages (no visibility filtering applied).

   Visibility tags are optional per wiki. If the wiki's `wiki-config.md` `tags:` list does not include `visibility/*` tags, ignore the filter and report that visibility filtering is not configured.

3. Apply retrieval cost escalation per SKILL.md:
   a. Read `<wiki-root>/index.md` to orient.
   b. Grep `summary:` fields for candidates.
   c. Grep specific claims with context if needed.
   d. Read full pages only as a last resort.

4. Identify relevant pages across the structured-knowledge folders. If a visibility filter is active, restrict the candidate set accordingly before generating the answer.

5. Answer in the voice prescribed by `wiki-config.md`. Cite each claim with wikilinks. Note `base_confidence` and `lifecycle` when relevant. Distinguish wiki knowledge from inference.

6. If the wiki cannot answer (or the visibility filter excluded all candidates), say so and recommend a source that would close the gap.

7. **Reflection** (mandatory, not opt-out): run the reflection procedure from SKILL.md. Draft feedback entries for any in-run corrections or ambiguities the user resolved verbally. Ask `[y/n]` per entry. On `y`, append the entry to `<wiki-root>/_service/feedback.md` and log a FEEDBACK line. If nothing to capture, say "nothing to capture" and end.

## Constraints

- Do not read entry-point folders directly. The structured knowledge is the compiled artifact.
- Do not use web search.
- Do not write any files.
- Do not invent facts.
