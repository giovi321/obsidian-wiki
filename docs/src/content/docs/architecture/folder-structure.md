---
title: Folder structure
description: The shape every wiki lands on, and the two root config files that drive everything
---

Every wiki lands on the same shape on disk: three zones plus two config files and an index at the root. Folder names are yours to choose at setup; the machinery underneath stays the same.

<div class="diagram-frame">
<svg viewBox="0 0 840 788" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#14171f"/>
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#8e96aa"/>
    </marker>
    <marker id="arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#f08254"/>
    </marker>
  </defs>
  <!-- Root header -->
  <text x="32" y="40" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.16em">WIKI ROOT</text>
  <text x="32" y="64" fill="#e8eaef" font-size="16" font-weight="600" font-family="'Geist Mono', monospace">&lt;wiki-root&gt;/</text>
  <!-- ===== Tree lines (drawn first, sit behind everything) ===== -->
  <!-- trunk -->
  <line x1="44" y1="72" x2="44" y2="464" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <!-- level-1 ticks -->
  <line x1="44" y1="100" x2="60" y2="100" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="44" y1="128" x2="60" y2="128" stroke="rgba(240,130,84,0.55)" stroke-width="1"/>
  <line x1="44" y1="156" x2="60" y2="156" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="44" y1="192" x2="56" y2="192" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="44" y1="328" x2="56" y2="328" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="44" y1="464" x2="56" y2="464" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <!-- zone 1 secondary spine + ticks -->
  <line x1="76" y1="200" x2="76" y2="292" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="220" x2="92" y2="220" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="244" x2="92" y2="244" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="268" x2="92" y2="268" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="292" x2="92" y2="292" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <!-- zone 2 secondary spine + ticks -->
  <line x1="76" y1="336" x2="76" y2="428" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="356" x2="92" y2="356" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="380" x2="92" y2="380" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="404" x2="92" y2="404" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="428" x2="92" y2="428" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <!-- zone 3 secondary spine + ticks -->
  <line x1="76" y1="472" x2="76" y2="684" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="492" x2="92" y2="492" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="516" x2="92" y2="516" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="540" x2="92" y2="540" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="564" x2="92" y2="564" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="588" x2="92" y2="588" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="612" x2="92" y2="612" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="636" x2="92" y2="636" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="660" x2="92" y2="660" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <line x1="76" y1="684" x2="92" y2="684" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <!-- ===== Focal accent pill: wiki-config.md ===== -->
  <rect x="60" y="118" width="112" height="20" rx="4" fill="#14171f"/>
  <rect x="60" y="118" width="112" height="20" rx="4" fill="rgba(240,130,84,0.18)" stroke="#f08254" stroke-width="1"/>
  <!-- ===== Level-1 files ===== -->
  <text x="64" y="104" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">CLAUDE.md</text>
  <text x="300" y="104" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">generic schema, identical across every wiki this plugin manages</text>
  <text x="68" y="132" fill="#f08254" font-size="12" font-weight="600" font-family="'Geist Mono', monospace">wiki-config.md</text>
  <text x="300" y="132" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">this wiki's specific configuration; edit to reconfigure</text>
  <text x="64" y="160" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">index.md</text>
  <text x="300" y="160" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">auto-maintained catalog of every page</text>
  <!-- ===== Zone 1: entry points ===== -->
  <text x="60" y="196" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.16em">ZONE 1, ENTRY POINTS</text>
  <text x="300" y="196" fill="#8e96aa" font-size="12" font-style="italic" font-family="'Geist', sans-serif">you drop files here; the agent reads them on /ingest</text>
  <text x="96" y="224" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">99_Quick-notes/</text>
  <text x="300" y="224" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">raw notes, brain dumps, your inbox</text>
  <text x="96" y="248" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">98_Other/</text>
  <text x="300" y="248" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">articles, PDFs, web clips you save</text>
  <text x="96" y="272" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">4_Conversations/</text>
  <text x="300" y="272" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">LLM session exports</text>
  <text x="96" y="296" fill="#8e96aa" font-size="12" font-family="'Geist Mono', monospace">(custom)</text>
  <text x="300" y="296" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">add your own at setup: voice transcripts, daily journal, images...</text>
  <!-- ===== Zone 2: structured knowledge ===== -->
  <text x="60" y="332" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.16em">ZONE 2, STRUCTURED KNOWLEDGE</text>
  <text x="300" y="332" fill="#8e96aa" font-size="12" font-style="italic" font-family="'Geist', sans-serif">where /ingest writes distilled output; you can read and edit by hand</text>
  <text x="96" y="360" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">1_Projects/</text>
  <text x="300" y="360" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">active work, one folder per category, archived ones in _old/</text>
  <text x="96" y="384" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">3_Documentation/</text>
  <text x="300" y="384" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">durable knowledge articles, the agent's main output</text>
  <text x="96" y="408" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">2_Resources/</text>
  <text x="300" y="408" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">lists, references, personal memory</text>
  <text x="96" y="432" fill="#8e96aa" font-size="12" font-family="'Geist Mono', monospace">(custom)</text>
  <text x="300" y="432" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">people, concepts, anything you declare in wiki-config.md</text>
  <!-- ===== Zone 3: _service ===== -->
  <text x="60" y="468" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.16em">ZONE 3, _SERVICE/, AGENT-ONLY STATE</text>
  <text x="300" y="468" fill="#8e96aa" font-size="12" font-style="italic" font-family="'Geist', sans-serif">tracking, logs, feedback; do not edit by hand unless you know why</text>
  <text x="96" y="496" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">.manifest.json</text>
  <text x="300" y="496" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">sha256 ledger of every ingested source, enables incremental reruns</text>
  <text x="96" y="520" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">log.md</text>
  <text x="300" y="520" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">append-only operation log</text>
  <text x="96" y="544" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">hot.md</text>
  <text x="300" y="544" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">last 20 touched pages, for cheap 'what changed?' queries</text>
  <text x="96" y="568" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">feedback.md</text>
  <text x="300" y="568" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">behavioral rules you've taught the agent via /feedback</text>
  <text x="96" y="592" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">sources/</text>
  <text x="300" y="592" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">one summary page per ingested source, with backlinks to pages</text>
  <text x="96" y="616" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">_archives/</text>
  <text x="300" y="616" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">timestamped snapshots from /archive and pre-/rebuild</text>
  <text x="96" y="640" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">entry-points/</text>
  <text x="300" y="640" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">where source files are moved after post_ingest: move</text>
  <text x="96" y="664" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">lint-&lt;date&gt;.md</text>
  <text x="300" y="664" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">latest /lint report, per-day file</text>
  <text x="96" y="688" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">custom-procedures/</text>
  <text x="300" y="688" fill="#8e96aa" font-size="12" font-family="'Geist', sans-serif">optional: per-wiki procedure files (task-extraction, ...). User-authored.</text>
  <!-- footer note -->
  <text x="64" y="716" fill="#8e96aa" font-size="12" font-style="italic" font-family="'Geist', sans-serif">Everything in _service/ is regenerable from sources via /rebuild, except feedback.md.</text>
  <!-- ===== Legend strip ===== -->
  <line x1="32" y1="744" x2="808" y2="744" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>
  <rect x="64" y="760" width="12" height="12" rx="2" fill="rgba(240,130,84,0.18)" stroke="#f08254" stroke-width="1"/>
  <text x="84" y="770" fill="#8e96aa" font-size="12" font-family="'Geist Mono', monospace">FOCAL: YOUR CUSTOMIZATION</text>
  <text x="336" y="770" fill="#8e96aa" font-size="12" font-family="'Geist Mono', monospace">MONOSPACE = FILE OR FOLDER</text>
  <text x="600" y="770" fill="#8e96aa" font-size="12" font-family="'Geist Mono', monospace">NAMES CONFIGURABLE AT SETUP</text>
