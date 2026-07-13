---
title: Customization
description: Everything you customize lives in wiki-config.md; CLAUDE.md and the shared skill stay fixed
---

Everything you customize lives in two files at each wiki root, and only one of them is yours to edit. `wiki-config.md` holds every customizable field. `CLAUDE.md` and the shared skill hold the machinery that stays the same across every wiki.

## The two files at each wiki root

`CLAUDE.md` is generic and identical across every wiki this plugin manages: the three-zone architecture, hard boundary, folder permissions, routing rules, page types, and reading order. Do not edit it by hand. It is not hand-edited; it is refreshed from the plugin template when the schema changes.

`wiki-config.md` is yours. Edit its YAML frontmatter to change how the wiki behaves.

## What you edit in wiki-config.md

- Which folders are entry points, and their `source_type`, `default_quality`, `post_ingest`, `naming_convention`
- Which folders are structured knowledge, and their purpose
- Project thresholds (months to dormant, to archive)
- Writing style and tag vocabulary
- Dashboards and protected paths

The body of `wiki-config.md` holds free-form prose about page types, naming conventions, and any wiki-specific rules.

## The shared skill is plugin-wide

The shared logic in `skills/wiki-core/SKILL.md` is plugin-wide and applies to every wiki the same way. Edit it only for a structural change across all wikis, not to customize one wiki.

## Where to go next

- [The two config files](/obsidian-wiki/concepts/config-files/): how CLAUDE.md and wiki-config.md split responsibility
- [Schemas](/obsidian-wiki/reference/schemas/): the full field list for wiki-config.md
- [Custom procedures](/obsidian-wiki/extending/custom-procedures/): multi-step routines that hook into the command flow
- [Plugin updates](/obsidian-wiki/extending/plugin-updates/): what an update touches and what it never touches
