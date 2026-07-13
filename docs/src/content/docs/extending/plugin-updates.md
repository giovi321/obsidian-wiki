---
title: Plugin updates
description: What a plugin update refreshes, what it never touches, and how to remove a wiki
---

Nothing you own is touched by a plugin update, and nothing changes silently. Only two plugin-managed files refresh, and only when you ask. Your `wiki-config.md`, custom procedures, and content are never touched by an update.

## The four layers

`CLAUDE.md` at each wiki root is generic boilerplate, a verbatim copy of `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md.tmpl`. When the plugin updates and that template changes, your local `CLAUDE.md` does not auto-refresh. Run `/upgrade` (or `/upgrade <slug>` for one wiki) to pull the new version; it compares hashes and writes only if the template changed.

`wiki-config.md` at each wiki root is yours. The plugin never touches it on update. The documented schema may evolve, but existing config keeps working unless a change is backward-incompatible, and those are flagged with a `BREAKING:` prefix in the commit message.

`<wiki-root>/_service/custom-procedures/` is yours. The plugin reads or writes nothing there except through the `custom_procedures:` list you declare in `wiki-config.md`.

`<vault_root>/_service/docs/` mirrors the plugin's README and diagrams. Refresh it with `/update-docs` after a plugin update; `/upgrade` also refreshes it as part of its sweep.

The registry at `~/.claude/obsidian-wiki/wiki-registry.json` is yours. The plugin reads it on every command and writes to it only via `/setup-wiki`.

## /upgrade

`/upgrade` refreshes the plugin-managed files: `CLAUDE.md` per wiki plus the shared docs. Pass a slug to target one wiki, or run it bare to sweep every registered wiki. It compares hashes and writes `CLAUDE.md` only when the template actually changed. It never touches `wiki-config.md`, `_service/custom-procedures/`, or wiki content.

## /update-docs

`/update-docs` refreshes the shared docs folder on its own. `/setup-wiki` installs the README and diagrams to `<vault_root>/_service/docs/` on first run and refreshes them each time it runs again. To refresh between setups, typically after updating the plugin via the Cowork plugin manager UI or `/plugin update obsidian-wiki` in the CLI, run `/update-docs`. It copies the plugin's current README and diagrams over the shared docs folder.

The shared docs folder lives outside any specific wiki, so multiple wikis under the same vault see the same docs.

## Removing a wiki

`/setup-wiki <slug> --remove` deletes the registry entry. It does not touch the wiki's folder or content; you delete those yourself.

## Where to go next

- [Customization](/obsidian-wiki/extending/customization/): what lives in the files an update never touches
- [The two config files](/obsidian-wiki/concepts/config-files/): why CLAUDE.md and wiki-config.md split responsibility
- [Commands](/obsidian-wiki/using/commands/): the full command reference
