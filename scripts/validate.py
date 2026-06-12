#!/usr/bin/env python3
"""Consistency validator for the obsidian-wiki plugin repo.

Usage:
  python scripts/validate.py [repo-root]

Checks that the markdown contract stays consistent across commands/, skills/,
templates/, and README.md. Prints one `FAIL <check>: <detail>` line per
finding, `WARN ...` for advisories, then `OK: <n> checks passed` and exits 0,
or exits 1 if any check failed.
"""
import pathlib
import re
import sys

FAILS: list[str] = []
WARNS: list[str] = []


def fail(check: str, detail: str) -> None:
    FAILS.append(f"FAIL {check}: {detail}")


def warn(check: str, detail: str) -> None:
    WARNS.append(f"WARN {check}: {detail}")


def github_slug(heading: str) -> str:
    """GitHub anchor slug: lowercase, strip punctuation, spaces to hyphens."""
    s = heading.strip().lower()
    s = re.sub(r"[^\w\- ]", "", s)
    return s.replace(" ", "-")


def check_command_inventory(root: pathlib.Path) -> None:
    """commands/*.md names must match the README and help.md tables; counts must agree."""
    commands = sorted(p.stem for p in (root / "commands").glob("*.md"))
    readme = (root / "README.md").read_text(encoding="utf-8")
    help_md = (root / "commands" / "help.md").read_text(encoding="utf-8")

    for doc_name, text in (("README.md", readme), ("commands/help.md", help_md)):
        table_cmds = set(re.findall(r"^\| `/([a-z-]+)", text, re.MULTILINE))
        for cmd in commands:
            if cmd not in table_cmds:
                fail("command-inventory", f"/{cmd} exists in commands/ but is missing from the {doc_name} table")
        for cmd in table_cmds:
            if cmd not in commands:
                fail("command-inventory", f"/{cmd} listed in {doc_name} but commands/{cmd}.md does not exist")

    for m in re.finditer(r"## The (\d+) commands|ships (\d+) (?:canonical )?commands", readme):
        count = int(m.group(1) or m.group(2))
        if count != len(commands):
            fail("command-inventory",
                 f"README says {count} commands but commands/ holds {len(commands)}: '{m.group(0)}'")


def check_placeholder_map(root: pathlib.Path) -> None:
    """Every {{placeholder}} in templates/ must be in the wiki-setup substitution map."""
    setup = (root / "skills" / "wiki-setup" / "SKILL.md").read_text(encoding="utf-8")
    mapped = set(re.findall(r"\|\s*`\{\{([a-z_]+)\}\}`", setup))

    used: dict[str, set[str]] = {}
    for tmpl in (root / "templates").glob("*.tmpl"):
        for ph in re.findall(r"\{\{([a-z_]+)\}\}", tmpl.read_text(encoding="utf-8")):
            used.setdefault(ph, set()).add(tmpl.name)

    for ph, files in sorted(used.items()):
        if ph not in mapped:
            fail("placeholder-map", f"{{{{{ph}}}}} used in {', '.join(sorted(files))} but absent from the substitution map")
    for ph in sorted(mapped - set(used)):
        warn("placeholder-map", f"map entry {{{{{ph}}}}} is not used by any template (may feed prose rules)")


EXAMPLE_PATHS = {
    "commands/digest.md",  # hypothetical custom command in README "Adding a custom command"
}


def check_file_references(root: pathlib.Path) -> None:
    """Repo-relative path tokens mentioned in docs must exist on disk.

    Tokens preceded by a path character (`/`, `~`, `_`, word char) are runtime
    paths like ~/.claude/... or <vault_root>/_service/docs/... and are skipped;
    the ${CLAUDE_PLUGIN_ROOT}/ prefix marks an explicit repo reference.
    """
    scan_files = [root / "README.md"]
    scan_files += sorted((root / "commands").glob("*.md"))
    scan_files += sorted((root / "skills").rglob("SKILL.md"))
    scan_files += sorted((root / "templates").glob("*.tmpl"))

    token_re = re.compile(
        r"(?:\$\{CLAUDE_PLUGIN_ROOT\}/|(?<![\w/~.\-]))"
        r"((?:docs|templates|scripts|skills|commands|\.claude)/[A-Za-z0-9_./<>-]*\.(?:md|tmpl|py|sh|svg|json))"
    )
    for f in scan_files:
        text = f.read_text(encoding="utf-8")
        for m in token_re.finditer(text):
            rel = m.group(1)
            if "<" in rel or "*" in rel or rel in EXAMPLE_PATHS:
                continue
            if not (root / rel).exists():
                fail("file-references", f"{f.relative_to(root)} references {rel} which does not exist")


