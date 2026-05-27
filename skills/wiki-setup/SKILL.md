---
name: wiki-setup
description: >
  Interview schema, template substitution rules, and registry write protocol for the
  /setup-wiki command. Defines the standard entry-point suggestions, the substitution
  map for CLAUDE.md and template files, and the validation rules applied before writing
  to disk.
---

# Wiki setup, interview schema and substitution rules

## Standard entry-point suggestions

When the user runs `/setup-wiki`, offer this catalog. The user picks which to enable and may override paths. Defaults are conservative; nothing is enabled unless the user opts in.

| Suggestion key | Default path | source_type | Default quality | Default post_ingest | Naming convention |
|---|---|---|---|---|---|
| quick-notes | `99_Quick-notes/` | quick-note | 0.5 | move | `YYYY-MM-DD Short title.ext` |
| other | `98_Other/` | article | 0.6 | move | `YYYY-MM-DD <slug>.ext` |
| voice-transcripts | `2_Transcripts/` | voice-transcript | 0.5 | keep | (vendor-defined; no rename) |
| daily-journal | `1_Journal/` | daily-note | 0.45 | keep | `YYYY-MM-DD.md` |
| llm-conversations | `4_Claude-conversations/` | claude-chat | 0.3 | move | `YYYY-MM-DD <slug>.md` |
| inbox-pdfs | `97_PDFs/` | article | 0.6 | move | `YYYY-MM-DD <slug>.pdf` |
| images | `96_Images/` | image | 0.4 | move | `YYYY-MM-DD <slug>.<ext>` |

For each enabled suggestion, ask:
1. Confirm or override the path.
2. Confirm or override `default_quality`.
3. Confirm or override `post_ingest` (`move` or `keep`).
4. Confirm or override the naming convention.

The user may also add custom entry points beyond this catalog. For each custom one, ask path, source_type (must be a bucket listed in `wiki-core` SKILL.md), default_quality, post_ingest, naming_convention.

## Standard structured-knowledge suggestions

| Suggestion key | Default path | Purpose | Routing hint |
|---|---|---|---|
| projects | `1_Projects/` | projects | Active work, organized by intent category |
| documentation | `3_Documentation/` | documentation | LLM-curated knowledge articles |
| resources | `2_Resources/` | resources | Lists, references, recipes, places, contacts |
| people | `5_People/` | people | Person pages |
| concepts | `6_Concepts/` | concepts | Companies, markets, frameworks, technical concepts |

The user picks which to enable, overrides paths, and may add custom folders. Each folder gets a stub `<folder-name>.md` index after scaffolding.

## Interview answer schema

The interview produces this object, which the setup command persists into `CLAUDE.md` and the registry:

```yaml
name: "Wiki display name"
slug: "wiki-slug"
root: "/absolute/path"
entry_points:
  - path: "99_Quick-notes/"
    source_type: quick-note
    default_quality: 0.5
    post_ingest: move
    naming_convention: "YYYY-MM-DD Short title.ext"
structured_knowledge:
  - path: "1_Projects/"
    purpose: projects
    routing_hint: "Active work, organized by intent category"
dashboards:
  - path: "0_To-do.md"
    type: todo
protected_paths:
  - "2_Resources/Recipes/"
tags:
  - "#work"
  - "#research"
writing_style: "No empty line after headings. No trailing summaries unless asked. Inline provenance markers on documentation pages only."
project_thresholds:
  active_to_dormant: 6
  dormant_to_archive: 4
  completed_to_archive: 6
templates_to_install:
  - todo-dashboard
  - daily-note
  - canvas-dashboard
```

## Per-wiki files written at setup

Setup writes two files at the wiki root and several inside `_service/`:

| File | Source template | Substitution? |
|---|---|---|
| `CLAUDE.md` | `templates/CLAUDE.md.tmpl` | No, copied verbatim |
| `wiki-config.md` | `templates/wiki-config.md.tmpl` | Yes, all placeholders below |
| `index.md` | `templates/index.md.tmpl` | `{{wiki_name}}` only |
| `_service/.manifest.json` | `templates/manifest.json.tmpl` | `{{iso_timestamp}}` |
| `_service/log.md` | empty | — |
| `_service/hot.md` | `templates/hot.md.tmpl` | `{{iso_timestamp}}` |
| `_service/feedback.md` | `templates/feedback.md.tmpl` | `{{today}}` |

`CLAUDE.md` is intentionally identical across every wiki this plugin manages. It must not contain any wiki-specific data. All wiki-specific data lives in `wiki-config.md`.

