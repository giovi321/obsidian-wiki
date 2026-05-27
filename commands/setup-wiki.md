---
description: Register a new wiki or reconfigure an existing one. Interviews the user, scaffolds folders, installs templates, generates per-wiki command files if requested.
argument-hint: optional wiki-slug to reconfigure, or omit to add a new wiki
---

Set up a wiki.

Args: $ARGUMENTS

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-setup/SKILL.md` for the interview schema, template substitution rules, and the registry write protocol. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` for the shared rules that the new wiki must conform to.

2. Read or create `~/.claude/obsidian-wiki/wiki-registry.json`. If it does not exist, treat as `{ "version": 1, "addressing_mode": null, "wikis": {} }` and proceed.

3. **Determine mode**:
   - If `$ARGUMENTS` is empty: new-wiki mode.
   - If `$ARGUMENTS` is a slug present in the registry: reconfigure mode for that wiki.
   - If `$ARGUMENTS` is a slug not in the registry: ask whether the user wants to register a new wiki at that slug.

4. **Addressing mode** (asked only when adding the first wiki, or if `addressing_mode` is null):
   Ask the user:
   ```
   How do you want to invoke commands?
   1) Suffixed:  /ingest-<slug>           (one command per verb per wiki, easier to autocomplete)
   2) Argument:  /ingest <slug> ...       (one command per verb, slug as first argument)
   ```
   Save the choice in the registry. Once set, it applies to every wiki.

5. **Run the interview** per the schema in `skills/wiki-setup/SKILL.md`. Collect:
   - `name`: display name.
   - `slug`: kebab-case identifier (defaults to slugified name).
   - `root`: absolute filesystem path to the wiki root. Create the folder if missing.
   - `entry_points[]`: each with `path`, `source_type`, `default_quality?`, `post_ingest`, `naming_convention`. The setup skill provides a standard list of suggestions; the user picks which to enable and may override paths.
   - `structured_knowledge[]`: each with `path`, `purpose` (one of `projects`, `documentation`, `resources`, `people`, `concepts`, `custom`), `routing_hint` (free text).
   - `dashboards[]`: paths to dashboard files (optional).
   - `protected_paths[]`: structured-knowledge subfolders that `/rebuild` must not clear.
   - `tags`: tag vocabulary (free text or comma-separated list).
   - `writing_style`: rules for prose voice.
   - `project_thresholds`: integers in months for `active_to_dormant`, `dormant_to_archive`, `completed_to_archive`.
   - `templates_to_install[]`: subset of `todo-dashboard`, `daily-note`, `canvas-dashboard`. For each, ask where to install it (default paths derived from the entry-point and dashboard answers above).

6. **Scaffold the wiki**:
   a. Create the wiki root if missing.
   b. Create each declared entry point folder.
   c. Create each structured-knowledge folder. Add a stub `<folder-name>.md` index in each.
   d. Create `<wiki-root>/_service/` with: empty `.manifest.json` (from `templates/manifest.json.tmpl`), empty `log.md`, empty `hot.md` (from `templates/hot.md.tmpl`), `feedback.md` (from `templates/feedback.md.tmpl`), and empty `_archives/`, `sources/`, `entry-points/` subfolders.
   e. Write `<wiki-root>/index.md` from `templates/index.md.tmpl` with the wiki name substituted.

7. **Write `<wiki-root>/CLAUDE.md`** by reading `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md.tmpl` and substituting all collected values. The template uses `{{key}}` placeholders; the setup skill defines the full substitution map.

8. **Install requested templates**:
   - `todo-dashboard`: copy `templates/0_To-do.md.tmpl`, substitute `{{wiki_root}}` and project-folder paths, write to the user-chosen dashboard path.
   - `daily-note`: copy `templates/daily-note.md.tmpl`, substitute the journal entry-point path, write to `<journal-entry-point>/_template.md`.
   - `canvas-dashboard`: copy `templates/dashboard.canvas.tmpl`, substitute `{{wiki_root}}` and exclusion-path placeholders, write to the user-chosen dashboard path.

9. **Update the registry**: add the new wiki entry to `~/.claude/obsidian-wiki/wiki-registry.json`:
   ```json
   "<slug>": {
     "name": "<name>",
     "root": "<absolute path>",
     "created": "<ISO-8601>",
     "command_suffix": "<slug>"
   }
   ```

10. **Generate per-wiki command files** (only when `addressing_mode` is `suffixed`):
    For each canonical command in `${CLAUDE_PLUGIN_ROOT}/commands/` (excluding `setup-wiki.md`), write a copy at `${CLAUDE_PLUGIN_ROOT}/commands/<verb>-<slug>.md` that:
    a. Carries the same frontmatter but its `description` is appended with " for the <name> wiki".
    b. Pre-binds the wiki slug so the wiki-resolution step skips argument parsing.

    Implementation note: if the user does not have write access to the plugin folder, fall back to writing the suffixed commands into `~/.claude/commands/` (user-scope), which Claude Code merges with plugin commands.

11. **Confirm**: show the user a summary of: created paths, registered slug, addressing mode, installed templates, generated commands (if any). Ask `[y/n]` to commit. On `n`, revert (delete created folders, restore registry).

12. **Smoke check**: run `/status` for the new wiki and report the output.

## Constraints

- Never overwrite an existing `CLAUDE.md` without asking.
- Never overwrite existing folders that are non-empty; abort with an error pointing at the conflict.
- Never modify a wiki not named in `$ARGUMENTS` (in reconfigure mode).
- Registry writes are atomic: write a tempfile then rename.
- All shared rules from SKILL.md apply once the wiki is registered.
