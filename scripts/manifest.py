#!/usr/bin/env python3
"""Manifest helper for obsidian-wiki.

Usage:
  python scripts/manifest.py normalize <manifest-path>
      Expand tilde paths to absolute and merge duplicate source keys. Wiki-root-relative
      keys are left alone: see "Key styles" below.

  python scripts/manifest.py delta <manifest-path> <entry-point-dir>...
      Print tab-separated (reason, path) lines for sources that are new or hash-changed.
      Respects WIKI_SKIP_PROJECTS env var: comma-separated project slugs to exclude.

Key styles
----------
A manifest may key its file-based sources either as absolute paths or as wiki-root-relative
POSIX paths ("2_Plaud/2026-08-19.md"), as long as one style is used consistently. Both are
valid; the relative style is what a wiki's source pages usually record as `source_id`, so
rewriting it to absolute would orphan those references. `delta` therefore looks a walked
file up under every plausible key spelling instead of assuming one, and `normalize` only
canonicalizes the keys it can safely rewrite (tilde-prefixed ones).

Run `delta` from the wiki root so relative keys resolve.
"""
import hashlib
import json
import os
import pathlib
import sys


def _sha256(path: str) -> str | None:
    h = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()
    except OSError:
        return None


def _is_tilde_key(key: str) -> bool:
    """Return True if the key is a tilde-prefixed file path, which normalize can rewrite."""
    return key.startswith("~")


def _key_candidates(file: pathlib.Path) -> list[str]:
    """Every spelling a manifest might use for this walked file, cheapest first.

    Covers both key styles: absolute (either separator) and wiki-root-relative POSIX.
    Order matters only for speed; the first hit wins and they all denote the same file.
    """
    candidates = [str(file), file.as_posix()]
    try:
        resolved = file.resolve()
    except OSError:
        return list(dict.fromkeys(candidates))

    candidates += [str(resolved), resolved.as_posix()]
    try:
        rel = resolved.relative_to(pathlib.Path.cwd())
    except (ValueError, OSError):
        pass
    else:
        candidates += [str(rel), rel.as_posix()]

    return list(dict.fromkeys(candidates))


def normalize(manifest_path: str) -> None:
    """Expand tilde-prefixed source keys; merge collision duplicates."""
    p = pathlib.Path(manifest_path)
    with open(p, encoding="utf-8") as f:
        manifest = json.load(f)

    original_count = len(manifest.get("sources", {}))
    normalized: dict = {}

    for key, entry in manifest.get("sources", {}).items():
        canon = str(pathlib.Path(key).expanduser().resolve()) if _is_tilde_key(key) else key

        if canon in normalized:
            existing = normalized[canon]
            if entry.get("ingested_at", "") > existing.get("ingested_at", ""):
                merged = {**existing, **entry}
            else:
                merged = {**entry, **existing}
            merged["wiki_pages"] = sorted(set(
                existing.get("wiki_pages", []) + entry.get("wiki_pages", [])
            ))
            merged["projects_touched"] = sorted(set(
                existing.get("projects_touched", []) + entry.get("projects_touched", [])
            ))
            normalized[canon] = merged
        else:
            normalized[canon] = entry

    manifest["sources"] = normalized

    tmp = p.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    tmp.replace(p)

    after_count = len(normalized)
    merged_count = original_count - after_count
    print(f"normalize: {original_count} keys -> {after_count} "
          f"({'no merges' if merged_count == 0 else f'{merged_count} collision(s) merged'})")


def delta(manifest_path: str, entry_point_dirs: list[str],
          skip_projects: list[str] | None = None) -> list[tuple[str, str]]:
    """Return (path, reason) pairs for sources absent from or changed in the manifest."""
    if skip_projects is None:
        skip_projects = []

    p = pathlib.Path(manifest_path)
    sources: dict = {}
    if p.exists():
        with open(p, encoding="utf-8") as f:
            sources = json.load(f).get("sources", {})

    result: list[tuple[str, str]] = []

    for ep_dir in entry_point_dirs:
        ep = pathlib.Path(ep_dir)
        if not ep.is_dir():
            continue
        for file in sorted(ep.rglob("*")):
            if not file.is_file():
                continue
            keys = _key_candidates(file)
            if any(f"/projects/{slug}/" in k for slug in skip_projects for k in keys):
                continue
            sha = _sha256(str(file))
            if sha is None:
                continue
            entry = next((sources[k] for k in keys if k in sources), None)
            reported = file.as_posix()
            if entry is None:
                result.append((reported, "new"))
            elif entry.get("sha256") != sha:
                result.append((reported, "changed"))

    return result


def main() -> None:
    # Source paths routinely carry non-ASCII characters; the Windows console defaults to
    # cp1252 and would abort the whole run on the first one.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass

    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "normalize":
        normalize(sys.argv[2])
    elif cmd == "delta":
        skip = [s.strip() for s in os.environ.get("WIKI_SKIP_PROJECTS", "").split(",") if s.strip()]
        for path, reason in delta(sys.argv[2], sys.argv[3:], skip_projects=skip):
            print(f"{reason}\t{path}")
    else:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
