---
description: Manage projects in a wiki
argument-hint: [wiki-slug] list | new <name> | archive <slug> | reactivate <slug> | status <slug> <new-status>
---

Manage projects.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md`, `<wiki-root>/CLAUDE.md`, and `<wiki-root>/wiki-config.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `project` and entries scoped `global`. `wiki-config.md` declares the project root folder and any category folders.

### list

Walk the project root and the `_old/` subfolder. Report active and archived projects with status, `last_activity`, one-line summary. Flag overdue state changes per thresholds in `wiki-config.md`.

### new <name>

1. If `wiki-config.md` defines category folders, ask the user which one.
2. Generate a kebab-case slug. Confirm with the user.
3. Determine shape: flat (default) or folder (if substantial content is expected).
4. Create the project file with frontmatter (type, `status: active`, `created`, `last_activity`), description, tasks section.
5. For folder projects: create `<project-root>/<category>/<slug>/<slug>.md`.
6. For flat projects: create `<project-root>/<category>/<slug>.md`.
7. Add a Tasks query if `wiki-config.md` declares tasks-plugin support: `((not done) AND (path includes <project-root>/<category>/<slug>/))`.
8. Update the category landing page to list the new project.
9. Update `<wiki-root>/index.md` and `<wiki-root>/_service/log.md`.

### archive <slug>

1. Confirm. Ask for status (`completed`, `abandoned`, `dormant`).
2. Move to `<project-root>/_old/`. Update wikilinks wiki-wide.
3. Remove from the category landing page. Update `<wiki-root>/index.md` and `<wiki-root>/_service/log.md`.

### reactivate <slug>

1. Confirm. Ask which category to place it in.
2. Move from `_old/` to `<project-root>/<category>/`. Update wikilinks.
3. Update the category landing page, `<wiki-root>/index.md`, and `<wiki-root>/_service/log.md`.

### status <slug> <new-status>

Update status and `last_activity`. If `completed` or `abandoned`, offer to archive. Log.

## Constraints

- Never delete projects. Move to `_old/`.
- Always confirm before archive or move.
- Exhaust all wikilink rewrites.