def check_log_ops(root: pathlib.Path) -> None:
    """Operations list in wiki-core SKILL.md is canonical; README must match; commands must not log unknown ops."""
    skill = (root / "skills" / "wiki-core" / "SKILL.md").read_text(encoding="utf-8")
    readme = (root / "README.md").read_text(encoding="utf-8")

    def ops_from(text: str, label: str) -> set[str]:
        m = re.search(r"^Operations: (.+)$", text, re.MULTILINE)
        if not m:
            fail("log-ops", f"no 'Operations:' line found in {label}")
            return set()
        ops_list = m.group(1).split(". ")[0]  # drop any trailing sentence on the same line
        return set(re.findall(r"[A-Z][A-Z-]+", ops_list))

    canonical = ops_from(skill, "skills/wiki-core/SKILL.md")
    readme_ops = ops_from(readme, "README.md")
    if canonical and readme_ops and canonical != readme_ops:
        only_skill = canonical - readme_ops
        only_readme = readme_ops - canonical
        detail = []
        if only_skill:
            detail.append(f"only in SKILL.md: {sorted(only_skill)}")
        if only_readme:
            detail.append(f"only in README: {sorted(only_readme)}")
        fail("log-ops", "; ".join(detail))

    if canonical:
        logged_re = re.compile(r"\[ISO-8601\]\s+([A-Z][A-Z-]+)")
        for cmd in sorted((root / "commands").glob("*.md")):
            for m in logged_re.finditer(cmd.read_text(encoding="utf-8")):
                op = m.group(1)
                if op not in canonical:
                    fail("log-ops", f"commands/{cmd.name} logs '{op}' which is not in the canonical Operations list")


def check_readme_toc(root: pathlib.Path) -> None:
    """Every TOC anchor must resolve to a heading; every ## heading must be in the TOC."""
    readme = (root / "README.md").read_text(encoding="utf-8")
    headings = re.findall(r"^## (.+)$", readme, re.MULTILINE)
    slugs = {github_slug(h) for h in headings}
    toc_anchors = re.findall(r"\]\(#([a-z0-9-]+)\)", readme)

    for anchor in toc_anchors:
        if anchor not in slugs:
            fail("readme-toc", f"TOC links #{anchor} but no matching '## ' heading exists")
    for h in headings:
        if h.strip().lower() == "table of contents":
            continue
        if github_slug(h) not in set(toc_anchors):
            fail("readme-toc", f"heading '## {h}' is missing from the table of contents")


def check_command_frontmatter(root: pathlib.Path) -> None:
    """Every command file declares a description: frontmatter key."""
    for cmd in sorted((root / "commands").glob("*.md")):
        text = cmd.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
        if not m or not re.search(r"^description:", m.group(1), re.MULTILINE):
            fail("command-frontmatter", f"commands/{cmd.name} lacks a description: frontmatter key")


def check_threshold_keys(root: pathlib.Path) -> None:
    """project_thresholds key names must be identical in the template and the setup skill."""
    tmpl = (root / "templates" / "wiki-config.md.tmpl").read_text(encoding="utf-8")
    setup = (root / "skills" / "wiki-setup" / "SKILL.md").read_text(encoding="utf-8")

    def keys_after(text: str) -> set[str]:
        m = re.search(r"^project_thresholds:\n((?:[ \t]+\S+.*\n?)+)", text, re.MULTILINE)
        if not m:
            return set()
        return set(re.findall(r"^[ \t]+([a-z_]+):", m.group(1), re.MULTILINE))

    tmpl_keys = keys_after(tmpl)
    setup_keys = keys_after(setup)
    if not tmpl_keys:
        fail("threshold-keys", "no project_thresholds block found in templates/wiki-config.md.tmpl")
    if not setup_keys:
        fail("threshold-keys", "no project_thresholds block found in skills/wiki-setup/SKILL.md")
    if tmpl_keys and setup_keys and tmpl_keys != setup_keys:
        fail("threshold-keys",
             f"template uses {sorted(tmpl_keys)} but setup skill uses {sorted(setup_keys)}")


def main() -> None:
    root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    if not (root / "commands").is_dir():
        print(f"FAIL setup: {root} does not look like the plugin repo (no commands/ folder)")
        sys.exit(1)

    checks = [
        check_command_inventory,
        check_placeholder_map,
        check_file_references,
        check_log_ops,
        check_readme_toc,
        check_command_frontmatter,
        check_threshold_keys,
    ]
    for check in checks:
        check(root)

    for line in WARNS:
        print(line)
    for line in FAILS:
        print(line)
    if FAILS:
        print(f"{len(FAILS)} failure(s), {len(WARNS)} warning(s)")
        sys.exit(1)
    print(f"OK: {len(checks)} checks passed ({len(WARNS)} warning(s))")


if __name__ == "__main__":
    main()
