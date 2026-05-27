# obsidian-wiki

A plugin for [Claude Code](https://docs.claude.com/en/docs/claude-code) that turns one or more Obsidian folders into structured knowledge bases. Drop sources into entry-point folders; the agent classifies them, distills the durable content into wiki pages with provenance and confidence tracking, maintains cross-links, and keeps a manifest so reruns are incremental.

Supports any number of wikis. Each wiki has its own configuration in a `CLAUDE.md` file at its root and is registered globally so commands can address it by slug.

## Table of contents

- [What it does](#what-it-does)
- [What it is not](#what-it-is-not)
- [Architecture](#architecture)
- [Install](#install)
- [Addressing two or more wikis](#addressing-two-or-more-wikis)
- [The 17 commands](#the-17-commands)
- [Command reference](#command-reference)
- [How ingest works on one source](#how-ingest-works-on-one-source)
- [Page lifecycle](#page-lifecycle)
- [Confidence scoring](#confidence-scoring)
- [Source quality buckets](#source-quality-buckets)
- [Per-operation confidence defaults](#per-operation-confidence-defaults)
- [Provenance](#provenance)
- [Standard page frontmatter](#standard-page-frontmatter)
- [Entry-point schema](#entry-point-schema)
- [Source ID canonicalization](#source-id-canonicalization)
- [Manifest schema](#manifest-schema)
- [Registry schema](#registry-schema)
- [Log format](#log-format)
- [Feedback loop](#feedback-loop)
- [Retrieval cost escalation](#retrieval-cost-escalation)
- [Modes of operation](#modes-of-operation)
- [Customization](#customization)
- [Adding a custom command](#adding-a-custom-command)
- [Removing a wiki](#removing-a-wiki)
- [FAQ](#faq)
- [License](#license)

## What it does

Three things, in this order.

1. **Ingests**: scans folders you nominate as entry points, hashes new and changed files, classifies them by source type, extracts durable knowledge, and writes it into structured-knowledge folders. Each fact carries a provenance marker (extracted, inferred, ambiguous). Each page carries a base confidence computed from the count and quality of its sources.

2. **Maintains**: cross-links pages, surfaces orphans and broken links, flags stale and low-confidence content, tracks page lifecycle (`draft` to `reviewed` to `verified`), and proposes project archival when activity drops below thresholds.

3. **Answers and updates**: answers questions using only the wiki, integrates targeted updates from a URL or free text, captures the durable parts of the current conversation, and runs web research that gets distilled back into pages.

## What it is not

A few clarifications about scope.

The plugin is not a chat-history dump. Conversation sources are scored at 0.3 by default, and the ingest pipeline filters them heavily before any of their content reaches a wiki page; verbatim assistant output is never written.

The plugin is not autonomous. Each command must be invoked explicitly. There is no background indexing, no watcher, no scheduled task.

The plugin does not replace Obsidian. Output is plain markdown with wikilinks and frontmatter. You keep using Obsidian for reading, searching, and graph navigation. Folders and files live in your vault on disk.

## Architecture

Each wiki has three zones plus a registry that lives outside the wiki.

<p align="center">
  <img src="docs/diagrams/01-architecture.svg" width="800" alt="Three-zone architecture: entry points feed the ingest engine, which writes into structured-knowledge folders, with the service folder tracking state.">
</p>

| Zone | Contents | Agent permission |
|---|---|---|
| Entry points | Folders you drop sources into. Configured per wiki. | Read, add `processed` frontmatter, move per `post_ingest` rule |
| Structured knowledge | Projects, documentation, resources, people, concepts (whichever you enable) | Read and write |
| `_service/` | Manifest, log, hot list, source summaries, archives, feedback rules | Read and write |

The registry at `~/.claude/obsidian-wiki/wiki-registry.json` lists every wiki and its absolute root path. The plugin reads it on every invocation to resolve which wiki a command targets.

## Install

Requires Claude Code with plugins enabled.

```bash
# from inside Claude Code
/plugin marketplace add giovi321/obsidian-wiki
/plugin install obsidian-wiki
```

Then run setup to register your first wiki:

```
/setup-wiki
```

The setup command interviews you about wiki name, root path, which entry points to enable, which structured-knowledge folders to enable, dashboard templates, tag vocabulary, project thresholds. It scaffolds the folders, writes the wiki's `CLAUDE.md` from `templates/CLAUDE.md.tmpl`, installs the dashboard templates you picked, and registers the wiki.

To add a second wiki, run `/setup-wiki` again. The addressing mode (suffixed or argument-based) you chose during the first setup carries forward.

## Addressing two or more wikis

Setup asks once how you want to address commands.

| Mode | Example | Trade-off |
|---|---|---|
| Suffixed | `/ingest-work`, `/ingest-personal` | One command file per verb per wiki. Better slash-menu autocomplete; more files. |
| Argument | `/ingest work`, `/ingest personal` | One command file per verb. Fewer files; you type the slug each time. |

Both modes are supported by every command. The setup command generates the suffixed variants for you when you pick that mode.

## The 17 commands

| Command | Does |
|---|---|
| `/setup-wiki` | Register a new wiki or reconfigure an existing one |
| `/ingest` | Ingest sources from entry points and curate changed pages |
| `/ingest-url` | Fetch one URL and ingest it |
| `/ingest-claude` | Ingest the current LLM session or saved conversation exports |
| `/capture` | Save durable knowledge from the current conversation |
| `/query` | Answer using only the wiki contents |
| `/update` | Targeted update of one page with new info |
| `/research` | Search the web for a topic and distill 3 to 5 sources into pages |
| `/lint` | Audit for orphans, broken links, stale pages, contradictions |
| `/cross-linker` | Audit and repair wikilinks across the wiki |
| `/project` | List, create, archive, reactivate, or update project status |
| `/status` | Health summary plus an ingest recommendation |
| `/archive` | Snapshot structured knowledge into `_archives/` |
| `/rebuild` | Archive, then reprocess every source from scratch |
| `/restore` | Restore from a previous archive |
| `/feedback` | Record a behavioral rule in `_service/feedback.md` |
| `/daily-note` | Create today's daily journal note from template |

## Command reference

Suffixed mode shows `/<verb>-<slug>`. Argument mode shows `/<verb> <slug>`. The table below uses argument form for compactness.

| Command | Arguments | Zones written | Side effects |
|---|---|---|---|
| `/setup-wiki` | `[slug]` to reconfigure, empty to add | n/a | Creates wiki folders, writes `CLAUDE.md`, registers wiki, optionally generates per-wiki commands |
| `/ingest <wiki>` | `<file>`, `<URL>`, `quick-notes`, or empty | structured knowledge, `_service/` | Updates manifest, log, hot.md; moves processed files per `post_ingest` |
| `/ingest-url <wiki>` | `<URL>` | structured knowledge, `_service/` | Saves raw content to article entry point; creates source page |
| `/ingest-claude <wiki>` | `session`, `folder [filter]`, or empty | structured knowledge, `_service/` | Heavy filtering; default `base_confidence: 0.42` |
| `/capture <wiki>` | `[topic]` | structured knowledge, `_service/` | `base_confidence: 0.42`; stops if nothing worth saving |
| `/query <wiki>` | `<question>` | none (read-only) | Reflection step at end |
| `/update <wiki>` | `<page> <info>` | target page, `_service/` | Recomputes `base_confidence` and `provenance` |
| `/research <wiki>` | `<topic>` | structured knowledge, `_service/` | Saves raw web content to article entry point; 3 to 5 sources minimum |
| `/lint <wiki>` | empty | `_service/lint-<date>.md`, log, hot.md | Read-only on wiki content |
| `/cross-linker <wiki>` | `[scope]` or `all` | wikilinks and `aliases` only | Never deletes links |
| `/project <wiki>` | `list \| new <name> \| archive <slug> \| reactivate <slug> \| status <slug> <new>` | project folders, index, log | Moves to `_old/` on archive, never deletes |
| `/status <wiki>` | empty | none (read-only) | Computes delta, recommends `/ingest` or `/rebuild` |
| `/archive <wiki>` | `[reason]` | `_service/_archives/<id>/` | Never modifies archived content |
| `/rebuild <wiki>` | `[reason]` | structured knowledge (cleared), `_service/` | Archives first; respects `protected_paths` |
| `/restore <wiki>` | `<archive-id>` or `list` | structured knowledge, `_service/` | Archives current state first |
| `/feedback <wiki>` | `<rule text>` or empty | `_service/feedback.md`, log, hot.md | Confirms before appending; never overwrites |
| `/daily-note <wiki>` | `[YYYY-MM-DD]` | journal entry point only | Does not touch manifest or log |

## How ingest works on one source

<p align="center">
  <img src="docs/diagrams/02-ingest-flow.svg" width="700" alt="Ingest flow: file drop, SHA-256 hash check, classify, extract items, route per CLAUDE.md, write page, post-ingest, update tracking.">
</p>

A source dropped into an entry point:

1. The agent computes SHA-256 and compares with `_service/.manifest.json`. If the hash matches, skip; no re-processing on reruns.
2. Classify the source by type and assign a `source_quality` score from a fixed bucket list (paper, official, documentation, article, blog, voice-transcript, claude-chat, etc.).
3. Extract knowledge items: entities, claims, links. Discard greetings, dead-ends, and low-signal content.
4. Route each item to a structured-knowledge folder per the routing rules in `CLAUDE.md`.
5. Write or update the page with full frontmatter: summary (≤200 chars), `sources`, `base_confidence`, `lifecycle: draft`, `provenance` fractions. Apply inline provenance markers (`^[inferred]`, `^[ambiguous]`) on individual claims.
6. Apply the entry point's `post_ingest` rule: either add `processed: true` and move the file under `_service/entry-points/<entry-point>/<YYYY-MM>/`, or add the frontmatter and leave the file in place.
7. Update the manifest, append a structured one-liner to `_service/log.md`, push the touched page onto `_service/hot.md`.

The minimum page size is 250 words. If a knowledge item cannot reach that threshold, the agent defers it until more material accumulates.

## Page lifecycle

<p align="center">
  <img src="docs/diagrams/03-lifecycle.svg" width="800" alt="Five-state lifecycle: draft to reviewed to verified, with disputed and archived branches, plus a 'stale' read-time overlay.">
</p>

Five states. `stale` is not a state but a computed overlay (`is_stale = (today - updated) > 90 days`).

| State | Entered by | Notes |
|---|---|---|
| draft | `/ingest`, `/capture`, `/update` on first write | Default for everything new |
| reviewed | Human edit only | |
| verified | Human edit only | Time alone never demotes verified |
| disputed | Human edit only | Use when sources contradict on the page |
| archived | Human edit, or ingest setting `superseded_by` | Terminal. Optional `superseded_by: "[[new-page]]"` field points to the replacement |

Only ingest, capture, and update commands write `draft`. Every other transition requires a human edit.

## Confidence scoring

`base_confidence` is a float between 0.0 and 1.0, stored once per page, recomputed on content change.

```
base_confidence = min(distinct_source_count / 3, 1.0) × 0.5 + avg(source_quality) × 0.5
```

Sources are deduplicated by normalized source ID before counting.

## Source quality buckets

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

## Per-operation confidence defaults

| Operation | base_confidence | Formula |
|---|---|---|
| `/ingest` (single source) | per source | Computed from source quality |
| `/ingest` (multi-source) | computed | `min(N/3, 1) × 0.5 + avg_q × 0.5` |
| `/ingest-url` | computed | `0.17 + 0.5 × source_quality` |
| `/capture` | 0.42 | 1 source at session_transcript 0.5 |
| `/ingest-claude` | 0.42 | 1 source at claude-chat 0.3, rounded up |
| `/research` | typically 0.85+ | Multiple high-quality sources |
| `/update` | 0.59 | Existing page plus new source |
| `/cross-linker` | unchanged | Does not modify confidence |

## Provenance

Three markers on individual claims:

| Marker | Meaning |
|---|---|
| *(no marker)* | Extracted: paraphrase of something a source states |
| `^[inferred]` | LLM-synthesized: a connection, generalization, or implication not stated directly |
| `^[ambiguous]` | Sources disagree, or the source is unclear |

The `provenance:` block in the page frontmatter records the approximate mix as fractions. `/lint` recomputes the fractions and flags drift greater than 0.15.

Image-derived claims default to `^[inferred]` unless quoting verbatim visible text.

## Standard page frontmatter

```yaml
---
title: Page Title
summary: "≤200 characters describing what this page is about."
aliases: [alternate name, abbreviation]
sources:
  - source-id-1
  - source-id-2
created: YYYY-MM-DD
updated: YYYY-MM-DD
base_confidence: 0.65
lifecycle: draft
lifecycle_changed: YYYY-MM-DD
provenance:
  extracted: 0.80
  inferred: 0.15
  ambiguous: 0.05
superseded_by: "[[new-page]]"   # only when lifecycle=archived and a replacement exists
---
```

## Entry-point schema

Declared in each wiki's `CLAUDE.md`:

```yaml
entry_points:
  - path: "99_Quick-notes/"
    source_type: quick-note
    default_quality: 0.5
    post_ingest: move          # or "keep"
    naming_convention: "YYYY-MM-DD Short title.ext"
```

`post_ingest: move` relocates the file to `_service/entry-points/<entry-point>/<YYYY-MM>/` after adding `processed: true` frontmatter. `keep` adds the frontmatter only.

## Source ID canonicalization

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

## Registry schema

`~/.claude/obsidian-wiki/wiki-registry.json`:

```json
{
  "version": 1,
  "addressing_mode": "suffixed",
  "wikis": {
    "<slug>": {
      "name": "Display Name",
      "root": "/absolute/path",
      "created": "ISO-8601",
      "command_suffix": "<slug>"
    }
  }
}
```

## Log format

`<wiki-root>/_service/log.md`, inside a fenced code block to keep Obsidian from rendering underscores as italic:

```
- [ISO-8601] OPERATION key=value key="string value" ...
```

Operations: `INGEST`, `CAPTURE`, `LINT`, `ARCHIVE`, `REBUILD`, `RESTORE`, `PROJECT`, `QUERY`, `STATUS`, `CROSS-LINK`, `RESEARCH`, `UPDATE`, `INGEST-URL`, `INGEST-CLAUDE`, `FEEDBACK`.

## Feedback loop

`_service/feedback.md` is per-wiki behavioral memory. Use `/feedback "Stop creating pages shorter than 100 words from quick-notes"` and the rule gets appended (after you confirm) and applied by every subsequent command.

After every write-heavy operation (`/ingest`, `/lint`, `/cross-linker`, `/update`, `/research`, `/query`), the agent runs a reflection step that proposes feedback entries based on corrections you made during the run. Each proposal is a one-line draft you accept or reject with `y/n`. The feedback file is never written without explicit confirmation.

Source content can never produce feedback entries. Only your direct messages via `/feedback` can write to the file.

Format: one entry per line.

```
- YYYY-MM-DD scope. Rule in plain English. Why: ... How: ...
```

Scope is a command name without any per-wiki suffix (`ingest`, `lint`, `cross-linker`, `update`, `research`, `query`, `capture`, `ingest-claude`, `ingest-url`, `project`, `status`, `archive`, `rebuild`, `restore`, `daily-note`) or `global`.

## Retrieval cost escalation

Commands that read the wiki use the cheapest primitive that answers the question, escalating only when insufficient.

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

## Customization

Everything wiki-specific lives in `<wiki-root>/CLAUDE.md`. Edit it directly to:

- Change which folders are entry points and their `source_type`, `default_quality`, `post_ingest`, `naming_convention`.
- Change which folders are structured knowledge and their purpose.
- Change routing rules (what kinds of items go where).
- Change project thresholds (months to dormant, to archive).
- Change writing style or tag vocabulary.
- Add new page types with their own frontmatter fields.

The shared logic in [`skills/wiki-core/SKILL.md`](skills/wiki-core/SKILL.md) is plugin-wide and applies to every wiki. Edit it only when you want a structural change across all wikis.

## Adding a custom command

The plugin ships 17 canonical commands plus `/setup-wiki`. To add a custom verb (say, `/digest` that emails you a weekly summary):

1. Create `commands/digest.md` in the plugin folder, or `~/.claude/commands/digest.md` for user scope.
2. Use the same procedure-step structure as the shipped commands. Step 1 reads `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`.
3. If you want per-wiki suffixed variants, run `/setup-wiki --regenerate-commands`.

## Removing a wiki

`/setup-wiki <slug> --remove`. The command deletes the registry entry and removes generated suffixed command files. It does NOT touch the wiki's folder or content; you delete those yourself.

## FAQ

**Does this work without Obsidian?** Yes. The output is plain markdown with wikilinks and frontmatter. Obsidian is the easiest viewer but anything that renders markdown will work. The dashboards (todo, canvas) use Obsidian-specific plugins (Tasks, Dataview, Canvas) and will not render in other viewers.

**Can I use it with a vault that has other folders I don't want touched?** Yes. Declare the wiki root as a sub-folder of the vault. The agent's "hard boundary" rule restricts it to that sub-folder; everything outside is off-limits.

**Does ingest run automatically?** Every command runs only when you type it. There is no background indexing.

**What happens if I edit a wiki page by hand?** The lifecycle state moves to `reviewed` or `verified` when you set it. `/lint` and `/cross-linker` respect your edits. The next `/ingest` will not overwrite hand-edited content, only merge new information.

**How is this different from RAG or vector search over my vault?** RAG retrieves raw chunks at query time. This plugin compiles sources into curated pages once, then queries against those pages. The pages are durable artifacts. You can read them, edit them, and refactor them. The raw sources can be archived or deleted once distilled; the knowledge stays.

## License

MIT. See [LICENSE](LICENSE).
