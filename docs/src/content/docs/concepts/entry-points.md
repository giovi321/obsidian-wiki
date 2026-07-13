---
title: Entry points
description: The folders you drop sources into, and the three things each one is configured with
---

Entry points are the folders you drop sources into, the in-tray. Anything you put in one is visible to the next `/ingest`. You can have as many as you want, and you declare them in `wiki-config.md`. Common ones are quick-notes, articles and PDFs, voice transcripts, conversation exports, and image dumps.

## The three settings

Each entry point is configured with three things.

1. Source type: what kind of content to expect (`quick-note`, `article`, `voice-transcript`, `claude-chat`, `image`, and so on). It determines how the source is parsed and its default quality score
2. Default quality: a 0.0 to 1.0 number for how trustworthy this source is on average. A research-paper folder defaults higher (0.9 to 1.0) than a quick-notes folder (0.5) or a chat-export folder (0.3)
3. Post-ingest rule: what happens to the file after the agent has read it

## The post_ingest rule has three values

The `post_ingest` setting decides what happens to a source file once it has been processed.

- `move`: add `processed: true` and `processed_at` frontmatter, then relocate the file to `_service/entry-points/<entry-point>/<YYYY-MM>/`, keeping the original folder clean
- `keep`: add the `processed: true` and `processed_at` frontmatter only, leaving the file in place. Monthly archival (if applicable) still moves files dated before the current month into `<entry-point>/YYYY/YYYY-MM/` subfolders
- `read_only`: add no frontmatter and never move the file. The source is treated as immutable and deduplicated by hash only. Monthly archival still applies

`read_only` is the strictest setting. Use it for entry points whose contents must never be modified by the agent, such as archive folders you maintain by hand, vendor-managed folders, or sync source-of-truth folders.

## The boundary they mark

Entry points are the boundary between "things you saved" and "things the agent has read". Raw sources sit in entry-point folders; distilled pages the agent writes sit in knowledge folders. The two stay separate, so deleting an input does not delete its output.

## Schema

Entry points are declared as a typed list in `wiki-config.md`:

```yaml
entry_points:
  - path: "99_Quick-notes/"
    source_type: quick-note
    default_quality: 0.5
    post_ingest: move          # move, keep, or read_only
    naming_convention: "YYYY-MM-DD Short title.ext"
```

An optional `exclude` list of glob patterns, matched against filenames relative to the entry-point root, marks files that are never processed, moved, or modified, and are not flagged as orphans by `/lint`. For the full field list, see the [entry-point schema](/obsidian-wiki/reference/schemas/).

## Where to go next

- [The two config files](/obsidian-wiki/concepts/config-files/): where entry points are declared
- [Structured knowledge](/obsidian-wiki/concepts/structured-knowledge/): where the distilled output lands
- [Page lifecycle](/obsidian-wiki/concepts/page-lifecycle/): how the agent treats pages once they exist
