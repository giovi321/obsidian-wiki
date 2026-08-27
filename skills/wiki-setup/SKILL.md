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
3. Confirm or override `post_ingest` (`move`, `keep`, or `read_only`).
4. Confirm or override the naming convention.
5. Optionally specify an `exclude` list (filenames to skip during ingest).

The user may also add custom entry points beyond this catalog. For each custom one, ask path, source_type (must be a bucket listed in `wiki-core` SKILL.md), default_quality, post_ingest, naming_convention, exclude.

### `post_ingest` semantics

| Value | What happens to source files after ingest |
|---|---|
| `move` | Add `processed: true` and `processed_at: YYYY-MM-DD` frontmatter, then relocate the file to `_service/entry-points/<entry-point-name>/<YYYY-MM>/`. |
| `keep` | Add `processed: true` and `processed_at: YYYY-MM-DD` frontmatter. Leave the file in place. Monthly archival (if applicable) still moves files dated before the current month into `<entry-point>/YYYY/YYYY-MM/` subfolders. |
| `read_only` | Do NOT add any frontmatter. Do NOT move the file. The source is treated as immutable. Manifest records the SHA-256 to dedupe across runs. Monthly archival still moves files dated before the current month into the date subfolders. |

`read_only` is the strictest setting; use it for entry points whose contents must never be modified by the agent (e.g. archive folders the user maintains by hand, vendor-managed folders, or sync source-of-truth folders).

### `exclude` list per entry point

```yaml
- path: "1_Journal/"
  source_type: daily-note
  default_quality: 0.45
  post_ingest: keep
  naming_convention: "YYYY-MM-DD.md"
  exclude:
    - "_template.md"
    - "_draft-*.md"
```

Glob patterns are matched against the filename relative to the entry-point root. Excluded files are never processed, never moved, never have frontmatter added. They also are not flagged as orphans by `/lint`.

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
  - path: "0_Board.md"
    type: dataviewjs-board
protected_paths:
  - "2_Resources/Recipes/"
tags:
  - "#work"
  - "#research"
writing_style: "No empty line after headings. No trailing summaries unless asked. Inline provenance markers on documentation pages only."
project_thresholds:
  active_to_dormant_months: 6
  dormant_to_archive_months: 4
  completed_to_archive_months: 6
templates_to_install:
  - todo-dashboard
  - daily-note
  - project-board
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
| `{{active_to_dormant_months}}` | `project_thresholds.active_to_dormant_months` |
| `{{dormant_to_archive_months}}` | `project_thresholds.dormant_to_archive_months` |
| `{{completed_to_archive_months}}` | `project_thresholds.completed_to_archive_months` |
| `{{entry_points_block}}` | YAML-rendered `entry_points` array (`-` items, two-space indent). Includes `exclude` when set. |
| `{{structured_knowledge_block}}` | YAML-rendered `structured_knowledge` array |
| `{{dashboards_block}}` | YAML-rendered `dashboards` array (empty list `[]` if none). Each entry carries `path` and a free-form `type` label (`todo`, `canvas`, `dataviewjs-board`); the label is not validated |
| `{{protected_paths_block}}` | YAML-rendered `protected_paths` array (empty list `[]` if none) |
| `{{ignore_paths_block}}` | YAML-rendered `ignore_paths` array (empty list `[]` if none) |
| `{{pii_paths_block}}` | YAML-rendered `pii_paths` array (empty list `[]` if none) |
| `{{today}}` | current date `YYYY-MM-DD` |
| `{{iso_timestamp}}` | current timestamp ISO-8601 |

Placeholders left unresolved by this map are an error: abort and report which placeholder failed.

### Asking about the project board

The board is opt-in and must be offered as a question, never installed by
default. It is the only template with prerequisites outside the vault, and a user
who says yes without knowing them gets a note rendering a raw code block and no
idea why.

Skip the question entirely, and say why in the setup summary, when either holds:

- the wiki declares no `purpose: projects` folder, so the board would have no
  columns
- the user already declined the Tasks plugin, or has no tasks in their wiki

Otherwise ask whether they want it, and state these three things first, because
they are what the answer depends on:

1. It needs the Dataview plugin with **Enable JavaScript Queries** switched on.
   That setting is per device, so it has to be switched on again on a phone or
   tablet. Without it the board note shows a raw code block
2. It needs the Tasks plugin for the add and edit buttons. The board reads and
   writes Tasks syntax on its own, so everything else works without it
3. It reads tasks from wherever they are already written. It creates no second
   copy, and it never moves a task between notes

If they accept, collect:

- where `view.js` and `view.css` go, defaulting to `_service/board/` at the vault
  root, outside any single wiki so more than one wiki can share them
