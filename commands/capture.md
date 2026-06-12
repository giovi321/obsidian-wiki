---
description: Save knowledge from the current conversation into a wiki
argument-hint: [wiki-slug] [--quick] <what to capture, or omit for auto-detect>
---

Extract substantive knowledge from the current conversation and file it.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. The first argument is the wiki slug; the remaining arguments are the command's input. If the slug is omitted and exactly one wiki is registered, that wiki is used; otherwise the user is asked to pick.

If `--quick` is present anywhere in the arguments, run **Quick mode** instead of the normal procedure.

---

## Normal mode

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md`, `<wiki-root>/CLAUDE.md`, and `<wiki-root>/wiki-config.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `capture` and entries scoped `global`.

2. Identify what is worth preserving (decisions, findings, frameworks, facts not in the wiki). Discard logistics, greetings, already-captured content.

3. Classify per `wiki-config.md` routing rules into the structured-knowledge folders.

4. Rewrite as declarative knowledge. Apply provenance markers.

5. Generate slug and title per `wiki-config.md` naming rules.

6. Check for existing pages via retrieval cost escalation. Update instead of creating duplicates.

7. Write the page with full frontmatter: `base_confidence: 0.42`, `lifecycle: draft`, `summary` ≤200 characters, provenance fractions. Minimum 250 words, two or more outgoing wikilinks.

8. Update `index.md`, `_service/log.md`, `_service/hot.md`. Touch project `last_activity` if relevant.

9. Confirm to the user.

### Constraints

- Write inside structured-knowledge folders and `_service/` only.
- Never fabricate claims not in the conversation.
- If nothing is worth preserving, say so and stop.

---

## Quick mode (--quick)

Zero-friction staging. Designed to complete in under 60 seconds. Used automatically by the session-end stop hook; can also be invoked manually.

### KEEP/SKIP gate

Scan the conversation. Skip if:
- The session was purely conversational with no concrete findings, decisions, errors, gotchas, or reusable patterns.
- There is nothing not already captured in the wiki.

When invoked manually, lean toward KEEP. When triggered automatically (stop hook), be selective — only stage if there are concrete, reusable findings.

If skipping: print "Nothing worth capturing." and stop. Do not write any files.

### Procedure (if KEEP)

1. Resolve the target wiki. If no wiki is registered, print a warning and stop.

2. Find or create `<wiki-root>/_raw/`. This is a staging area; files here are promoted on the next `/ingest` run.

3. Group findings by topic. One file per distinct topic.

4. For each file:
   - Filename: `<YYYY-MM-DD>-<short-slug>.md`
   - Frontmatter: `capture_source: claude-session`, `captured_at: YYYY-MM-DD`, `wiki: <slug>`, `lifecycle: raw`
   - Body: tight bullet list of findings. No narrative. Max fidelity to what was discussed. Provenance markers are added at promotion time.

5. Report: "N finding(s) staged to `<wiki-root>/_raw/` — run `/ingest` to promote."

### Constraints

- Write to `<wiki-root>/_raw/` only.
- No manifest reads or writes.
- No updates to `index.md`, `_service/log.md`, `_service/hot.md`.
- No reflection step.
- No subagent calls.
