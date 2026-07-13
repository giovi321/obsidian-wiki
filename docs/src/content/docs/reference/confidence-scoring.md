---
title: Confidence scoring
description: How base_confidence is computed from source count and quality, plus the per-operation defaults
---

`base_confidence` is a float between 0.0 and 1.0, stored once per page, recomputed on content change. It is a time-independent quality estimate that answers how much the count and quality of a page's sources justify trusting it.

## The formula

```
base_confidence = min(distinct_source_count / 3, 1.0) × 0.5 + avg(source_quality) × 0.5
```

Sources are deduplicated by normalized source ID before counting. Half the score comes from how many distinct sources back the page (capped at three), and half from the average quality of those sources. See [source quality buckets](/obsidian-wiki/reference/source-quality/) for the per-bucket quality scores and [schemas](/obsidian-wiki/reference/schemas/) for source ID canonicalization.

## Per-operation confidence defaults

When a command creates a page, use these defaults unless the formula yields a different value.

| Operation | base_confidence | Formula |
|---|---|---|
| `/ingest` (single source) | per source | Computed from source quality |
| `/ingest` (multi-source) | computed | `min(N/3, 1) × 0.5 + avg_q × 0.5` |
| `/ingest` (URL source) | computed | `0.17 + 0.5 × source_quality` |
| `/capture` | 0.42 | 1 source at session_transcript 0.5 |
| `/ingest-claude` | 0.42 | 1 source at claude-chat 0.3, rounded up |
| `/research` | typically 0.85+ | Multiple high-quality sources |
| `/update` | 0.59 | Existing page plus new source |
| `/cross-linker` | unchanged | Does not modify confidence |

`/lint` flags pages with `base_confidence < 0.4` as low-confidence, backed by few or weak sources. See [provenance markers](/obsidian-wiki/reference/provenance-markers/) for the separate audit trail on individual claims, and [commands](/obsidian-wiki/using/commands/) for what each operation does.
