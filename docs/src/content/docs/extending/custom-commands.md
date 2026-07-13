---
title: Custom commands
description: How to add a new verb beyond the shipped commands, wired to the registry like the built-ins
---

The plugin ships a fixed set of commands, but you can add your own verb. Say you want `/digest`, which emails you a weekly summary. Three steps wire it in the same way the shipped commands work.

## Add a custom verb

1. Create `commands/digest.md` in the plugin folder, or `~/.claude/commands/digest.md` for user scope
2. Use the same procedure-step structure as the shipped commands. Step 1 reads `${CLAUDE_PLUGIN_ROOT}/skills/wiki-core/SKILL.md` and `<wiki-root>/CLAUDE.md`
3. Take the wiki slug as the first argument and resolve it via the registry the same way the shipped commands do

## Why this works

Every shipped command resolves its target wiki from the registry at `~/.claude/obsidian-wiki/wiki-registry.json`, reading the shared skill and the wiki's `CLAUDE.md` before doing anything else. A custom command that follows the same pattern behaves consistently with the rest of the plugin: it addresses any registered wiki by slug and operates under the same three-zone contract.

## Where to go next

- [Commands](/obsidian-wiki/using/commands/): the shipped command reference
- [Custom procedures](/obsidian-wiki/extending/custom-procedures/): hooking into an existing command rather than adding a new one
