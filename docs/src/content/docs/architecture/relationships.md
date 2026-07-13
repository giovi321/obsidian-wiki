---
title: Typed relationships
description: The typed edges between pages that make deterministic multi-hop path queries possible
---

Typed relationships are the graph that lets `/query` answer path questions deterministically instead of guessing by similarity. Pages declare typed edges to other pages in frontmatter, and the agent walks those edges to answer questions like "how is X connected to Y" or "what does X depend on transitively".

## The optional relationships field

The optional `relationships:` frontmatter field declares typed edges between pages.

```yaml
relationships:
  - type: depends-on
    target: "[[page-slug]]"
```

Pages without the field are valid. See [Page frontmatter](/obsidian-wiki/reference/page-frontmatter/) for where this sits in the full frontmatter.

## Canonical edge types

Six canonical edge types cover most cases:

- `depends-on`
- `part-of`
- `relates-to`
- `supersedes`
- `caused-by`
- `used-by`

A wiki may extend the vocabulary by documenting additional types in `wiki-config.md`. `/lint` flags any type outside the canonical plus wiki-declared set.

## Rules for writing edges

- Edges are recorded only when a source states the relationship explicitly. The content trust and provenance rules apply; never infer edges speculatively
- Edges are traversable in both directions for path queries. `A depends-on B` also answers "what depends on B"
- The graph is read frontmatter-only. Commands grep `relationships:` blocks and never read page bodies for traversal
- A `target` must be an existing page or a deliberate redlink. `/lint` flags targets that do not exist and unknown edge types

## Why this makes deterministic path queries possible

Because the edges are typed, explicit, and stored in frontmatter, `/query` can walk them mechanically rather than ranking by embedding similarity. Path questions run a bounded breadth-first search over the frontmatter graph: at most 4 hops, edges traversable in both directions, rendering the full chain with edge types along the way. The result is a path you can inspect and reproduce, not a similarity score you have to trust. Recording an edge only when a source states it keeps the graph honest, so a traversal never leans on a connection the agent merely guessed. `/lint` keeps the graph sound by flagging edges that point at pages that do not exist and edge types outside the allowed set.

## Related reference

- [Page frontmatter](/obsidian-wiki/reference/page-frontmatter/): the full frontmatter block
- [Structured knowledge](/obsidian-wiki/concepts/structured-knowledge/): the pages the edges connect
- [Commands](/obsidian-wiki/using/commands/): `/query` and `/lint`
