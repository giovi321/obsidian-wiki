---
title: The two config files
description: The two markdown files at each wiki root, one generic and one yours, that every command reads
---

Every wiki has two markdown files at its root, and the agent reads both on every command. One is generic boilerplate you never edit. The other is your configuration and the only file you change to shape the wiki.

## CLAUDE.md, the generic one

`CLAUDE.md` is boilerplate, identical across every wiki this plugin manages. It describes the three-zone architecture, the hard boundary, folder permissions, routing rules, page types, and the reading order. Do not edit it by hand.

Setup writes it from the plugin's template (`templates/CLAUDE.md.tmpl`), copied verbatim with no substitution. When the plugin updates and that template changes, your local copy does not auto-refresh. Run `/upgrade` (or `/upgrade <slug>` for one wiki) to pull the new version; it compares hashes and writes only if the template changed. `CLAUDE.md` must never contain wiki-specific data.

## wiki-config.md, yours

`wiki-config.md` is your wiki's configuration and the file you actually edit. Its frontmatter holds:

- `name`, `slug`, `root`, `created`
- `entry_points`: each with a path, source type, default quality, post-ingest rule, naming convention, and optional exclude list
- `structured_knowledge`: knowledge folders with paths and routing hints
- `dashboards`: each with a path and a type label
- `protected_paths`: knowledge subfolders `/rebuild` must not clear
- `ignore_paths`: files and folders the agent ignores entirely
- `pii_paths`: folders whose pages must carry `visibility/pii`
- `project_thresholds`: months to dormant, to archive
- `tags`: your tag vocabulary
- `writing_style`
- `custom_procedures`: hooks into the command flow, described below

The body holds free-form prose about page types, naming conventions, and any wiki-specific rules. Entry points and all wiki-specific config live here, not in `CLAUDE.md`.

The plugin never touches `wiki-config.md` on update. The documented schema may evolve, but existing config keeps working unless a change is backward-incompatible, and those are flagged with a `BREAKING:` prefix in the commit message. To change configuration, edit this file or re-run `/setup-wiki <slug>`.

See [Entry points](/obsidian-wiki/concepts/entry-points/) for how each entry point is configured, and the [schemas reference](/obsidian-wiki/reference/schemas/) for the full field list.

## Custom procedures hook into the command flow

A wiki can declare `custom_procedures:` in `wiki-config.md` that hook into specific points of the command flow. There are five hook points:

- `pre-ingest`
- `during-ingest`
- `post-ingest`
- `pre-lint`
- `post-lint`

Each entry names the procedure and points to a markdown file under `<wiki-root>/_service/custom-procedures/` that the agent reads at that hook. Use them for wiki-specific extensions like pulling pages from an external service or transforming source content before ingest. If a procedure needs an external tool that is not available in the current session, the agent logs a warning and skips it; it does not abort the parent command.

See [Feedback and custom procedures](/obsidian-wiki/concepts/feedback-and-procedures/) for when to reach for a procedure over a feedback rule, and [custom procedures](/obsidian-wiki/extending/custom-procedures/) for how to author one.

## Why two files

The split keeps the operating contract consistent while letting each wiki look however you want. `CLAUDE.md` and the shared skill hold the machinery that behaves the same across every wiki. `wiki-config.md` holds everything you control. Two people running this plugin can end up with wikis that look nothing alike, because the customizable surface is one file and the machinery underneath is not.

## Where to go next

- [Entry points](/obsidian-wiki/concepts/entry-points/): the folders you drop sources into
- [Structured knowledge](/obsidian-wiki/concepts/structured-knowledge/): where distilled pages live
- [Feedback and custom procedures](/obsidian-wiki/concepts/feedback-and-procedures/): the two ways to teach the agent
