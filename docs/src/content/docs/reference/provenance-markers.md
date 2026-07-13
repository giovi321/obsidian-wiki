---
title: Provenance markers
description: The three inline markers that record whether a claim was extracted, inferred, or ambiguous
---

Every claim on a page carries a marker for how sure the agent is that the claim is what the source actually said, as opposed to what the agent inferred. This is the audit trail that separates a direct paraphrase from a plausible-sounding confabulation. See [provenance and confidence](/obsidian-wiki/concepts/provenance-and-confidence/) for why it matters.

## The three markers

| Marker | Meaning |
|---|---|
| *(no marker)* | Extracted: paraphrase of something a source states |
| `^[inferred]` | LLM-synthesized: a connection, generalization, or implication not stated directly |
| `^[ambiguous]` | Sources disagree, or the source is unclear |

Default (no marker) means extracted. The `^[...]` syntax is footnote-adjacent in Obsidian, renders cleanly, and never collides with `[[wikilinks]]`.

## Aggregate mix in frontmatter

The `provenance:` block in the page frontmatter records the approximate mix as fractions (0.0 to 1.0), computed at write time.

```yaml
provenance:
  extracted: 0.80
  inferred: 0.15
  ambiguous: 0.05
```

`/lint` recomputes the fractions from the actual claims and flags drift greater than 0.15 from what the frontmatter claims. See [page frontmatter](/obsidian-wiki/reference/page-frontmatter/) for where this block sits.

## Image-derived claims

Image-derived claims default to `^[inferred]` unless quoting verbatim visible text.
