# obsidian-wiki

A plugin for [Claude Code](https://docs.claude.com/en/docs/claude-code) that turns one or more Obsidian folders into structured knowledge bases. Drop sources into entry-point folders; the agent classifies them, distills the durable content into wiki pages with provenance and confidence tracking, maintains cross-links, and keeps a manifest so reruns are incremental.

Supports any number of wikis. Each wiki has its own configuration in a `CLAUDE.md` file at its root and is registered globally so commands can address it by slug.

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

![architecture](docs/diagrams/01-architecture.html)

| Zone | Contents | Agent permission |
|---|---|---|
| Entry points | Folders you drop sources into. Configured per wiki. | Read, add `processed` frontmatter, move per `post_ingest` rule |
| Structured knowledge | Projects, documentation, resources, people, concepts (whichever you enable) | Read and write |
| `_service/` | Manifest, log, hot list, source summaries, archives, feedback rules | Read and write |

The registry at `~/.claude/obsidian-wiki/wiki-registry.json` lists every wiki and its absolute root path. The plugin reads it on every invocation to resolve which wiki a command targets.

See [`docs/diagrams/01-architecture.html`](docs/diagrams/01-architecture.html) for the visual.

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

Full reference with arguments and side effects in [`docs/QUICK-REFERENCE.md`](docs/QUICK-REFERENCE.md).

## How ingest works on one source

![ingest flow](docs/diagrams/02-ingest-flow.html)

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

![lifecycle](docs/diagrams/03-lifecycle.html)

Five states. `stale` is not a state but a computed overlay (`is_stale = (today - updated) > 90 days`).

- `draft`: written by `/ingest`, `/capture`, or `/update`. Default for everything new.
- `reviewed`: set by a human edit.
- `verified`: set by a human edit. Time alone never demotes it.
- `disputed`: set manually when sources contradict.
- `archived`: terminal. Optional `superseded_by: "[[new-page]]"` field points to the replacement.

Only ingest, capture, and update commands write `draft`. Every other transition requires a human edit.

## Confidence scoring

`base_confidence` is a float between 0.0 and 1.0, stored once per page, recomputed on content change.

```
base_confidence = min(distinct_source_count / 3, 1.0) × 0.5 + avg(source_quality) × 0.5
```

Source quality buckets are defined in [`skills/wiki-core/SKILL.md`](skills/wiki-core/SKILL.md). Per-operation defaults are documented there too: `/capture` defaults to 0.42, `/ingest-claude` to 0.42, `/research` typically reaches 0.85+ with multiple high-quality sources, `/update` to 0.59.

## Provenance

Three markers on individual claims:

| Marker | Meaning |
|---|---|
| *(no marker)* | Extracted: paraphrase of something a source states |
| `^[inferred]` | LLM-synthesized: a connection, generalization, or implication not stated directly |
| `^[ambiguous]` | Sources disagree, or the source is unclear |

The `provenance:` block in the page frontmatter records the approximate mix as fractions. `/lint` recomputes the fractions and flags drift greater than 0.15.

Image-derived claims default to `^[inferred]` unless quoting verbatim visible text.

## Feedback loop

`_service/feedback.md` is per-wiki behavioral memory. Use `/feedback "Stop creating pages shorter than 100 words from quick-notes"` and the rule gets appended (after you confirm) and applied by every subsequent command.

After every write-heavy operation (`/ingest`, `/lint`, `/cross-linker`, `/update`, `/research`, `/query`), the agent runs a reflection step that proposes feedback entries based on corrections you made during the run. Each proposal is a one-line draft you accept or reject with `y/n`. The feedback file is never written without explicit confirmation.

Source content can never produce feedback entries. Only your direct messages via `/feedback` can write to the file.

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
