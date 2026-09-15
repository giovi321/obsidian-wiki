---
description: Audit a wiki for orphans, broken links, stale pages, structural drift, and more
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

   **Structural findings**: whether the wiki's own description of itself still matches the disk. These are the cheapest findings to compute and the easiest to leave rotting, because nothing else ever reads a stale declaration back to you.

   *Declared but missing.* Every path a config key declares must exist. Report grouped by key, because the consequence differs per key:
   - `entry_points[].path`: folder must exist. Missing means `/ingest` has nowhere to read from
   - `structured_knowledge[].path`: folder must exist. Missing means `/ingest` has nowhere to write to
   - `dashboards[].path`: file must exist
   - `protected_paths[]`: folder must exist. Missing means the protection is silently inert, so `/rebuild` is less safe than the config implies
   - `pii_paths[]`: folder must exist. Missing means the visibility check silently covers nothing
   - `custom_procedures[].procedure`: file must exist at the path relative to the wiki root
   - `root`: must equal the registry's `root` for this slug. A mismatch is what happens when a `wiki-config.md` is copied from another wiki, and it makes every relative path in the file resolve against the wrong tree

   *Present but undeclared.* List the top-level entries under the wiki root, files and folders. Each must be accounted for by one of: an `entry_points[].path`, a `structured_knowledge[].path`, a `dashboards[].path`, `_service/`, the three plugin-owned files (`CLAUDE.md`, `wiki-config.md`, `index.md`), or an `ignore_paths` entry. Report anything left as undeclared, and say which of the three lists it probably belongs in.

   Top level only, never recursive: recursing would flag every project subfolder and bury the report. The top level is where a new zone actually appears. Skip entries whose name starts with `.` without reporting them; they are editor and app artifacts, not wiki zones, and flagging them on every wiki would be noise. Include top-level *files*, since that is what makes a stray database or export file earn its `ignore_paths` entry.

   *Pages naming paths that no longer exist.* For every page in the structured-knowledge folders, extract the backticked strings and treat one as a path reference when all of these hold:
   - it contains two or more non-empty `/`-separated segments, or it ends with `/`
   - it contains none of `<`, `>`, `*`, `|`, `?`
   - it is not a URL (no `://`, does not start with `http`)
   - it is not absolute or home-relative (does not start with `/`, `~`, or a drive letter such as `C:`)

   Resolve each candidate against the wiki root, then against the vault root. If neither resolves, flag it with the page and the path. Group findings by page, and when one page yields more than ten, report the count and the first ten only, so a single badly drifted page cannot swamp the report.

   This finds paths that do not exist. It cannot find a path that exists but is described wrongly: a file named correctly and characterised as something it stopped being will pass every check here. Say so in the report rather than implying the section proves the docs are accurate.

   *Dashboard settings naming projects that are gone.* For each `dashboards[].path`, read its frontmatter and check every `board_column_manual` entry against the projects on disk. Report an entry whose slug matches no project under the project root, naming the dashboard and the slug, and say which case it is: the project sits in `_old/`, which is the usual cause and means it was archived, or it is absent entirely, which means it was renamed or deleted.

   Nothing breaks when this drifts, which is exactly why it needs reporting. The board skips a slug that has no column, so a dead entry is invisible until someone opens the frontmatter for an unrelated reason. One accumulates per archived project and none ever leaves.

   It is reported here rather than pruned by `/project archive` on purpose. A dashboard is rewritten only on an explicit restructure and never as a side effect of another command, per the folder permissions in `CLAUDE.md`, and archiving a project is a different command with a different subject. Reporting it costs a line in the lint report; making `archive` reach into the dashboard would couple two things that are currently independent and would need that permission rule relaxed for every wiki.

   *CLAUDE.md drift.* Compute the SHA-256 of `<wiki-root>/CLAUDE.md` and of `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md.tmpl`. If they differ, emit one finding telling the user to run `/upgrade`. Report only: `/upgrade` owns that file and `/lint` must never write it. This is here because `/lint` gets run on a schedule and `/upgrade` gets run when someone remembers.

   **Config-level findings**:
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
- Structural findings read the registry and `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md.tmpl`. Both are read-only here; `/upgrade` is the only command that writes `CLAUDE.md`.
- All shared rules from SKILL.md apply.