</svg>
</div>

## Folder names are chosen at setup

The diagram uses one example naming scheme. The names of the entry points and knowledge folders are yours to pick during `/setup-wiki`; nothing in the commands hard-codes them. Two people running this plugin can end up with folder trees that look nothing alike, while the three-zone layout and the operating contract stay identical.

## The two config files drive everything

Two files at the root drive everything, and every command reads both on every invocation.

`CLAUDE.md` is generic boilerplate, identical across every wiki this plugin manages. It describes the three-zone architecture, the hard boundary, folder permissions, routing rules, page types, and the reading order. Do not edit it by hand; `/setup-wiki` writes it from the plugin template and `/upgrade` refreshes it when the template changes.

`wiki-config.md` is your wiki's configuration and the file you actually edit. Its frontmatter holds the name, slug, root path, entry points (each with a path, source type, default quality, post-ingest rule, and exclude list), knowledge folders, dashboards, protected paths, project thresholds, tag vocabulary, and writing style. The body holds free-form prose about page types, naming conventions, and any wiki-specific rules.

## Related reference

- [Entry points](/obsidian-wiki/concepts/entry-points/): the folders you drop sources into
- [Structured knowledge](/obsidian-wiki/concepts/structured-knowledge/): the distilled pages the agent writes
- [Schemas](/obsidian-wiki/reference/schemas/): the entry-point, manifest, and registry schemas
