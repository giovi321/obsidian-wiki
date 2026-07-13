---
title: Install in Cowork
description: Install the obsidian-wiki plugin from the Cowork desktop app UI
---

Cowork is the desktop app for Claude. It does not support the `/plugin` slash command, so plugins install through its UI.

1. Open Cowork
2. Open Customize from the menu
3. Go to Personal plugins
4. Click Browse plugins
5. Add the marketplace by pasting `giovi321/obsidian-wiki` as the source
6. Install the `obsidian-wiki` plugin from the listing under Personal

The plugin files are cloned to your local Cowork plugin folder (typically under `~/.claude/plugins/` or the platform-specific equivalent Cowork shows). The plugin lives on your computer; no part of it runs on a remote server.

## Install from a local clone

To install from a local clone instead of the marketplace:

```bash
git clone git@github.com:giovi321/obsidian-wiki.git ~/.claude/plugins/obsidian-wiki
```

Then restart Cowork; the plugin appears in the list.

## Using the slash commands in Cowork

Inside a Cowork chat, the slash commands work the same as in the CLI. Type `/setup-wiki` and the interview begins. The `AskUserQuestion` prompts the setup command uses render as clickable options in Cowork's chat panel, which is easier than typing answers by hand.

## Updating in Cowork

To update the plugin in Cowork, use the same plugin manager UI; there is no `/plugin update` command there. After an update, run `/upgrade` from a chat to refresh `CLAUDE.md` and the shared docs in each wiki.

## Next steps

- Install the Obsidian plugins the dashboards depend on: [Obsidian plugins](/obsidian-wiki/getting-started/obsidian-plugins/)
- Register your first wiki: [First run](/obsidian-wiki/getting-started/first-run/)
