---
title: Page frontmatter
description: The standard YAML frontmatter every distilled page carries, including the optional typed relationships field
---

Every distilled page (except source summaries and dashboards) carries a standard block of YAML frontmatter. It records what the page is about, where its claims came from, how much to trust it, and where it sits in the [lifecycle](/obsidian-wiki/concepts/page-lifecycle/).

```yaml
---
title: Page Title
summary: "≤200 characters describing what this page is about."
aliases: [alternate name, abbreviation]
sources:
  - source-id-1
  - source-id-2
created: YYYY-MM-DD
updated: YYYY-MM-DD
base_confidence: 0.65
lifecycle: draft
lifecycle_changed: YYYY-MM-DD
provenance:
  extracted: 0.80
  inferred: 0.15
  ambiguous: 0.05
superseded_by: "[[new-page]]"   # only when lifecycle=archived and a replacement exists
relationships:                   # optional typed edges, see below
  - type: depends-on
    target: "[[other-page]]"
---
```

See [confidence scoring](/obsidian-wiki/reference/confidence-scoring/) for `base_confidence`, [provenance markers](/obsidian-wiki/reference/provenance-markers/) for the `provenance:` block, and [schemas](/obsidian-wiki/reference/schemas/) for how source IDs in `sources:` are canonicalized.

## Typed relationships

The optional `relationships:` field records typed edges between pages. The canonical types are `depends-on`, `part-of`, `relates-to`, `supersedes`, `caused-by`, `used-by`; wikis can extend the vocabulary in `wiki-config.md`. Edges are written only when a source states the relationship explicitly.

`/query` uses them for multi-hop path questions, "how is X connected to Y", "what does X depend on transitively", via a bounded breadth-first search over frontmatter (max 4 hops, edges traversable in both directions), rendering the full chain with edge types. `/lint` flags edges pointing at non-existent pages and unknown edge types. See [relationships](/obsidian-wiki/architecture/relationships/) for the full model.
