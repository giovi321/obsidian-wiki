---
description: Ingest sources into a wiki and curate changed pages
argument-hint: [wiki-slug] <filename>, <URL>, "quick-notes", or omit for all new files
---

Ingest sources into the target wiki.

Args: $ARGUMENTS

## Wiki resolution

Resolve the target wiki:
1. The first argument is the wiki slug; the rest of `$ARGUMENTS` is the source.
2. If the first argument is empty or does not match any registered slug, read `~/.claude/obsidian-wiki/wiki-registry.json`. If exactly one wiki is registered, use it (the whole argument string is then the source). Otherwise list the registered wikis and ask the user to pick.

`<wiki-root>` below is the resolved wiki's `root` from the registry.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` for shared rules. Read `<wiki-root>/CLAUDE.md` for the generic schema and `<wiki-root>/wiki-config.md` for the wiki-specific configuration (entry points, structured-knowledge folders, dashboards, thresholds, tags, writing style). Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `ingest` and entries scoped `global`.

2. Read `<wiki-root>/_service/.manifest.json`. If missing, treat as empty. If it exists, first run `python "${CLAUDE_PLUGIN_ROOT}/scripts/manifest.py" normalize "<wiki-root>/_service/.manifest.json"` to canonicalize file-based source keys to absolute paths and merge duplicates (idempotent; skip silently if `python` is unavailable).

3. **Pre-ingest custom procedures**: read the `custom_procedures` list from `wiki-config.md`. For each entry with `when: pre-ingest`, read the referenced procedure file (relative to wiki root) and follow its `## Procedure` section literally. If the procedure declares `requires:` tools that are not available in the current session, log a warning and skip the procedure; do not abort `/ingest`. Procedures may add files to entry points; those become part of the work set in step 4.

4. **Monthly archival and file naming**: iterate the `entry_points` list from `wiki-config.md`. For each entry point, check the folder; move files dated before the first day of the current month into `<entry-point>/YYYY/YYYY-MM/`. Before moving, apply the entry point's `naming_convention` from `wiki-config.md` to rename files that do not match. Manifest keys stay unchanged. Skip any files matched by the entry point's `exclude` glob list. Skip files at any path listed in `ignore_paths`.

5. **Determine the work set**:
   - **URL**: Compute source ID per SKILL.md (strip protocol, trailing slashes, query params). Check manifest — if already ingested and SHA-256 unchanged, report and stop. Otherwise fetch via WebFetch, convert to markdown. Save raw content as `<YYYY-MM-DD>-<slug>.md` (slug = URL host + path, slugified) in the entry point whose `source_type` is `article` (fallback `other`). For confidence use `0.17 + 0.5 × source_quality`. After processing, create or update a source page at `<wiki-root>/_service/sources/url-<slug>.md`. Log the operation with `source_type=url`.
   - **Filename**: resolve path in an entry point folder.
   - **Slug** like `quick-notes` (or `inbox`): determine new/changed files in the entry point with `source_type: quick-note` via the same `manifest.py delta` invocation as `/status` step 3 (with manual SHA-256 fallback), restricted to that entry point. Skip files with `processed: true` frontmatter and files matched by the entry point's `exclude` list.
   - **Empty**: determine new/changed files across ALL entry points listed in `wiki-config.md` via the same `manifest.py delta` invocation as `/status` step 3 (with manual SHA-256 fallback). Skip files with `processed: true` frontmatter, files matched by `exclude` lists, and paths listed in `ignore_paths`. Image files are first-class sources. Additionally, if `<wiki-root>/_raw/` exists and contains files with `lifecycle: raw` frontmatter, treat them as `quick-note` sources (quality 0.5) and include them in the work set (`_raw/` is not an entry point; delta does not cover it). After promoting a `_raw/` file, move it to `_service/entry-points/raw/<YYYY-MM>/`.

6. **Read project state**: list folders under the project structured-knowledge folder defined in `wiki-config.md`. Read project landing pages for status, last_activity, audience, output.

