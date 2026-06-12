#!/usr/bin/env bash
# Fires on Claude Code Stop event.
# If the session had file edits or significant shell activity,
# prompts the user to run /capture --quick to stage findings.
# Fires at most once per session via a session_id sentinel in TMPDIR.

INPUT=$(cat)

WIKI_STOP_INPUT="$INPUT" python3 - << 'PYEOF'
import os, sys, json, pathlib, tempfile

try:
    d = json.loads(os.environ.get("WIKI_STOP_INPUT", "{}"))
except json.JSONDecodeError:
    sys.exit(0)

session_id = d.get("session_id", "")
stop_active = d.get("stop_hook_active", False)
transcript = d.get("transcript_path", "")

if stop_active or not session_id:
    sys.exit(0)

sentinel = pathlib.Path(tempfile.gettempdir()) / f"wiki-stop-{session_id}"
if sentinel.exists():
    sys.exit(0)

if not transcript or not pathlib.Path(transcript).exists():
    sys.exit(0)

edits = shells = 0
try:
    with open(transcript, encoding="utf-8", errors="ignore") as f:
        for line in f:
            try:
                msg = json.loads(line)
                for block in msg.get("content", []):
                    if isinstance(block, dict) and block.get("type") == "tool_use":
                        name = block.get("name", "")
                        if name in ("Edit", "Write", "MultiEdit"):
                            edits += 1
                        elif name in ("Bash", "PowerShell"):
                            shells += 1
            except (json.JSONDecodeError, TypeError):
                pass
except Exception:
    sys.exit(0)

if edits >= 1 or shells >= 4:
    sentinel.touch()
    print(
        f"Session summary: {edits} file edit(s), {shells} shell call(s). "
        "Run /capture --quick to stage any useful findings to your wiki "
        "(fast path — no manifest writes, under 60 s).",
        file=sys.stderr,
    )
    sys.exit(2)
PYEOF
