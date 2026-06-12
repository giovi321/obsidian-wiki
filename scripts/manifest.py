#!/usr/bin/env python3
"""Manifest helper for obsidian-wiki.

Usage:
  python scripts/manifest.py normalize <manifest-path>
      Expand tilde and relative file paths to absolute; merge duplicate source keys.

  python scripts/manifest.py delta <manifest-path> <entry-point-dir>...
      Print tab-separated (reason, path) lines for sources that are new or hash-changed.
      Respects WIKI_SKIP_PROJECTS env var: comma-separated project slugs to exclude.
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


def _is_file_key(key: str) -> bool:
    """Return True if the key looks like a file path rather than a URL/DOI/etc."""
    return key.startswith("~") or key.startswith("/") or (len(key) > 2 and key[1] == ":")


def normalize(manifest_path: str) -> None:
    """Rewrite file-based source keys to absolute paths; merge collision duplicates."""
    p = pathlib.Path(manifest_path)
    with open(p, encoding="utf-8") as f:
        manifest = json.load(f)

    original_count = len(manifest.get("sources", {}))
    normalized: dict = {}

    for key, entry in manifest.get("sources", {}).items():
        canon = str(pathlib.Path(key).expanduser().resolve()) if _is_file_key(key) else key

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
    print(f"normalize: {original_count} keys → {after_count} "
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
            abs_path = str(file.resolve())
            norm_path = abs_path.replace("\\", "/")
            if any(f"/projects/{slug}/" in norm_path for slug in skip_projects):
                continue
            sha = _sha256(abs_path)
            if sha is None:
                continue
            entry = sources.get(abs_path) or sources.get(str(file))
            if entry is None:
                result.append((abs_path, "new"))
            elif entry.get("sha256") != sha:
                result.append((abs_path, "changed"))

    return result


def main() -> None:
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