7. **Phase A, ingest new sources**, for each source in the work set:

   a. Compute SHA-256. If manifest matches, skip.
   b. Classify the source. Assign `source_quality` per SKILL.md buckets. Apply the entry point's `default_quality` override if set.
   c. **During-ingest custom procedures**: for each entry in `custom_procedures` with `when: during-ingest`, read the procedure file and follow its `## Procedure` section, passing the current source as input. Same skip-on-missing-tools semantics as the pre-ingest hook.
   d. List entities and knowledge items referenced.
   e. For each item, classify which structured-knowledge folder it belongs in. `wiki-config.md` defines the routing rules.
   f. For project-specific items, find the matching project. If unclear, ask the user with options: create new project, attach to existing, file under the relevant non-project folder.
   g. For each filed item:
      - If the page exists: integrate new information, flag contradictions in the log, update `updated` and `sources` frontmatter.
      - If new: apply the threshold (3+ references or 400+ words). Write with the full frontmatter per SKILL.md template. Minimum 250 words.
      - Compute `base_confidence`, set `lifecycle: draft`, write a `summary` of ≤200 characters, compute provenance fractions.
      - Mark provenance inline per SKILL.md markers.
      - Cross-link: minimum 2 outgoing, 1 incoming per page.
      - Typed edges: when the source explicitly states a relationship between two pages being touched (e.g. "X is built on Y", "A replaced B"), record it in `relationships:` frontmatter with the matching type per SKILL.md "Typed relationships". Only source-stated relations; never infer edges speculatively.
      - If the wiki uses visibility tags (see `wiki-config.md` tags), the agent must not set `visibility/public` automatically; default is `visibility/internal` or no tag. Setting `visibility/public` requires explicit user confirmation.
   h. Create or update a source page at `<wiki-root>/_service/sources/<slug>.md`: source_type, quality score, 300-500 word summary, list of wiki pages contributed to, projects touched.
   i. **Post-source-ingest**: per the entry point's `post_ingest` rule:
      - `move`: add `processed: true` and `processed_at: YYYY-MM-DD` frontmatter, then move the file to `<wiki-root>/_service/entry-points/<entry-point-name>/<YYYY-MM>/`.
      - `keep`: add the frontmatter, leave the file in place.
      - `read_only`: do not add frontmatter, do not move. Manifest tracks the SHA-256 only.
   j. Update `<wiki-root>/_service/.manifest.json`.
   k. Append a structured one-liner to `<wiki-root>/_service/log.md`.
   l. Update `<wiki-root>/_service/hot.md` with touched pages.

8. **Phase B, curate changed pages**: track SHA-256 of files in the structured-knowledge folders in the manifest `curated_pages` section. For files whose hash changed since last recorded:
   - Polish: fix formatting, ensure frontmatter completeness, update summary if content changed, verify cross-links.
   - Update SHA-256 in manifest.
   - Log the curation.

9. **Index update**: rebuild `<wiki-root>/index.md` if new clusters emerged. Ensure sub-folder index pages exist (every subfolder under structured-knowledge folders must have a `<folder-name>.md` index page listing all pages with wikilinks).

10. **Project lifecycle review**: check `last_activity` against thresholds in `wiki-config.md`. Surface suggestions.

11. **Post-ingest custom procedures**: for each entry in `custom_procedures` with `when: post-ingest`, read the procedure file and follow it. Same skip-on-missing-tools semantics.

12. Report: sources processed, skipped, failed; pages created, updated; projects touched; contradictions; redlinks; lifecycle suggestions; custom procedures executed or skipped.

13. **Reflection** (mandatory, not opt-out): run the reflection procedure from SKILL.md. Draft feedback entries for any in-run corrections or ambiguities the user resolved verbally. Ask `[y/n]` per entry. On `y`, append to `<wiki-root>/_service/feedback.md` and log a FEEDBACK line. If nothing to capture, say "nothing to capture" and end.

## Constraints

- Write inside structured-knowledge folders and `_service/` only.
- Never modify originals in entry points except to add `processed` frontmatter and move per the entry point's `post_ingest` rule.
- Never auto-create or auto-move projects.
- Never produce stubs under 250 words.
- All shared rules from SKILL.md apply.
                             