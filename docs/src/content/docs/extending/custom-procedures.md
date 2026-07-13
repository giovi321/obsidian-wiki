---
title: Custom procedures
description: Multi-step routines that hook into the command flow at one of five points, declared in wiki-config.md
---

A custom procedure is a multi-step routine that hooks into a specific point of the command flow. Use them for behavior specific to one wiki: syncing pages from an external service like Notion, extracting action items from voice transcripts into a daily journal, post-ingest notifications, lint-driven exports.

## The five hook points

Each procedure runs at exactly one hook:

- `pre-ingest`: runs at the start of every `/ingest <slug>` run, before the work-set walk. Use for fetching external sources, transforming inputs, or preparing the work set
- `during-ingest`: runs once per source during Phase A, after the source is classified and before its knowledge is filed. Use for source-specific transformations such as extracting action items from voice transcripts
- `post-ingest`: runs at the end of every `/ingest <slug>` run, after the report and the reflection step. Use for sending notifications, syncing back to external systems, or cleanup
- `pre-lint`: runs at the start of every `/lint <slug>` run, before the inventory is built. Use for refreshing data the lint pass depends on
- `post-lint`: runs at the end of every `/lint <slug>` run, after the report is written. Use for surfacing lint findings to external systems such as a Slack notification or GitHub issue

## Declaring a procedure in wiki-config.md

Declare procedures in `wiki-config.md` under `custom_procedures:`. Each entry has:

```yaml
custom_procedures:
  - name: <procedure-name>
    when: pre-ingest | during-ingest | post-ingest | pre-lint | post-lint
    procedure: "<path/to/procedure.md>"        # relative to wiki root
    description: "<one-line summary>"
```

The `procedure` path points to a markdown file under `<wiki-root>/_service/custom-procedures/`. The agent reads that file when the corresponding hook is reached and follows its `## Procedure` section literally.

## The starter template

Use `templates/_custom-procedure.md.tmpl` in the repo as a starter. Its frontmatter declares the hook, the wiki it applies to, and the external tools it requires; the body has sections for the trigger, the numbered procedure steps, constraints, and failure handling.

`/setup-wiki` can create the `_service/custom-procedures/` folder and copy the template into each declared procedure path during the interview if you declare procedures up front.

Custom procedures live in your wiki, not in this repo. They are never committed to the plugin source, so your customizations stay yours.

## Skip if the tool is unavailable

If a procedure needs an external tool (MCP or CLI) that is not available in the current session, the agent logs a warning and skips the procedure. It does not abort the parent command.

## Procedure or feedback rule

Reach for a custom procedure when the routine has multiple steps, references an external tool, or applies only at one hook point. Reach for a feedback rule when a short one-line behavioral rule is enough. `/feedback` notices when a draft rule looks procedural and offers to write a procedure file instead, and `/lint` flags existing feedback entries that look procedural as candidates for promotion.

## Where to go next

- [Feedback and custom procedures](/obsidian-wiki/concepts/feedback-and-procedures/): choosing between the two mechanisms
- [The two config files](/obsidian-wiki/concepts/config-files/): where custom_procedures is declared
- [Custom commands](/obsidian-wiki/extending/custom-commands/): adding a whole new verb
