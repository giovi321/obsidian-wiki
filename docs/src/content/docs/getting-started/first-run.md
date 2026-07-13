---
title: First run
description: Register your first wiki with the setup interview
---

After the plugin is installed, register your first wiki with `/setup-wiki`. The interview scaffolds the folders, writes config, and records the wiki in the registry.

```
/setup-wiki
```

The interview asks about the wiki name, root path, which entry points to enable, which knowledge folders to enable, dashboard templates, tag vocabulary, and project thresholds. It scaffolds the folders, writes the wiki's `CLAUDE.md` from `templates/CLAUDE.md.tmpl`, installs the dashboard templates you picked, and registers the wiki at `~/.claude/obsidian-wiki/wiki-registry.json`.

## Adding a second wiki

To add a second wiki, run `/setup-wiki` again. It appends a new registry entry; existing wikis are untouched.

## Next steps

- Understand what setup wrote: [The two config files](/obsidian-wiki/concepts/config-files/)
- Start the daily loop: [The daily workflow](/obsidian-wiki/using/daily-workflow/)