- where the board note goes, defaulting to the wiki root
- **which folders hold checkbox lines that are not project tasks.** Ask this
  directly rather than inferring it, and ask it even if the answer looks obvious.
  Meeting transcripts, imported checklists, reading lists and shopping lists all
  parse as tasks. A folder of transcripts can hold an order of magnitude more
  checkbox lines than the wiki has real tasks. Getting this wrong does not break
  the board, it buries every real task under the triage column, and the user has
  no way to know that is what happened

If they decline, record nothing in `templates_to_install[]` and add no
`dashboards[]` entry for it. Do not ask again on a later reconfigure unless the
user raises it.

### Project board fields

The board is configured in code rather than by placeholder substitution, because its
settings describe a wiki's shape and are shared by every board on that wiki. When
installing `project-board`, add one entry to the `WIKIS` table in the copied `view.js`,
keyed by the wiki slug. Map the setup answers as follows; the commented `demo` entry in
`templates/board/view.js` is a worked example of the same table.

| Field | Value from setup |
|---|---|
| `slug` | the wiki slug |
| `label` | the wiki's display name |
| `root` | the wiki root, relative to the vault root |
| `projectsFolder` | the `purpose: projects` folder |
| `projectDepth` | `1` if projects sit directly under the projects folder, `2` if they are grouped in category folders |
| `peopleFolder` | the `purpose: people` folder, or `null` for a single-user wiki |
| `columnStatuses` | which lifecycle statuses earn a column, normally `["active"]`, plus any extra status the wiki uses |
| `newTask.heading` | the heading new tasks are filed under |
| `newTask.journalFolder` | the journal entry point, only if tasks belong in the daily note rather than in project pages |
| `newTask.journalTemplate` | that journal's `_template.md`, if `journalFolder` is set |
| `newTask.fallbackPath` | a catch-all project page, for tasks added from the triage column |
| `settingDefaults.include_folders` | normally just the wiki root |
| `settingDefaults.exclude_folders` | every folder holding checkbox lines that are not project tasks: transcripts, imported checklists, reading lists |

`exclude_folders` is the field to get right. A folder of meeting transcripts can hold an
order of magnitude more checkbox lines than the wiki has real tasks. Including it does
not break the board, it buries every real task under the triage column. Ask which
folders hold checkboxes that are not tasks, rather than inferring it.

If the wiki has no `purpose: projects` folder, do not install the board: it would have
no columns. Say so and skip it.

## Validation rules before writing to disk

Refuse to scaffold if any of these fail:

- `slug` is not kebab-case or short (lowercase letters, digits, hyphens; cannot start with a digit; max 32 characters).
- `slug` already exists in the registry and the user is in new-wiki mode.
- `root` is not absolute.
- `root` is inside another registered wiki's `root` (no nested wikis).
- Any `entry_points[].path` or `structured_knowledge[].path` overlaps with another (path prefix collision within the wiki).
- Any `source_type` is not listed in `wiki-core` SKILL.md "Source quality buckets".
- Any `post_ingest` value is not one of `move`, `keep`, `read_only`.
- `project_thresholds.*` are not positive integers.
- Any `custom_procedures[].when` is not one of `pre-ingest`, `during-ingest`, `post-ingest`, `pre-lint`, `post-lint`.
- Any `custom_procedures[].procedure` resolves to a path outside the wiki root.

After scaffolding succeeds, the agent creates an empty `<wiki-root>/_service/custom-procedures/` folder for any custom procedures the user declared, and copies `templates/_custom-procedure.md.tmpl` to each declared procedure path so the user has a starter file to edit.

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

## Optional: session-end capture hook

After setup succeeds, offer to install the stop hook that prompts `/capture --quick` at the end of any Claude Code session that had file edits or significant shell activity:

1. Ask: "Install the session-end capture hook? It will nudge you to run `/capture --quick` after productive sessions." `[y/n]`
2. If yes, copy `${CLAUDE_PLUGIN_ROOT}/.claude/hooks/wiki-stop-capture.sh` to `~/.claude/hooks/wiki-stop-capture.sh` (create dir if missing).
3. Read `~/.claude/settings.json` (create as `{}` if missing). Add the hook entry:
   ```json
   {
     "hooks": {
       "Stop": [
         {
           "hooks": [
             {
               "type": "command",
               "command": "bash ~/.claude/hooks/wiki-stop-capture.sh"
             }
           ]
         }
       ]
     }
   }
   ```
   Merge with existing content; do not overwrite other hooks.
4. Confirm: "Stop hook installed globally. It activates in every Claude Code project."

The hook fires at most once per session (session_id sentinel in TMPDIR) and never fires if the turn was itself injected by a hook (`stop_hook_active` guard).

## Removing a wiki

Reconfigure mode supports a `--remove` flag. When set:
- Confirm twice.
- Delete the registry entry.
- Do NOT delete the wiki's folder or any of its content. The user removes their data manually.
