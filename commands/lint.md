---
description: Audit a wiki for orphans, broken links, stale pages, and more
argument-hint: [wiki-slug]
---

Run a lint pass.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md`, `<wiki-root>/CLAUDE.md`, and `<wiki-root>/wiki-config.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `lint` and entries scoped `global`.

2. **Pre-lint custom procedures**: for each entry in `custom_procedures` with `when: pre-lint`, read the procedure file and follow it. Skip silently if required tools are unavailable.

3. Build inventory: every `.md` file in the structured-knowledge folders with path, frontmatter, outgoing and incoming wikilinks. Every project's status and `last_activity`. Tag usage map.

4. Compute:

   **Page-level findings**:
   - Orphans: pages with zero incoming wikilinks (excluding `index.md`, category landing pages, dashboards).
   - Broken links: wikilinks to non-existent pages.
   - Redlinks ranked by reference count.
   - Contradictions across pages (semantic). Quote both sides.
   - Stale pages: `(today - updated) > 90 days`.
   - Tag drift: tags on only one page.
   - Missing frontmatter: pages in documentation-class folders lacking `summary`, `base_confidence`, `lifecycle`, `provenance`.
   - Low-confidence pages: `base_confidence < 0.4`.
   - Provenance drift: recompute fractions, flag divergence greater than 0.15.
   - Missing sub-folder index pages: every subfolder under structured-knowledge folders must have a `<folder-name>.md` index.
   - Broken relationship edges: `relationships:` targets pointing at pages that do not exist.
   - Unknown edge types: `relationships:` types outside the canonical set (SKILL.md "Typed relationships") and any wiki-declared extensions in `wiki-config.md`.

   **Lifecycle findings**:
   - Draft pages in documentation-class folders with `lifecycle_changed` older than 6 months.
   - Disputed pages.
   - Pages using legacy fields.
   - Files outside `_raw/` carrying `lifecycle: raw` (staging-only marker that escaped promotion).

   **Visibility findings** (only when the wiki's `tags:` list includes `visibility/*` tags):
   - Pages inside any folder listed in `wiki-config.md` `pii_paths` that lack the `visibility/pii` tag.
   - Pages tagged `visibility/public` still in `lifecycle: draft` (public content nobody has reviewed).

   **Project-level findings** (per `wiki-config.md` thresholds):
   - Active projects past the active threshold, suggest dormant.
   - Dormant projects past the dormant threshold, suggest archive.
   - Completed projects past the completed threshold, suggest archive.
   - Old projects with new source touches, suggest reactivate.
   - Empty projects (only landing page) with `last_activity` greater than 3 months, suggest archive.

   **Source-level findings**:
   - Sources in the manifest with empty `wiki_pages`.
   - Old sources never re-touched.

   **Feedback-level findings**:
   - Entries older than 90 days with zero hits in `_service/log.md` (candidates for removal).
   - Entries that look like custom procedures rather than one-line behavioral rules (candidates for promotion). An entry is flagged when ANY of these is true:
     - More than one verb step ("first... then...", numbered "1.", "2.").
     - References an external tool (MCP tool name, `WebFetch`, `WebSearch`, a CLI command).
     - Only applies to one command and runs at a specific hook point.
     - Longer than 30 words.
     For each flagged entry, report: "this entry looks procedural; consider promoting to `_service/custom-procedures/` via `/feedback` with the same text, or move it by hand." Do not auto-promote.

   **Config-level findings**:
   - Each `custom_procedures[].procedure` path: verify the file exists at the path relative to the wiki root. Flag missing procedure files.
   - Each `entry_points[].exclude` glob: verify it matches at least one historical file in the entry point or in `_service/entry-points/`. Flag glob patterns that have never matched anything (likely a typo).
   - Each `ignore_paths` entry: verify the path or glob is well-formed.
   - Tags used on pages that are not in the `tags` vocabulary in `wiki-config.md`. Flag as "unknown tags".

5. Write the report to `<wiki-root>/_service/lint-<YYYY-MM-DD>.md`.

6. Do NOT auto-fix. Report only.

7. Append a structured one-liner to `<wiki-root>/_service/log.md`. Update `<wiki-root>/_service/hot.md`.

8. **Post-lint custom procedures**: for each entry in `custom_procedures` with `when: post-lint`, read the procedure file and follow it. Skip silently if required tools are unavailable.

9. **Reflection** (mandatory, not opt-out): run the reflection procedure from SKILL.md. Draft feedback entries for any in-run corrections or ambiguities the user resolved verbally. Ask `[y/n]` per entry. On `y`, append to `<wiki-root>/_service/feedback.md` and log a FEEDBACK line. If nothing to capture, say "nothing to capture" and end.

## Constraints

- Read-only on wiki content except the lint report, log, and hot.md.
- All shared rules from SKILL.md apply.
