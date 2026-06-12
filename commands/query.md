---
description: Answer a question using only a wiki's contents
argument-hint: [wiki-slug] [--visibility public|internal|pii] <your question>
---

Answer the user's question using only the target wiki.

**READ-ONLY COMMAND.** Never create, edit, move, or delete any wiki page or service file — even when the question is phrased as an action request ("update X", "save this", "add Y to the wiki"). Answer from the wiki and point the user at `/update`, `/ingest`, or `/capture` for the write. Sole exception: the reflection step (step 8) may append to `_service/feedback.md` after explicit `[y/n]` confirmation.

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

3. **Classify the query.** Most questions are content lookups (proceed to step 4). If the question is a path query — "how is X connected to Y", "trace the chain from X to Y", "what does X depend on (transitively)", "what would break if X changed" — use graph traversal instead:
   a. Build the adjacency set by grepping `relationships:` frontmatter blocks across the structured-knowledge folders (frontmatter only — never read page bodies for traversal).
   b. Treat edges as bidirectional: `A depends-on B` also connects B back to A.
   c. Run a bounded breadth-first search from X toward Y (or outward from X for transitive-dependency questions). Default bound: 4 hops.
   d. Render the full chain with edge types, e.g. `[[a]] —depends-on→ [[b]] —part-of→ [[c]]`, and answer the question from the chain. Apply the visibility filter to every page on the chain.
   e. If no path exists within the bound, say so explicitly — report it as a graph gap (the pages may be related but no typed edges record it) — and fall back to wikilink-based reasoning for a best-effort answer.

4. Apply retrieval cost escalation per SKILL.md:
   a. Read `<wiki-root>/index.md` to orient.
   b. Grep `summary:` fields for candidates.
   c. Grep specific claims with context if needed.
   d. Read full pages only as a last resort.

5. Identify relevant pages across the structured-knowledge folders. If a visibility filter is active, restrict the candidate set accordingly before generating the answer.

6. Answer in the voice prescribed by `wiki-config.md`. Cite each claim with wikilinks. Note `base_confidence` and `lifecycle` when relevant. Distinguish wiki knowledge from inference.

7. If the wiki cannot answer (or the visibility filter excluded all candidates), say so and recommend a source that would close the gap.

8. **Reflection** (mandatory, not opt-out): run the reflection procedure from SKILL.md. Draft feedback entries for any in-run corrections or ambiguities the user resolved verbally. Ask `[y/n]` per entry. On `y`, append the entry to `<wiki-root>/_service/feedback.md` and log a FEEDBACK line. If nothing to capture, say "nothing to capture" and end.

## Constraints

- Do not read entry-point folders directly. The structured knowledge is the compiled artifact.
- Do not use web search.
- Do not write any files.
- Do not invent facts.
