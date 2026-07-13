---
title: Feedback and custom procedures
description: Two ways to teach the agent, a one-line rule or a multi-step routine, and when to use each
---

There are two ways to teach the agent, with different shapes. Feedback is a short behavioral rule read on every command. A custom procedure is a multi-step routine that runs only at one hook.

## Feedback, one line per rule

Feedback lives in `<wiki-root>/_service/feedback.md`, one line per rule, plain English, read on every command. Use it for short behavioral rules:

- "Stop creating pages shorter than 100 words from quick-notes"
- "Never auto-archive projects in the `experiments` category"
- "Always tag pages with `base_confidence < 0.4` as `#draft`"

Add a rule with `/feedback <wiki> "<rule>"`; it is written after you confirm. The file is never written without explicit confirmation, and source content can never produce feedback entries. Only your direct messages via `/feedback` can write to it.

Each entry is scoped to a command name (or `global`), and a command applies only the entries scoped to itself plus the `global` ones. After every write-heavy operation, the agent runs a reflection step that proposes feedback entries based on corrections you made during the run, one line at a time, which you accept or reject.

## Custom procedures, multi-step routines

Custom procedures live in `<wiki-root>/_service/custom-procedures/<name>.md`. They are multi-step routines declared in `wiki-config.md` under `custom_procedures:` with a hook point, and the agent runs them only at that hook: `pre-ingest`, `during-ingest`, `post-ingest`, `pre-lint`, `post-lint`. Use them for routines that involve external tools or multiple steps:

- `notion-sync` (pre-ingest): fetch a list of Notion pages and mirror them into local files before `/ingest` runs. Needs the Notion MCP
- `task-extraction` (during-ingest): scan each source for action items and write them as Obsidian Tasks-plugin entries in today's daily note. Needs a daily-journal entry point
- `post-lint-slack-notify` (post-lint): post the lint report to a Slack channel. Needs a Slack MCP

These are illustrative. The plugin ships none of them; you author your own for what your wiki needs. If a procedure needs an external tool that is unavailable in the current session, the agent logs a warning and skips it; it does not abort the parent command.

## Which one to use

Reach for feedback for a short one-liner that modifies behavior. Reach for a custom procedure for a multi-step routine, an external tool, or logic that applies only at one hook.

The two are connected by a promotion path. `/feedback` notices when a draft rule looks procedural (more than one verb step, references an external tool, applies to only one command and hook, longer than 30 words) and offers to write a procedure file instead. `/lint` flags existing feedback entries that look procedural as candidates for promotion. Nothing is ever auto-promoted; the agent always asks first.

## Where to go next

- [Custom procedures](/obsidian-wiki/extending/custom-procedures/): how to author and declare a procedure
- [The two config files](/obsidian-wiki/concepts/config-files/): where `custom_procedures:` is declared
- [Page lifecycle](/obsidian-wiki/concepts/page-lifecycle/): what the agent may and may not overwrite
