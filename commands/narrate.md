---
description: Render a cited Markdown readout of a wiki topic using only wiki evidence
argument-hint: [wiki-slug] <topic> [--voice briefing|plain-language|lecturer] [--visibility public] [--save]
---

Render a cited Markdown readout of a wiki topic using only the target wiki's evidence.

**READ-ONLY COMMAND** unless `--save` is passed. Never create, edit, move, or delete any wiki page or service file. The only writes this command ever performs are the `_service/log.md` line, `_service/hot.md` (on `--save` success), and — with `--save` — a single derived file at `<wiki-root>/_readouts/<slug>.md`. Never fill an evidence gap with web knowledge or model memory: omit the claim and name the gap in Coverage.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md`, `<wiki-root>/CLAUDE.md`, and `<wiki-root>/wiki-config.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `narrate` and entries scoped `global`.

2. **Parse the arguments** (after the slug):
   - `--voice <name>`: one of `briefing`, `plain-language`, `lecturer`. Default `briefing`. Voice names are case-sensitive. An unsupported voice is a usage error: print the three supported voices and stop. Do NOT search, write, log, or touch `hot.md`.
   - `--visibility public`: enables filtered mode (same visibility model as `/query`). In filtered mode never read, cite, or expose pages tagged `visibility/internal` or `visibility/pii`. If the wiki's `wiki-config.md` `tags:` list does not include `visibility/*` tags, report that visibility filtering is not configured and continue unfiltered.
   - `--save`: persist the readout (see step 7).
   - Everything else is the `<topic>`. Strip the flags before reading the topic. A non-empty `<topic>` is required: if it is empty, print usage (`/narrate [wiki] <topic> [--voice briefing|plain-language|lecturer] [--visibility public] [--save]`) and stop without searching, writing, logging, or touching `hot.md`.

3. **Retrieve candidates** using retrieval cost escalation per SKILL.md:
   a. Read `<wiki-root>/_service/hot.md` and `<wiki-root>/index.md` first to orient.
   b. Select candidate pages by frontmatter and `summary:` fields before reading any bodies.
   c. Grep specific claims with context, then read full pages only for candidates that survive selection.
   Exclude from candidates: `_service/**`, `_raw/**`, `_archives/**`, `_readouts/**`, and `index.md`. In filtered mode, drop `visibility/internal` and `visibility/pii` pages before reading their bodies.

4. **Build the claim ledger BEFORE writing any prose.** Each ledger item is: a claim, its supporting `[[wikilink]]` citations, and a status — supported fact / inferred connection / ambiguous conflict. Rules:
   - Every factual sentence in the final readout carries adjacent `[[wikilink]]` citations to the page(s) it came from.
   - Mark inferred connections `^[inferred]` and unresolved conflicts `^[ambiguous]`.
   - Never use web knowledge or model memory to fill a gap. Omit the claim and record the gap for the Coverage footer.
   The voice changes prose and ordering only; it never changes the ledger's factual boundary.

5. **No matching pages**: if step 3 yields no candidate pages (or the visibility filter excluded all of them), explain the gap and recommend a source that would close it. Create no file even under `--save`. Skip to step 8 and log `outcome=no_match`.

6. **Render the readout** in the selected voice. Markdown only. Title names the topic and the voice. Use exactly the section skeleton for the chosen voice:

   - **briefing**:
     - `## Bottom line` — 2-3 sentences
     - `## Key points` — bulleted, each point cited
     - `## Caveats`
     - `## Coverage`
   - **plain-language**:
     - `## In short` — no jargon
     - `## How it works` — short paragraphs
     - `## Why it matters`
     - `## Coverage`
   - **lecturer**:
     - `## Overview`
     - `## Build-up` — progressive, concept by concept
     - `## Putting it together`
     - `## Coverage`

   `## Coverage` (the footer, all voices) lists: the cited pages, the count of inferred statements, and the known evidence gaps.

7. **Persistence**:
   - Default (no `--save`): present the readout in the conversation only. Write no file.
   - `--save`: create `<wiki-root>/_readouts/` if needed and write `<wiki-root>/_readouts/<slug>.md`, where `<slug>` is a deterministic filesystem-safe slug of the topic (lowercase, hyphenated, non-alphanumerics collapsed to `-`). Frontmatter: `title`, `topic`, `voice`, `sources`, `created`, `updated`. A readout is DERIVED output: it is excluded from retrieval and is NEVER added to `index.md` or `.manifest.json`.
   - If the `--save` write fails after the readout is drafted: return the readout in the conversation, report that the save failed, and continue to step 8 with `saved=false outcome=write_failed`. Do not touch `hot.md`.

8. **Log** — append ONE structured line to `<wiki-root>/_service/log.md` inside the existing fenced code block:

   ```
   - [ISO-8601] NARRATE topic="<topic>" voice=<voice> result_pages=N mode=normal|filtered saved=true|false outcome=success|no_match|write_failed
   ```

   - No `--save`: log with `saved=false outcome=success` after returning. Do not touch `hot.md`.
   - `--save` success: log `saved=true outcome=success`, then refresh `<wiki-root>/_service/hot.md` with the topic, voice, page count, and the saved readout path.
   - Write failed after drafting (from step 7): log `saved=false outcome=write_failed`. Do not touch `hot.md`.
   - No matching pages (from step 5): log `outcome=no_match`; create no file even under `--save`; do not touch `hot.md`.

## Constraints

- Read-only unless `--save`. The only writes are the log line, `hot.md` (on `--save` success), and the single `_readouts/<slug>.md` file under `--save`.
- Never fabricate. Every factual sentence traces to a `[[wikilink]]` citation; unsupported claims are omitted and named in Coverage.
- No web search and no model memory to fill evidence gaps.
- Readouts are derived output: excluded from retrieval, never added to `index.md` or `.manifest.json`.
- No reflection step.
- All shared rules from SKILL.md apply.
