---
description: Ingest LLM conversation sources (current session or saved exports) into a wiki
argument-hint: [wiki-slug] "session", "folder [filter]", or omit for both
---

Ingest LLM conversation sources into the target wiki.

Args: $ARGUMENTS

## Wiki resolution

Same scheme as `/ingest`. If the command file name is `ingest-claude-<slug>.md`, slug is `<slug>`. Otherwise the first argument is the slug; the remaining argument is the mode.

## Procedure

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`. Read `<wiki-root>/_service/feedback.md`. Apply entries scoped to `ingest-claude` and entries scoped `global`.

2. Read `<wiki-root>/_service/.manifest.json`.

3. **Determine the work set**: the conversation entry point is the entry point in `CLAUDE.md` whose `source_type` is `claude-chat`. Abort if none is configured.
   - `session`: read the current session transcript. Save the raw transcript to `<conversation-entry-point>/<YYYY-MM-DD>-<slug>.md`. Then process it.
   - `folder [filter]`: walk `<conversation-entry-point>/` for files not in manifest or with changed hash. Apply optional filter as substring match on filename.
   - Empty: do both, capture current session AND process unprocessed files in the folder.

   The folder may contain markdown files saved by previous session captures, web-chat exports (`conversations.json` + `projects/`), or CLI history (`.jsonl` files).

4. **Read project state** from the project structured-knowledge folder.

5. **For each source**:
   a. Compute SHA-256. Skip if manifest matches.
   b. Parse the source:
      - Markdown: read directly.
      - `conversations.json`: parse the schema (uuid, name, summary, chat_messages with content blocks). Use `block.text`, not message-level `text`.
      - JSONL: parse line by line.
   c. Reconstruct conversation text. Drop `tool_use`, `tool_result`, `thinking`, `token_budget` blocks. Include `attachments[].extracted_content`.
   d. Apply heavy filtering. Drop greetings, recapitulations, code mechanics, dead-ends.
   e. Extract durable knowledge: technical findings, decisions with rationale, frameworks, mental models, facts not already in the wiki.
   f. Classify per `CLAUDE.md` routing rules.
   g. File pages per `/ingest` Phase A. `base_confidence: 0.42`. Minimum 250 words.
   h. Create a source page at `<wiki-root>/_service/sources/claude-<slug>.md`: `source_type: claude-chat` or `claude-history`, date range, pages contributed to, `source_quality: 0.3`.
   i. Update manifest, log, hot.md.

6. Project lifecycle review and surface decisions.

7. Report.

## Constraints

- Never paste verbatim messages.
- Never quote assistant outputs as if they were sources.
- Apply ruthless filtering. Conversations yielding no durable knowledge produce no wiki content.
- All shared rules from SKILL.md apply.
