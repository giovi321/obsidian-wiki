#!/usr/bin/env python3
"""Graph-analysis helper for obsidian-wiki.

Analyses the SHAPE of a wiki's link graph and emits JSON on stdout.
Used by the /insights command, mirroring how /status calls manifest.py.

Usage:
  python scripts/graph.py analyse <wiki-root> [--structured "<dir1>,<dir2>,..."]

  If --structured is omitted, every top-level directory of <wiki-root> whose name
  does NOT start with "_" or "." is scanned (skips _service, _archives, _raw,
  _readouts, .obsidian, ...). The /insights command passes the structured-knowledge
  folders from wiki-config.md via --structured.

Nodes are .md pages (id = path relative to the wiki root, forward slashes, no
extension). Edges are [[wikilinks]] in page bodies plus relationships: frontmatter
targets, both directed from the page to the target. Wikilink targets resolve by
basename (Obsidian filename resolution); links to non-existent pages are ignored
for degree but counted as dead targets in stats.

On success prints valid JSON only. On a fatal error prints a single "ERROR: ..."
line to stderr and exits 1 so the caller can fall back to a manual computation.
Pure Python 3 standard library, python3.9+ compatible, deterministic.
"""
from __future__ import annotations

import json
import os
import re
import sys

WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
INLINE_TAG_RE = re.compile(r"(?:^|\s)#([A-Za-z0-9_][A-Za-z0-9_/-]*)")
INLINE_TAGS_RE = re.compile(r"^tags:\s*\[(.*)\]\s*$")


def _read_text(path):
    """Read a file as UTF-8, replacing undecodable bytes. Returns "" on failure."""
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


