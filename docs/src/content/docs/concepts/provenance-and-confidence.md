---
title: Provenance and confidence
description: Two markers that keep pages honest, where each claim came from and how much to trust the page
---

An LLM sounds equally confident whether or not it has evidence. Provenance and confidence are the two mechanisms that stop a confident-sounding sentence and a well-sourced fact from ever looking the same on the page.

## Provenance marks each claim

When the agent writes a page, every claim is marked with how sure the agent is that the claim is what the source actually said, as opposed to what the agent inferred. Three states:

- No marker: the agent is paraphrasing something a source states directly. This is the default
- `^[inferred]`: the agent connected dots across sources, or made a generalization the sources do not state outright
- `^[ambiguous]`: sources disagree, or the source language is unclear

This matters because without markers you cannot tell a direct paraphrase from a plausible-sounding confabulation. With them, a reader (you, six months from now) can see at a glance which claims to trust and which to check. Provenance is the audit trail that turns a confident text blob into something you can check.

The page frontmatter records the aggregate mix as fractions. `/lint` recomputes the actual mix and flags pages where it has drifted more than 0.15 from what the frontmatter claims. Image-derived claims default to `^[inferred]` unless quoting verbatim visible text.

For the full marker table, see the [provenance markers reference](/obsidian-wiki/reference/provenance-markers/).

## Confidence scores the whole page

Where provenance is per-claim, confidence is per-page. Each page carries a `base_confidence`, a float between 0.0 and 1.0, computed from the count and quality of its sources:

```
base_confidence = min(distinct_source_count / 3, 1.0) × 0.5 + avg(source_quality) × 0.5
```

Sources are deduplicated by normalized source ID before counting, and the score is recomputed whenever the page's content changes. A page backed by three high-quality sources scores near 1.0; a single chat-export source scores low. `/lint` flags pages with `base_confidence < 0.4` as low-confidence, so weak pages are visible rather than buried.

For the source quality buckets and per-operation defaults, see the [confidence scoring reference](/obsidian-wiki/reference/confidence-scoring/).

## Where to go next

- [Provenance markers](/obsidian-wiki/reference/provenance-markers/): the full marker table and drift rules
- [Confidence scoring](/obsidian-wiki/reference/confidence-scoring/): the formula, buckets, and per-operation defaults
- [Page lifecycle](/obsidian-wiki/concepts/page-lifecycle/): the trust signal that tracks human review
