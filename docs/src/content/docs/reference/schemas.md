---
title: Schemas
description: Entry-point, source ID, manifest, registry, and log schemas that define the wiki's on-disk state
---

The wiki's operating state lives in a handful of well-defined structures on disk. This page collects the entry-point schema, source ID canonicalization rules, the manifest and registry schemas, and the log format.

## Entry-point schema

Entry points are declared in each wiki's `wiki-config.md`. See [the two config files](/obsidian-wiki/concepts/config-files/) and [entry points](/obsidian-wiki/concepts/entry-points/) for context.

```yaml
entry_points:
  - path: "99_Quick-notes/"
    source_type: quick-note
    default_quality: 0.5
    post_ingest: move          # move, keep, or read_only
    naming_convention: "YYYY-MM-DD Short title.ext"
```

`post_ingest` takes three values. `move` relocates the file to `_service/entry-points/<entry-point>/<YYYY-MM>/` after adding `processed: true` frontmatter. `keep` adds the frontmatter only. `read_only` adds no frontmatter and never moves the file; the source is deduplicated by hash but otherwise left untouched.

## Source ID canonicalization

Every source referenced in `sources:` frontmatter or in the manifest uses a canonical ID for deduplication.

| Source type | Rule | Example |
|---|---|---|
| Academic paper | DOI > arXiv ID > `<author>-<year>-<slug>` | `10.1234/foo`, `arxiv:1706.03762` |
| GitHub repo | `github.com/<owner>/<repo>` | `github.com/owner/repo` |
| Official docs | `<canonical-host>/<product>` | `docs.python.org/3` |
| Blog post | `<host>/<author>` | `example.com/author` |
| Book | `isbn:<ISBN>` or `<author>-<year>-<short-title>` | `isbn:9780134685991` |
| Session transcript | `<agent>/<session-id>` | `claude.ai/abc123` |
| Quick note | relative path at ingest time | `99_Quick-notes/20260510-1133.md` |
| URL | canonical URL (no protocol, no trailing slash) | `example.com/article-slug` |
| Other | canonical URL or file path | `forum.example.com/thread/xyz` |

Rules: strip protocol (`https://`), trailing slashes, query params. For GitHub, stop at `owner/repo`. When the same content arrives from two paths, collapse to a single ID (prefer DOI > URL > file path).

## Manifest schema

`<wiki-root>/_service/.manifest.json`:

```json
{
  "version": 1,
  "updated": "ISO-8601",
  "sources": {
    "<source-id>": {
      "sha256": "hex digest",
      "ingested_at": "ISO-8601",
      "source_type": "article",
      "source_quality": 0.6,
      "wiki_pages": ["path/to/page.md"],
      "projects_touched": ["project-slug"]
    }
  },
  "curated_pages": {
    "<page-path>": {
      "sha256": "hex digest",
      "curated_at": "ISO-8601"
    }
  }
}
```

File-based source keys must always be stored as absolute paths (no `~`, no relative paths). Run `python scripts/manifest.py normalize <manifest-path>` to repair an existing manifest and merge duplicates. Set `WIKI_SKIP_PROJECTS=slug1,slug2` to exclude specific projects from the delta computation (`scripts/manifest.py delta` respects this).

## Registry schema

`~/.claude/obsidian-wiki/wiki-registry.json`:

```json
{
  "version": 1,
  "vault_root": "/absolute/path/to/vault",
  "wikis": {
    "<slug>": {
      "name": "Display Name",
      "root": "/absolute/path",
      "created": "ISO-8601"
    }
  }
}
```

`vault_root` is the parent directory shared by all registered wikis. It is set at the first `/setup-wiki` run and records where the shared docs at `<vault_root>/_service/docs/` live.

## Log format

`<wiki-root>/_service/log.md`, inside a fenced code block to stop Obsidian rendering underscores as italic:

```
- [ISO-8601] OPERATION key=value key="string value" ...
```

Operations: `INGEST`, `CAPTURE`, `LINT`, `ARCHIVE`, `REBUILD`, `RESTORE`, `PROJECT`, `QUERY`, `STATUS`, `CROSS-LINK`, `RESEARCH`, `UPDATE`, `INGEST-CLAUDE`, `FEEDBACK`, `PROMOTE`, `UPGRADE`. URL sources log as `INGEST` with `source_type=url`.