## Template substitution map (for `wiki-config.md` and the dashboard templates)

| Placeholder | Source |
|---|---|
| `{{wiki_name}}` | `name` |
| `{{wiki_slug}}` | `slug` |
| `{{wiki_root}}` | `root` |
| `{{wiki_root_basename}}` | basename of `root` (used in Tasks/Dataview queries) |
| `{{projects_path}}` | first `structured_knowledge` entry with `purpose: projects`; empty if none |
| `{{documentation_path}}` | first entry with `purpose: documentation` |
| `{{resources_path}}` | first entry with `purpose: resources` |
| `{{people_path}}` | first entry with `purpose: people` |
| `{{concepts_path}}` | first entry with `purpose: concepts` |
| `{{quicknotes_path}}` | first entry point with `source_type: quick-note` |
| `{{other_path}}` | first entry point with `source_type: article` |
| `{{journal_path}}` | first entry point with `source_type: daily-note` |
| `{{transcripts_path}}` | first entry point with `source_type: voice-transcript` |
| `{{conversations_path}}` | first entry point with `source_type: claude-chat` |
| `{{tags_block}}` | YAML-rendered list, each tag indented two spaces with `- ` prefix |
| `{{writing_style_indented}}` | `writing_style` text, indented two spaces for YAML pipe block |
| `{{active_to_dormant_months}}` | `project_thresholds.active_to_dormant` |
| `{{dormant_to_archive_months}}` | `project_thresholds.dormant_to_archive` |
| `{{completed_to_archive_months}}` | `project_thresholds.completed_to_archive` |
| `{{entry_points_block}}` | YAML-rendered `entry_points` array (`-` items, two-space indent) |
| `{{structured_knowledge_block}}` | YAML-rendered `structured_knowledge` array |
| `{{dashboards_block}}` | YAML-rendered `dashboards` array (empty list `[]` if none) |
| `{{protected_paths_block}}` | YAML-rendered `protected_paths` array (empty list `[]` if none) |
| `{{today}}` | current date `YYYY-MM-DD` |
| `{{iso_timestamp}}` | current timestamp ISO-8601 |

Placeholders left unresolved by this map are an error: abort and report which placeholder failed.

## Validation rules before writing to disk

Refuse to scaffold if any of these fail:

- `slug` is not kebab-case (lowercase letters, digits, hyphens; cannot start with a digit).
- `slug` already exists in the registry and the user is in new-wiki mode.
- `root` is not absolute.
- `root` is inside another registered wiki's `root` (no nested wikis).
- Any `entry_points[].path` or `structured_knowledge[].path` overlaps with another (path prefix collision within the wiki).
- Any `source_type` is not listed in `wiki-core` SKILL.md "Source quality buckets".
- `project_thresholds.*` are not positive integers.

## Registry write protocol

Read `~/.claude/obsidian-wiki/wiki-registry.json` once. Compute the new state. Write to `~/.claude/obsidian-wiki/wiki-registry.json.tmp`. Verify the JSON parses. Rename atomically to `wiki-registry.json`.

If the registry file is malformed (does not parse), abort and ask the user to fix it before proceeding. Never overwrite a malformed registry; that would lose all other wiki entries.

Schema:

```json
{
  "version": 1,
  "vault_root": "/absolute/path/to/vault",
  "wikis": {
    "<slug>": {
      "name": "Display Name",
      "root": "/absolute/path/to/wiki/root",
      "created": "ISO-8601"
    }
  }
}
```

`vault_root` is established at first wiki registration (default: parent of the first wiki's root, asked of the user once). All wikis share it. The shared docs live at `<vault_root>/_service/docs/`.

## Shared docs install

Every `/setup-wiki` run, after the registry is updated, refreshes `<vault_root>/_service/docs/`:

1. Create the directory if missing.
2. Copy `${CLAUDE_PLUGIN_ROOT}/README.md` to `<vault_root>/_service/docs/README.md`. Overwrite.
3. Copy `${CLAUDE_PLUGIN_ROOT}/docs/diagrams/*.svg` to `<vault_root>/_service/docs/diagrams/`. Overwrite each.

The same refresh logic is exposed as `/update-docs` for between-setup refreshes (e.g. after the plugin is updated via `/plugin update obsidian-wiki`).

## Removing a wiki

Reconfigure mode supports a `--remove` flag. When set:
- Confirm twice.
- Delete the registry entry.
- Do NOT delete the wiki's folder or any of its content. The user removes their data manually.
