---
description: Audit and normalize a wiki's tag vocabulary against its canonical tags
argument-hint: [wiki-slug] [audit|normalize]
---

Enforce a consistent tag vocabulary across a wiki.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md`, `<wiki-root>/CLAUDE.md`, and `<wiki-root>/wiki-config.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `taxonomy` and entries scoped `global`.

2. **Resolve the mode**: parse `$ARGUMENTS` after the slug. `audit` (default when nothing is given) is read-only; `normalize` writes. Any other token is a usage error: list the two modes and stop without scanning, writing, logging, or touching hot.md.

3. **Load the vocabulary**:
   - Canonical tags = the `tags:` list in `<wiki-root>/wiki-config.md`. This is the source of truth and is never edited in `audit` mode.
   - Alias mappings, migration renames, and tagging rules live in the OPTIONAL companion file `<wiki-root>/_service/taxonomy.md`. Read it if it exists. If it does not exist, offer to create it, seeded from the `wiki-config.md` `tags:` list with empty Aliases and Migration sections, using this structure:
     ```markdown
     # Tag taxonomy

     Canonical tags are the `tags:` list in wiki-config.md. This file adds alias mappings,
     migration renames, and tagging rules on top.

     ## Rules
     - Max 5 tags per page (excluding visibility/* tags).
     - lowercase, hyphenated.
     - Prefer broad over narrow.

     ## Aliases (alias -> canonical)
     | Alias | Canonical |
     |---|---|
     | nextjs | react |

     ## Migration (one-off renames)
     | Old | New | Reason |
     |---|---|---|
     ```
   - Reserved `visibility/*` tags are never alias-mapped, never counted toward the 5-tag limit, reported separately, and never flagged as unknown (see wiki-core "Visibility tags").

4. **Scan**: read every `.md` file in the wiki's structured-knowledge folders (from `wiki-config.md` `structured_knowledge:`). Collect each page's `tags:` frontmatter and build a tag frequency table. Use retrieval cost escalation: grep frontmatter for `tags:`; do not read page bodies.

5. **Flag** (both modes):
   - Unknown tags: tags on pages that are not in the `wiki-config.md` `tags:` list (excluding `visibility/*`).
   - Alias tags: tags present in the `_service/taxonomy.md` Aliases table.
   - Over-tagged pages: pages with more than 5 non-`visibility/*` tags.
   - Untagged pages: pages with no `tags:` at all.

6. **Mode `audit`** (default, read-only): write the frequency table and the flagged findings to `<wiki-root>/_service/taxonomy-<YYYY-MM-DD>.md`. Do NOT modify any page. `visibility/*` counts are reported in a separate section. Then go to step 8.

7. **Mode `normalize`** (write): run the audit (steps 4-5), then:
   a. For each page with an alias tag, rewrite the alias to its canonical tag from the `_service/taxonomy.md` Aliases table.
   b. For each over-tagged page, propose which tags to drop and ask before dropping. Prefer keeping broad over narrow tags.
   c. For each unknown tag, ask the user before touching it. Never invent a tag. If the user agrees a tag should become canonical, append it to the `wiki-config.md` `tags:` list (with confirmation) and record its aliases in `_service/taxonomy.md`.
   d. Apply any Migration renames from `_service/taxonomy.md`.
   e. `visibility/*` tags are never modified.
   f. Update `<wiki-root>/_service/hot.md` with the modified pages.
   g. Write the run report to `<wiki-root>/_service/taxonomy-<YYYY-MM-DD>.md`.

8. Append a structured one-liner to `<wiki-root>/_service/log.md`:
   ```
   - [ISO-8601] TAXONOMY mode=audit|normalize pages_scanned=N tags_renamed=N unknown_tags=M pages_modified=P new_canonical=K
   ```
   In `audit` mode `tags_renamed`, `pages_modified`, and `new_canonical` are 0.

9. **Reflection** (mandatory in `normalize` mode, not opt-out): run the reflection procedure from SKILL.md. Draft feedback entries for any in-run corrections or ambiguities the user resolved verbally. Ask `[y/n]` per entry. On `y`, append to `<wiki-root>/_service/feedback.md` and log a FEEDBACK line. If nothing to capture, say "nothing to capture" and end.

## Constraints

- `audit` mode is read-only except the dated report, the log line, and hot.md.
- `normalize` never invents tags: canonical additions come only from user confirmation, aliases only from `_service/taxonomy.md`.
- `visibility/*` tags are never aliased, renamed, dropped, counted toward the 5-tag limit, or flagged as unknown.
- Integrates with `/lint`, which flags unknown tags against `wiki-config.md` `tags:`.
- All shared rules from SKILL.md apply.
