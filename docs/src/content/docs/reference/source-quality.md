---
title: Source quality buckets
description: The fixed quality score assigned to each source type, from academic paper down to LLM self-reflection
---

Every source is classified into one of a fixed set of buckets, and each bucket carries a quality score between 0.0 and 1.0. That score feeds the average-quality term in [confidence scoring](/obsidian-wiki/reference/confidence-scoring/). Higher-trust source types score higher, so a page built from papers and official docs outscores one built from forum threads or chat logs.

| Bucket | Score | Examples |
|---|---|---|
| paper | 1.0 | Academic papers, conference proceedings |
| official | 0.9 | Regulator filings, vendor docs, `.gov` |
| documentation | 0.85 | Well-maintained third-party docs |
| book | 0.8 | Books, technical references |
| repository | 0.75 | GitHub READMEs, codebases |
| article | 0.6 | News articles, industry reports |
| blog | 0.55 | Personal blogs |
| voice-transcript | 0.5 | Meeting and voice-recording transcripts |
| session_transcript | 0.5 | Conversation history, general |
| daily-note | 0.45 | Journal entries |
| forum | 0.4 | Stack Overflow, HN, Reddit |
| unknown | 0.4 | Catch-all |
| claude-chat | 0.3 | LLM conversation history |
| llm_generated | 0.3 | LLM self-reflections |

An entry point can override the bucket default for the sources it holds via its `default_quality` field. See [schemas](/obsidian-wiki/reference/schemas/) for the entry-point schema.
