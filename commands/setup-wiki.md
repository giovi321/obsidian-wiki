---
description: Register a new wiki or reconfigure an existing one. Interviews the user, scaffolds folders, and installs templates. Commands are invoked as `/obsidian-wiki:<verb> <slug>`; no per-wiki command files are generated.
argument-hint: optional wiki-slug to reconfigure, or omit to add a new wiki
---

Set up a wiki.

Args: $ARGUMENTS

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-setup/SKILL.md` for the interview schema, template substitution rules, and the registry write protocol. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` for the shared rules that the new wiki must conform to.

2. Read or create `~/.claude/obsidian-wiki/wiki-registry.json`. If it does not exist, treat as `{ "version": 1, "wikis": {} }` and proceed.

3. **Determine mode**:
   - If `$ARGUMENTS` is empty: new-wiki mode.
   - If `$ARGUMENTS` is a slug present in the registry: reconfigure mode for that wiki.
   - If `$ARGUMENTS` is a slug not in the registry: ask whether the user wants to register a new wiki at that slug.

4. **Run the interview** per the schema in `skills/wiki-setup/SKILL.md`. Collect:
   - `name`: display name.
   - `slug`: kebab-case identifier (defaults to slugified name).
   - `root`: absolute filesystem path to the wiki root. Create the folder if missing.
   - `entry_points[]`: each with `path`, `source_type`, `default_quality?`, `post_ingest` (`move`, `keep`, or `read_only`), `naming_convention`, optional `exclude` glob list. The setup skill provides a standard catalog of suggestions; the user picks which to enable, may override paths, and may add custom entry points.
   - `structured_knowledge[]`: each with `path`, `purpose` (one of `projects`, `documentation`, `resources`, `people`, `concepts`, `custom`), `routing_hint` (free text).
   - `dashboards[]`: paths to dashboard files (optional).
   - `protected_paths[]`: structured-knowledge subfolders that `/rebuild` must not clear.
   - `ignore_paths[]`: filesystem artifacts at the wiki root the agent must ignore entirely. Suggest common entries: `.obsidian/`, `.trash/`, `notes.sqlite`, `.DS_Store`.
   - `tags`: tag vocabulary (free text or comma-separated list). Ask whether to enable visibility tags (`visibility/public`, `visibility/internal`, `visibility/pii`). If yes, append them to the list.
   - `writing_style`: rules for prose voice.
   - `project_thresholds`: integers in months for `active_to_dormant_months`, `dormant_to_archive_months`, `completed_to_archive_months`.
   - `custom_procedures[]`: optional. Ask the user if they want any custom procedures wired in at specific hook points (`pre-ingest`, `during-ingest`, `post-ingest`, `pre-lint`, `post-lint`). For each one, collect a `name`, `when`, `description`, and a `procedure` path under `<wiki-root>/_service/custom-procedures/`. The setup command creates `<wiki-root>/_service/custom-procedures/` and copies `${CLAUDE_PLUGIN_ROOT}/templates/_custom-procedure.md.tmpl` to each declared path so the user can fill it in afterward.
   - `templates_to_install[]`: subset of `todo-dashboard`, `daily-note`, `canvas-dashboard`. For each, ask where to install it (default paths derived from the entry-point and dashboard answers above).

5. **Scaffold the wiki**:
   a. Create the wiki root if missing.
   b. Create each declared entry point folder.
   c. Create each structured-knowledge folder. Add a stub `<folder-name>.md` index in each.
   d. Create `<wiki-root>/_service/` with: empty `.manifest.json` (from `templates/manifest.json.tmpl`), empty `log.md`, empty `hot.md` (from `templates/hot.md.tmpl`), `feedback.md` (from `templates/feedback.md.tmpl`), and empty `_archives/`, `sources/`, `entry-points/` subfolders.
   e. Write `<wiki-root>/index.md` from `templates/index.md.tmpl` with the wiki name substituted.

6. **Write `<wiki-root>/CLAUDE.md`** by copying `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md.tmpl` verbatim. This file is generic and identical across all wikis the plugin manages; no placeholders are substituted.

7. **Write `<wiki-root>/wiki-config.md`** by reading `${CLAUDE_PLUGIN_ROOT}/templates/wiki-config.md.tmpl` and substituting all collected values. The template uses `{{key}}` placeholders; the setup skill defines the full substitution map.

8. **Install requested templates**:
   - `todo-dashboard`: copy `templates/0_To-do.md.tmpl`, substitute `{{wiki_root}}` and project-folder paths, write to the user-chosen dashboard path.
   - `daily-note`: copy `templates/daily-note.md.tmpl`, substitute the journal entry-point path, write to `<journal-entry-point>/_template.md`.
   - `canvas-dashboard`: copy `templates/dashboard.canvas.tmpl`, substitute all placeholders per the map in `skills/wiki-setup/SKILL.md`, applying the "Dashboard template conditional rules" there (drop filter lines or whole canvas nodes when the wiki lacks the corresponding entry point or folder), write to the user-chosen dashboard path.

9. **Determine the vault root and install shared docs**:
    a. If this is the first wiki being registered, ask: "Where should the shared docs folder live?" Default: the parent of `<wiki-root>`. Other accepted values: any absolute path the user provides.
    b. Save the vault root in the registry under `vault_root`. Subsequent wikis inherit this value; the question is not asked again unless the existing path is unwritable.
    c. Refresh `<vault_root>/_service/docs/` by copying:
       - `${CLAUDE_PLUGIN_ROOT}/README.md` → `<vault_root>/_service/docs/README.md`
       - `${CLAUDE_PLUGIN_ROOT}/docs/diagrams/*.svg` → `<vault_root>/_service/docs/diagrams/`
       Overwrite any existing files (the plugin's docs are authoritative).

10. **Update the registry**: add the new wiki entry to `~/.claude/obsidian-wiki/wiki-registry.json`:
    ```json
    "<slug>": {
      "name": "<name>",
      "root": "<absolute path>",
      "created": "<ISO-8601>"
    }
    ```
    And ensure `vault_root` is set at the top level:
    ```json
    {
      "version": 1,
      "vault_root": "<absolute path>",
      "wikis": { ... }
    }
    ```

11. **Confirm**: show the user a summary of created paths, registered slug, installed templates, shared docs location. Ask `[y/n]` to commit. On `n`, revert (delete created folders, restore registry).

12. **Smoke check**: run `/status` for the new wiki and report the output.

## Constraints

- Never overwrite an existing `CLAUDE.md` without asking.
- Never overwrite existing folders that are non-empty; abort with an error pointing at the conflict.
- Never modify a wiki not named in `$ARGUMENTS` (in reconfigure mode).
- Registry writes are atomic: write a tempfile then rename.
- All shared rules from SKILL.md apply once the wiki is registered.