def _split_frontmatter(text):
    """Return (frontmatter_lines, body_text). Handles a leading --- ... --- block."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return [], text
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            body = "\n".join(lines[i + 1:])
            return lines[1:i], body
    # No closing fence: treat everything as body (malformed, but do not crash).
    return [], text


def _parse_page(text):
    """Extract (tags:set, targets:list) from a page. Never raises."""
    tags = set()
    targets = []
    try:
        fm_lines, body = _split_frontmatter(text)

        # Tags + relationship targets from frontmatter.
        in_tags_block = False
        for raw in fm_lines:
            line = raw.rstrip()
            stripped = line.strip()

            inline = INLINE_TAGS_RE.match(stripped)
            if inline:
                for part in inline.group(1).split(","):
                    tag = part.strip().strip("'\"").lstrip("#")
                    if tag:
                        tags.add(tag)
                in_tags_block = False
                continue

            if stripped == "tags:":
                in_tags_block = True
                continue

            if in_tags_block:
                if stripped.startswith("- "):
                    tag = stripped[2:].strip().strip("'\"").lstrip("#")
                    if tag:
                        tags.add(tag)
                    continue
                # A non-indented, non-list key ends the tags block.
                if line and not line[0].isspace():
                    in_tags_block = False

            # relationships: targets (and any other target: line inside frontmatter)
            if "target:" in stripped:
                for m in WIKILINK_RE.findall(line):
                    targets.append(m)

        # Wikilinks in the body.
        for m in WIKILINK_RE.findall(body):
            targets.append(m)

        # Inline #tags in the body.
        for m in INLINE_TAG_RE.findall(body):
            tags.add(m)
    except Exception:
        # Malformed page: return whatever was gathered so far, never crash.
        pass
    return tags, targets


def _normalise_target(target):
    """Reduce a raw wikilink target to a comparable name (drop alias/heading/block)."""
    t = target.split("|", 1)[0].split("#", 1)[0].strip()
    t = t.replace("\\", "/")
    if t.lower().endswith(".md"):
        t = t[:-3]
    return t.strip("/").strip()


def _scan_dirs(wiki_root, structured):
    """Return the list of absolute directories to walk for pages."""
    if structured:
        dirs = []
        for name in structured:
            d = os.path.join(wiki_root, name)
            if os.path.isdir(d):
                dirs.append((name, d))
        return dirs
    dirs = []
    for name in sorted(os.listdir(wiki_root)):
        if name.startswith("_") or name.startswith("."):
            continue
        d = os.path.join(wiki_root, name)
        if os.path.isdir(d):
            dirs.append((name, d))
    return dirs


def _collect_pages(wiki_root, scan_dirs):
    """Walk scan_dirs, returning ordered (node_id, category, tags, targets) records."""
    records = []
    seen = set()
    for _category, base in scan_dirs:
        for root, subdirs, files in os.walk(base):
            subdirs.sort()
            for fname in sorted(files):
                if not fname.lower().endswith(".md"):
                    continue
                full = os.path.join(root, fname)
                rel = os.path.relpath(full, wiki_root).replace("\\", "/")
                node_id = rel[:-3] if rel.lower().endswith(".md") else rel
                if node_id in seen:
                    continue
                seen.add(node_id)
                category = node_id.split("/", 1)[0]
                tags, targets = _parse_page(_read_text(full))
                records.append((node_id, category, tags, targets))
    return records


def _find_articulation(n, adj):
    """Iterative Tarjan articulation points.

    Returns {node_index: resulting_component_count_after_removal}.
    No recursion, safe on large graphs.
    """
    disc = [-1] * n
    low = [0] * n
    heavy_children = {}   # non-root AP -> count of children with low >= disc
    root_children = {}    # root index -> DFS-tree child count
    timer = 0

    for start in range(n):
        if disc[start] != -1:
            continue
        root = start
        root_children[root] = 0
        disc[start] = low[start] = timer
        timer += 1
        stack = [(start, -1, 0)]
        while stack:
            u, pu, idx = stack[-1]
            if idx < len(adj[u]):
                stack[-1] = (u, pu, idx + 1)
                v = adj[u][idx]
                if v == pu:
                    continue
                if disc[v] == -1:
                    if u == root:
                        root_children[root] += 1
                    disc[v] = low[v] = timer
                    timer += 1
                    stack.append((v, u, 0))
                else:
                    if disc[v] < low[u]:
                        low[u] = disc[v]
            else:
                stack.pop()
                if pu != -1:
                    if low[u] < low[pu]:
                        low[pu] = low[u]
                    if pu != root and low[u] >= disc[pu]:
                        heavy_children[pu] = heavy_children.get(pu, 0) + 1

    resulting = {}
    for node, count in heavy_children.items():
        resulting[node] = count + 1
    for root, count in root_children.items():
        if count >= 2:
            resulting[root] = count
    return resulting


def analyse(wiki_root, structured):
    """Analyse the wiki graph and return the result dict."""
    scan_dirs = _scan_dirs(wiki_root, structured)
    records = _collect_pages(wiki_root, scan_dirs)

    node_ids = [r[0] for r in records]
    node_set = set(node_ids)
    category_of = {r[0]: r[1] for r in records}
    tags_of = {r[0]: set(r[2]) for r in records}

    # Basename index for Obsidian-style link resolution (deterministic).
    basename_index = {}
    for nid in sorted(node_ids):
        base = nid.split("/")[-1]
        basename_index.setdefault(base, []).append(nid)

    def resolve(target):
        t = _normalise_target(target)
        if not t:
            return None
        if t in node_set:
            return t
        base = t.split("/")[-1]
        matches = basename_index.get(base)
        if matches:
            return matches[0]
        return None

    directed = set()   # (source, target) resolved, no self-loops
    dead_targets = 0
    seen_dead = set()
    for nid, _cat, _tags, targets in records:
        for raw in targets:
            resolved = resolve(raw)
            if resolved is None:
                key = (nid, _normalise_target(raw))
                if key not in seen_dead:
                    seen_dead.add(key)
                    dead_targets += 1
                continue
            if resolved == nid:
                continue
            directed.add((nid, resolved))

    # Degrees.
    incoming = {nid: 0 for nid in node_ids}
    outgoing = {nid: 0 for nid in node_ids}
    for a, b in directed:
        outgoing[a] += 1
        incoming[b] += 1

    # Undirected adjacency (index space) for articulation points and cohesion.
    index_of = {nid: i for i, nid in enumerate(node_ids)}
    adj_sets = [set() for _ in node_ids]
    undirected = set()
    for a, b in directed:
        ia, ib = index_of[a], index_of[b]
        adj_sets[ia].add(ib)
        adj_sets[ib].add(ia)
        undirected.add((a, b) if a < b else (b, a))
    adj = [sorted(s) for s in adj_sets]

    # --- hubs: top 10 by total degree ---
    def kind_of(nid):
        i, o = incoming[nid], outgoing[nid]
        if i > 0 and o > 0:
            return "connector"
        if o > 0:
            return "source"
        if i > 0:
            return "sink"
        return "connector"

    ranked = sorted(
        node_ids,
        key=lambda n: (-(incoming[n] + outgoing[n]), n),
    )
    hubs = []
    for nid in ranked[:10]:
        if incoming[nid] + outgoing[nid] == 0:
            break
        hubs.append({
            "page": nid,
            "incoming": incoming[nid],
            "outgoing": outgoing[nid],
            "kind": kind_of(nid),
        })

    # --- bridges: articulation points ---
    resulting = _find_articulation(len(node_ids), adj)
    bridges = []
    for i, comps in resulting.items():
        nid = node_ids[i]
        # Example tag clusters this node joins: most common tags among neighbours.
        neighbour_tags = {}
        for j in adj[i]:
            for t in tags_of[node_ids[j]]:
                neighbour_tags[t] = neighbour_tags.get(t, 0) + 1
        clusters = [t for t, _c in sorted(
            neighbour_tags.items(), key=lambda kv: (-kv[1], kv[0])
        )][:2]
        bridges.append({
            "page": nid,
            "components_created": comps,
            "tag_clusters": clusters,
        })
    bridges.sort(key=lambda b: (-b["components_created"], b["page"]))

    # --- cohesion: tags with >= 5 pages ---
    tag_pages = {}
    for nid in node_ids:
        for t in tags_of[nid]:
            tag_pages.setdefault(t, set()).add(nid)
    intra = {}
    for a, b in undirected:
        common = tags_of[a] & tags_of[b]
        for t in common:
            intra[t] = intra.get(t, 0) + 1
    cohesion = []
    for t in sorted(tag_pages):
        pages = tag_pages[t]
        n = len(pages)
        if n < 5:
            continue
        denom = n * (n - 1) / 2
        value = (intra.get(t, 0) / denom) if denom else 0.0
        cohesion.append({
            "tag": t,
            "pages": n,
            "cohesion": round(value, 4),
        })
    cohesion.sort(key=lambda c: (-c["cohesion"], c["tag"]))

    # --- surprising: cross-category edges ---
    surprising = []
    for a, b in directed:
        ca, cb = category_of[a], category_of[b]
        if ca == cb:
            continue
        score = 2
        reason = "cross-category (%s -> %s)" % (ca, cb)
        peripheral = (incoming[a] + outgoing[a]) <= 2
        target_hub = incoming[b] >= 8
        if peripheral and target_hub:
            score += 2
            reason += "; peripheral source into hub target"
        surprising.append({
            "source": a,
            "target": b,
            "score": score,
            "reason": reason,
        })
    surprising.sort(key=lambda s: (-s["score"], s["source"], s["target"]))
    surprising = surprising[:10]

    # --- dead ends / isolated ---
    dead_ends = sorted(nid for nid in node_ids if outgoing[nid] == 0)
    isolated = sorted(
        nid for nid in node_ids if incoming[nid] == 0 and outgoing[nid] == 0
    )

    # --- snapshot for delta diffing ---
    snapshot = {
        "nodes": sorted(node_ids),
        "edges": sorted([a, b] for a, b in directed),
    }

    categories = sorted(set(category_of.values()))

    return {
        "stats": {
            "pages": len(node_ids),
            "edges": len(directed),
            "categories": len(categories),
            "dead_targets": dead_targets,
        },
        "hubs": hubs,
        "bridges": bridges,
        "cohesion": cohesion,
        "surprising": surprising,
        "dead_ends": dead_ends,
        "isolated": isolated,
        "snapshot": snapshot,
    }


def main():
    argv = sys.argv
    if len(argv) < 3 or argv[1] != "analyse":
        print("ERROR: usage: python graph.py analyse <wiki-root> "
              "[--structured \"dir1,dir2\"]", file=sys.stderr)
        sys.exit(1)

    wiki_root = argv[2]
    structured = None
    i = 3
    while i < len(argv):
        if argv[i] == "--structured" and i + 1 < len(argv):
            structured = [s.strip() for s in argv[i + 1].split(",") if s.strip()]
            i += 2
        else:
            i += 1

    if not os.path.isdir(wiki_root):
        print("ERROR: wiki root not found: %s" % wiki_root, file=sys.stderr)
        sys.exit(1)

    try:
        result = analyse(wiki_root, structured)
    except Exception as exc:  # noqa: BLE001 - fatal boundary, report and exit
        print("ERROR: %s" % exc, file=sys.stderr)
        sys.exit(1)

    print(json.dumps(result, indent=2, sort_keys=True, ensure_ascii=False))


if __name__ == "__main__":
    main()
