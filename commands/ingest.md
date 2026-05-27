---
description: Ingest sources into a wiki and curate changed pages
argument-hint: [wiki-slug] <filename>, <URL>, "quick-notes", or omit for all new files
---

Ingest sources into the target wiki.

Args: $ARGUMENTS

## Wiki resolution

Resolve the target wiki:
1. If this command file is named `ingest-<slug>.md`, the wiki slug is `<slug>` and the rest of `$ARGUMENTS` is the source.
2. Otherwise, the first argument is the wiki slug and the rest is the source.
3. If no slug can be resolved, read `~/.claude/obsidian-wiki/wiki-registry.json`. If only one wiki is registered, use it. Otherwise list the registered wikis and ask the user to pick.

`<wiki-root>` below is the resolved wiki's `root` from the registry.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` for shared rules. Read `<wiki-root>/CLAUDE.md` for wiki-specific config (entry points, structured-knowledge folders, tags, thresholds). Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `ingest` and entries scoped `global`.

2. Read `<wiki-root>/_service/.manifest.json`. If missing, treat as empty.

3. **Monthly archival and file naming**: iterate the `entry_points` list from `CLAUDE.md`. For each entry point, check the folder; move files dated before the first day of the current month into `<entry-point>/YYYY/YYYY-MM/`. Before moving, apply the entry point's `naming_convention` from `CLAUDE.md` to rename files that do not match. Manifest keys stay unchanged. Skip any files listed in the entry point's `exclude` list.

4. **Determine the work set**:
   - URL: fetch via WebFetch, convert to markdown, save to the entry point whose `source_type` is `article` (or `other` if none), then process.
   - Filename: resolve path in an entry point folder.
   - Slug like `quick-notes` (or `inbox`): walk the entry point with `source_type: quick-note` for files not yet in manifest or with changed hash. Skip files with `processed: true` frontmatter.
   - Empty: walk ALL entry points listed in `CLAUDE.md` for new or changed files (hash-based). Skip files with `processed: true` frontmatter. Image files are first-class sources.

5. **Read project state**: list folders under the project structured-knowledge folder defined in `CLAUDE.md`. Read project landing pages for status, last_activity, audience, output.

6. **Phase A, ingest new sources**, for each source in the work set:

   a. Compute SHA-256. If manifest matches, skip.
   b. Classify the source. Assign `source_quality` per SKILL.md buckets. Apply the entry point's `default_quality` override if set.
   c. List entities and knowledge items referenced.
   d. For each item, classify which structured-knowledge folder it belongs in. `CLAUDE.md` defines the routing rules.
   e. For project-specific items, find the matching project. If unclear, ask the user with options: create new project, attach to existing, file under the relevant non-project folder.
   f. For each filed item:
      - If the page exists: integrate new information, flag contradictions in the log, update `updated` and `sources` frontmatter.
      - If new: apply the threshold (3+ references or 400+ words). Write with the full frontmatter per SKILL.md template. Minimum 250 words.
      - Compute `base_confidence`, set `lifecycle: draft`, write a `summary` of ≤200 characters, compute provenance fractions.
      - Mark provenance inline per SKILL.md markers.
      - Cross-link: minimum 2 outgoing, 1 incoming per page.
   g. Create or update a source page at `<wiki-root>/_service/sources/<slug>.md`: source_type, quality score, 300-500 word summary, list of wiki pages contributed to, projects touched.
   h. **Post-ingest**: per the entry point's `post_ingest` rule. If `move`, add `processed: true` and `processed_at: YYYY-MM-DD` frontmatter, then move the file to `<wiki-root>/_service/entry-points/<entry-point-name>/<YYYY-MM>/`. If `keep`, only add the frontmatter and leave the file in place.
   i. Update `<wiki-root>/_service/.manifest.json`.
   j. Append a structured one-liner to `<wiki-root>/_service/log.md`.
   k. Update `<wiki-root>/_service/hot.md` with touched pages.

7. **Phase B, curate changed pages**: track SHA-256 of files in the structured-knowledge folders in the manifest `curated_pages` section. For files whose hash changed since last recorded:
   - Polish: fix formatting, ensure frontmatter completeness, update summary if content changed, verify cross-links.
   - Update SHA-256 in manifest.
   - Log the curation.

8. **Index update**: rebuild `<wiki-root>/index.md` if new clusters emerged. Ensure sub-folder index pages exist (every subfolder under structured-knowledge folders must have a `<folder-name>.md` index page listing all pages with wikilinks).

9. **Project lifecycle review**: check `last_activity` against thresholds in `CLAUDE.md`. Surface suggestions.

10. Report: sources processed, skipped, failed; pages created, updated; projects touched; contradictions; redlinks; lifecycle suggestions.

11. **Reflection** (mandatory, not opt-out): run the reflection procedure from SKILL.md. Draft feedback entries for any in-run corrections or ambiguities the user resolved verbally. Ask `[y/n]` per entry. On `y`, append to `<wiki-root>/_service/feedback.md` and log a FEEDBACK line. If nothing to capture, say "nothing to capture" and end.

## Constraints

- Write inside structured-knowledge folders and `_service/` only.
- Never modify originals in entry points except to add `processed` frontmatter and move per the entry point's `post_ingest` rule.
- Never auto-create or auto-move projects.
- Never produce stubs under 250 words.
- All shared rules from SKILL.md apply.
