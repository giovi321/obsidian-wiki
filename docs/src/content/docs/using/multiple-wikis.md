---
title: Two or more wikis
description: How the wiki slug argument targets one of several registered wikis on every command
---

Every command takes the wiki slug as its first argument, so running more than one wiki is a matter of naming the target:

```
/ingest personal
/ingest work some-file.md
/query personal "what did I decide about X?"
```

If exactly one wiki is registered, the slug is optional; the agent falls back to it, so `/ingest` alone works. If two or more are registered and you omit the slug, the agent lists the slugs and asks which to target. Pick a short slug at setup (one to four characters) and the friction is minimal.

No per-wiki command files are generated anywhere. One canonical command file per verb lives in the plugin folder, and the slug is resolved from the argument at invocation. Plugin updates apply to every wiki at once, because there is only one file per verb.

## Where to go next

- [Commands](/obsidian-wiki/using/commands/): every verb takes the slug as its first argument
- [The daily workflow](/obsidian-wiki/using/daily-workflow/): the loop each wiki settles into
