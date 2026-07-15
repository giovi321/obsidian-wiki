---
description: Analyze a wiki's graph shape and regenerate its insights report
argument-hint: [wiki-slug]
---

Analyze the shape of a wiki's link graph and regenerate `_service/insights.md`.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md`, `<wiki-root>/CLAUDE.md`, and `<wiki-root>/wiki-config.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `insights` and entries scoped `global`.

2. **Size gate**: count `.md` pages across the structured-knowledge folders declared in `wiki-config.md` `structured_knowledge:`. If there are fewer than 20 pages, tell the user there is not enough structure for graph analysis and stop — do not write `_service/insights.md`, do not log. Also skip if the last line in `<wiki-root>/_service/log.md` is a `REBUILD` (a fresh rebuild has not accumulated a meaningful graph yet); say so and stop.

3. **Analyze the graph**: run the helper, passing the wiki-config structured-knowledge folders comma-joined:

   ```
   python "${CLAUDE_PLUGIN_ROOT}/scripts/graph.py" analyse "<wiki-root>" --structured "<comma-joined structured_knowledge folders>"
   ```

   The helper prints JSON with keys `stats`, `hubs`, `bridges`, `cohesion`, `surprising`, `dead_ends`, `isolated`, `snapshot`. On success it prints JSON only; on a fatal error it prints a single `ERROR: ...` line to stderr and exits 1.

   Fallback: if `python` is unavailable or the script errors (non-zero exit, or `ERROR:` on stderr), compute the same signals by hand, exactly like `/status`'s manifest fallback — glob every `.md` page in the structured-knowledge folders, grep `[[wikilinks]]` in bodies and `target:` inside `relationships:` frontmatter for edges, grep `tags:` (YAML list or inline `#tag`) for tags, and derive `category` from each page's top-level folder. Resolve wikilinks by basename. Then reproduce: top hubs by total degree, articulation points of the undirected graph, tag cohesion for tags with ≥5 pages, cross-category surprising edges, dead ends (zero outgoing) and isolated pages (zero links either direction). Exclude `_service/**`, `_archives/**`, `_raw/**`, `_readouts/**`, `.obsidian/`, and `index.md` from the scan either way.

4. **Diff against the previous run**: read the existing `<wiki-root>/_service/insights.md` and its trailing `<!-- GRAPH_SNAPSHOT: {...} -->` line, if present. Compare that snapshot to the new one from step 3: new pages, removed pages, new links, removed links, pages that gained their first incoming link (newly connected), and pages that lost all incoming links. If there is no previous snapshot, treat every page and link as new and note this is the first run.

5. **Compose the report** into `<wiki-root>/_service/insights.md`, overwriting it freely (it is regenerable). Use these sections in order:
   - `# Wiki insights — [ISO-8601]`
   - `## Anchor pages (top hubs)` — table of `hubs` with columns `Page | Incoming | Outgoing | Kind`. Link each page as `[[page]]`.
   - `## Bridge pages` — table of `bridges` with columns `Page | Components if removed | Joins clusters`. These are cut vertices whose removal fragments the graph; flag them as consolidation-sensitive.
   - `## Tag cluster cohesion` — list the most cohesive tags and the most fragmented tags from `cohesion`. Flag any tag with `cohesion < 0.15` as a cross-linker target (its pages share a tag but barely link each other).
   - `## Surprising connections` — table of `surprising` with columns `Source | Target | Score | Why`.
   - `## Orphan-adjacent` — the `dead_ends` (zero outgoing) and `isolated` (zero links either direction) pages, as two short lists. Note that folder index pages and dashboards legitimately appear here.
   - `## Graph delta since last run` — the step-4 comparison as bullet lists (new/removed pages, new/removed links, newly connected, lost-incoming). On a first run say "first run — no prior snapshot".
   - `## Tier suggestions` — SUGGEST tiers only, never write a `tier:` field to any page. Suggest `tier: anchor` for the top hubs and bridges, `tier: peripheral` for isolated/dead-end pages. Present as a suggestion list the user can act on manually.
   - `## Questions worth asking` — generate from the graph: unresolved `^[ambiguous]` claims found while reading candidate pages, topics only reachable through a single bridge, and isolated pages that ought to connect somewhere. Frame each as a concrete question.
   - End the file with a single line: `<!-- GRAPH_SNAPSHOT: {...compact json...} -->` containing the compact `snapshot` object from step 3 (one line, no pretty-printing), so the next run can diff.

6. Append the log line (see below) to `<wiki-root>/_service/log.md` inside the fenced code block. Update `<wiki-root>/_service/hot.md` with the `_service/insights.md` write.

7. Report to the user: the anchor pages, bridge pages, the most notable surprising connection, the graph delta headline, and where the full report was written. Do not print the whole report.

Log line (exact):

```
- [ISO-8601] INSIGHTS anchors=N bridges=M cohesion_checked=T surprising=S questions=Q delta="+N pages +M links" tier_suggestions=X
```

`anchors` = hubs listed, `bridges` = bridge pages, `cohesion_checked` = tags with ≥5 pages evaluated, `surprising` = surprising connections listed, `questions` = questions generated, `delta` = pages/links added since last run, `tier_suggestions` = tier suggestions made.

## Constraints

- Read-only on wiki content. The only file written is the regenerable `<wiki-root>/_service/insights.md` (plus the `log.md` line and `hot.md` update).
- Never write a `tier:` field to any page. Tier is a suggestion only.
- Never fabricate a connection, hub, or bridge that the graph does not support. If the graph is too sparse, say so.
- No reflection step.
- All shared rules from SKILL.md apply.
