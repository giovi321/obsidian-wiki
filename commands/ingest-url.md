---
description: Fetch a URL and ingest its content into a wiki
argument-hint: [wiki-slug] <URL>
---

Fetch a URL and ingest it.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. If the command file name is `ingest-url-<slug>.md`, slug is `<slug>`. Otherwise the first argument is the slug; the remaining argument is the URL.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `ingest-url` and entries scoped `global`.

2. Read `<wiki-root>/_service/.manifest.json`.

3. Validate the URL. If invalid, stop and ask for a valid URL.

4. Compute source ID: strip protocol, trailing slashes, query params. Check the manifest. If already ingested and content unchanged, report and stop.

5. Fetch via WebFetch. Convert to markdown.

6. Save raw content to the entry point whose `source_type` is `article` (fallback `other`) at `<entry-point>/<YYYY-MM-DD>-<slug>.md` where `<slug>` is derived from the URL host and path.

7. Classify the source. Assign `source_quality` per SKILL.md buckets.

8. Extract knowledge items. For each:
   - Classify which structured-knowledge folder per `CLAUDE.md` routing rules.
   - If a page exists, integrate, update `sources`, flag contradictions.
   - If new, apply the threshold. Write with full frontmatter. Minimum 250 words.
   - `base_confidence = 0.17 + 0.5 × source_quality` (single URL source).
   - Mark provenance, compute summary ≤200 characters.

9. Create source page at `<wiki-root>/_service/sources/url-<slug>.md`.

10. Cross-link enforcement: 2 out, 1 in.

11. Update manifest, log, hot.md, and index.md if needed.

12. Report: URL fetched, source classified, pages created or updated.

## Constraints

- Save raw content before processing.
- All shared rules from SKILL.md apply.
