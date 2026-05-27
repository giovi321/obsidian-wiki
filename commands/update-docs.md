---
description: Refresh the shared docs folder from the plugin's current README and diagrams
---

Refresh the shared docs at `<vault_root>/_service/docs/`.

## Procedure

1. Read `~/.claude/obsidian-wiki/wiki-registry.json`. If `vault_root` is not set, abort and ask the user to run `/setup-wiki` first.

2. Copy, overwriting:
   - `${CLAUDE_PLUGIN_ROOT}/README.md` → `<vault_root>/_service/docs/README.md`. **Rewrite paths**: replace every `docs/diagrams/` in the README with `diagrams/`. The README in the plugin repo references diagrams as `docs/diagrams/<name>.svg` because it sits at the repo root; the local copy sits inside `_service/docs/`, so the prefix must be stripped for the relative paths to resolve.
   - `${CLAUDE_PLUGIN_ROOT}/docs/diagrams/*.svg` → `<vault_root>/_service/docs/diagrams/`

3. If the vault root has changed (the path in the registry no longer exists on disk), abort and ask the user to update the registry or re-run setup.

4. Report: number of files copied, target path.

## Constraints

- Only writes inside `<vault_root>/_service/docs/`.
- Does not touch any wiki's `_service/` folder.
- Does not modify the registry.
- Safe to run any time; idempotent.
