---
description: Audit and fix cross-links across a wiki
argument-hint: [wiki-slug] optional scope (folder path or "all")
---

Audit and repair wikilinks.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `cross-linker` and entries scoped `global`.

2. Determine scope:
   - If the remaining argument is a path, limit to that folder.
   - If `all` or empty, scan all structured-knowledge folders.

3. **Build link inventory**: for every page in scope, extract all outgoing `[[wikilinks]]` and compute incoming links from across the wiki.

4. **Find issues**:
   - Pages with fewer than two outgoing links (excluding dashboards, source summaries, category landing pages).
   - Pages with zero incoming links (orphans).
   - Broken links (target does not exist).
   - Near-miss links: pages that discuss the same entity as another page but do not link to it (grep page titles and aliases in other pages' content).
   - Missing aliases: pages referenced by multiple name variations that lack an `aliases:` frontmatter field.

5. **Fix automatically**:
   - Add wikilinks where an entity is mentioned in text but not linked (first mention per page).
   - Add incoming links by inserting `Related` or `See also` sections where appropriate.
   - Fix broken links where the target was renamed (match by aliases or similar slug).
   - Add missing `aliases:` entries based on observed variations.

6. **Report unfixable issues**: orphans requiring content changes, broken links with no obvious target.

7. Update `<wiki-root>/_service/log.md` and `_service/hot.md`.

8. **Reflection** (mandatory, not opt-out): run the reflection procedure from SKILL.md. Draft feedback entries for any in-run corrections or ambiguities the user resolved verbally. Ask `[y/n]` per entry. On `y`, append to `<wiki-root>/_service/feedback.md` and log a FEEDBACK line. If nothing to capture, say "nothing to capture" and end.

## Constraints

- Only modify wikilinks and `aliases` frontmatter. Do not change page content beyond link additions.
- Never delete links.
- Report all changes made.
- All shared rules from SKILL.md apply.
