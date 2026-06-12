---
description: Fetch a URL and ingest its content into a wiki
argument-hint: [wiki-slug] <URL>
---

Alias for `/ingest [wiki-slug] <URL>`. URL sources are handled directly by `/ingest` — pass the URL as the source argument.

Args: $ARGUMENTS

## Procedure

Run `/ingest` with the URL as the source argument. All URL-specific logic (dedup, slug derivation, raw-file naming, source page creation, confidence formula) is defined in `/ingest` step 5 under the URL work-set path.
