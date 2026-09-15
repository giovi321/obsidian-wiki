---
description: Discover co-occurring concept gaps and write cross-cutting synthesis pages
argument-hint: "[wiki-slug] [domain filter]"
---

Discover concept pairs and clusters that co-occur across pages but have no synthesis page, then write cross-cutting synthesis pages for the most valuable gaps.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md`, `<wiki-root>/CLAUDE.md`, and `<wiki-root>/wiki-config.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `synthesize` and entries scoped `global`.

2. **Check `_service/insights.md` FIRST**: if `<wiki-root>/_service/insights.md` exists, read it. `/insights` may already have flagged synthesis candidates (surprising connections, hub pairs, bridge pages). Use those as prior signal before building the co-occurrence map. Note which concepts are hubs so step 3 can score them.

3. **Resolve the synthesis folder**: synthesis pages go into a `synthesis/` subfolder of the wiki's PRIMARY structured-knowledge folder (the first entry in `wiki-config.md` `structured_knowledge:`), unless `wiki-config.md` declares a synthesis location. The fork's lint requires every subfolder to have a `<folder-name>.md` index, so on first run create `<primary-SK>/synthesis/synthesis.md` as the folder index page (a category landing page, exempt from the 250-word minimum).

4. **Co-occurrence map**: scan every non-special page in the structured-knowledge folders (from `wiki-config.md`). Skip `index.md`, `_service/**`, `_raw/**`, `_archives/**`, and `_readouts/**`. For each page collect its outgoing `[[wikilinks]]`, `tags`, and `relationships:` edges. Build a co-occurrence matrix: for each concept pair (A,B), count the pages that link to BOTH. ALSO boost pairs joined by a typed `relationships:` edge (fork-specific signal). Aim for the top 20-30 pairs.

5. **Drop covered pairs**: remove any pair already covered by an existing page in the synthesis folder (read those pages' `sources:` and body links to determine coverage).

6. **Score (pick top 5)**: for each remaining pair, sum:
   - co-occurrence >=5 (+3), 3-4 (+2), 1-2 (+1)
   - cross-folder / cross-category (+2)
   - shares tags but different folder (+1)
   - either concept is a hub in `_service/insights.md` (+1)
   - synthesis would resolve a lint-flagged contradiction (+2)
   - pair joined by a typed relationship edge (+1)
   If the user named a domain (arguments after the slug), filter to that domain first, then score.

7. **Write each synthesis page** (top 5) with fork standard frontmatter plus `category: synthesis`. Title is `<A> × <B>` (the `×` signals a synthesis page). Set `provenance` inferred-heavy (~0.7 inferred), `base_confidence` = min(base_confidence of the input pages), `lifecycle: draft`. Body sections, in order:
   - `## The connection`
   - `## Where they co-occur`
   - `## Cross-cutting insight`
   - `## Tensions and trade-offs`
   - `## Strongest objection` — the best skeptical reading of the synthesis plus one testable search query prefixed `> test:`. NEVER an invented citation.
   - `## Open questions`
   - `## Related`
   Claims are mostly `^[inferred]`; use `^[ambiguous]` where sources disagree. Minimum 250 words. A page that only restates its two sources is not allowed — it must produce a cross-cutting insight neither source states alone.

8. **Back-link**: add `- [[A × B]] — synthesis` to each source page's `## Related` section (create the section if absent).

9. **Report deferred candidates**: list the next ~10 scored-but-skipped pairs so the user sees what was deferred and their scores.

10. Update `<wiki-root>/index.md` (add the new synthesis entries under the synthesis folder heading). Append the log line to `<wiki-root>/_service/log.md`. Update `<wiki-root>/_service/hot.md`.

11. **Reflection** (mandatory, not opt-out): run the reflection procedure from SKILL.md. Draft feedback entries for any in-run corrections or ambiguities the user resolved verbally. Ask `[y/n]` per entry. On `y`, append to `<wiki-root>/_service/feedback.md` and log a FEEDBACK line. If nothing to capture, say "nothing to capture" and end.

Log line (exact):

```
- [ISO-8601] SYNTHESIZE pages_scanned=N synthesis_created=M candidates_skipped=K
```

## Constraints

- Never fabricate a connection; skip pairs with no real conceptual link.
- Never invent a citation in `## Strongest objection`; the testable query prefixed `> test:` stands in for one.
- Synthesis pages are derived pages: they carry `category: synthesis` and live only in the synthesis folder.
- All shared rules from SKILL.md apply.
