---
title: Schemas
description: Entry-point, source ID, manifest, registry, and log schemas that define the wiki's on-disk state
---

The wiki's operating state lives in a handful of well-defined structures on disk. This page collects the wiki-config field list, the entry-point and dashboard schemas, source ID canonicalization rules, the manifest and registry schemas, and the log format.

## wiki-config field list

Every field the generated `wiki-config.md` declares. See [the two config files](/obsidian-wiki/concepts/config-files/) for what the file is and why it is separate from `CLAUDE.md`.

| Field | Type | Purpose |
|---|---|---|
| `name`, `slug`, `root` | string | Display name, short command argument, absolute path |
| `created` | date | Set once at setup |
| `entry_points` | list | Folders read as sources. Schema below |
| `structured_knowledge` | list | Folders written to, each with `path`, `purpose`, `routing_hint` |
| `dashboards` | list | Dashboard files. Schema below |
| `protected_paths` | list | Knowledge subfolders `/rebuild` must not clear |
| `ignore_paths` | list | Files and folders the agent ignores entirely |
| `pii_paths` | list | Folders whose pages must carry `visibility/pii`. Optional |
| `project_thresholds` | map | `active_to_dormant_months`, `dormant_to_archive_months`, `completed_to_archive_months` |
| `tags` | list | The only tags the agent puts on new pages |
| `writing_style` | block string | Prose rules applied to every page written |
| `custom_procedures` | list | Hooks into the command flow, each with `name`, `when`, `procedure`, `description` |

Unset optional fields are written as an empty list. The plugin never rewrites this file on update, so adding a field the documented schema gained later is a manual edit.

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

## Dashboard schema

```yaml
dashboards:
  - path: "0_To-do.md"
    type: todo
  - path: "0_Board.md"
    type: dataviewjs-board
```

`path` is relative to the wiki root. `type` is a free-form label describing how the dashboard renders; it is not validated and no command branches on it. It exists so a wiki with more than one dashboard can tell them apart, and so the labels stay comparable across wikis. Labels in use: `todo` for a page of Tasks queries, `canvas` for an Obsidian Canvas, `dataviewjs-board` for a DataviewJS view.

The agent rewrites a listed dashboard only on an explicit restructure request, never as a side effect of another command. That is the whole reason to declare them: a dashboard is a hand-shaped page, and listing it marks it as one.

### Dashboards the plugin does not ship

`/setup-wiki` installs a todo dashboard and, optionally, a canvas dashboard. Anything else is yours to build, and the sensible place to build it is a Dataview or DataviewJS block in an ordinary vault note rather than a custom Obsidian plugin.

The reason is sync. Obsidian sync mechanisms differ in whether they carry `.obsidian/`; Self-hosted LiveSync, for one, can be configured with `syncInternalFiles: false` and `usePluginSync: false`, in which case a community plugin has to be installed and updated by hand on every device, while a note and a sibling script replicate for free. Check how your own sync is configured before choosing.

Two consequences worth knowing if you go that way. Dataview's JavaScript Queries setting is per-device, so it needs enabling once on each; when it is off the note shows a raw code block instead of a board. And a `dv.view()` script gets the same `app` object a plugin gets, so anything a plugin could do to the vault, the script can do too — including writing to your notes. Treat it with the same suspicion as a plugin.

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

File-based source keys use one style per manifest, consistently: either absolute paths or wiki-root-relative POSIX paths (`2_Plaud/2026-08-19.md`). Tilde-prefixed keys are never valid, since `~` resolves differently per machine; run `python scripts/manifest.py normalize <manifest-path>` to expand them and merge duplicates. `normalize` leaves relative keys as they are, because they are what source pages record as `source_id`. `scripts/manifest.py delta` matches a walked file against every plausible key spelling, so it works under either style as long as it is run from the wiki root. Set `WIKI_SKIP_PROJECTS=slug1,slug2` to exclude specific projects from the delta computation (`delta` respects this).

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
