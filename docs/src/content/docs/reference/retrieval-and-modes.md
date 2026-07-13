---
title: Retrieval and modes
description: How read commands escalate through retrieval primitives, and the three modes ingest can run in
---

Two operating rules govern how commands touch the wiki: read commands use the cheapest primitive that answers the question, and write operations run in one of three modes.

## Retrieval cost escalation

Commands that read the wiki use the cheapest primitive that answers the question, escalating only when it falls short.

| Need | Primitive |
|---|---|
| Does the page exist? Title or category? | Read `index.md`; grep frontmatter |
| One- or two-sentence preview | Read `summary:` field |
| Specific claim or section | Grep with `-A`/`-B` context |
| Full page content | Read entire file |
| Cross-page relationships | Grep wikilinks or walk from a known page |

Commands that apply this: `/query`, `/status`, `/cross-linker`, `/lint`. Exempt: `/ingest`, `/rebuild`.

## Modes of operation

| Mode | Trigger | Behavior |
|---|---|---|
| Append | Normal `/ingest` | Process new and changed via SHA-256 |
| Rebuild | `/rebuild` | Archive, clear, reprocess all |
| Restore | `/restore <id>` | Archive current, copy from `_archives/` |

See [commands](/obsidian-wiki/using/commands/) for what each verb does and [schemas](/obsidian-wiki/reference/schemas/) for the manifest that append mode diffs against.
