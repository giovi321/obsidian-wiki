---
title: Architecture overview
description: The three zones of a wiki, the registry that lists them all, and how the whole system fits on one screen
---

Each wiki has three zones, plus a registry that lives outside every wiki and lists them all. The zones separate what you drop in from what the agent distills and from the operational state it keeps.

<div class="diagram-frame">
<svg viewBox="0 0 800 624" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#14171f"/>
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#8e96aa"/>
    </marker>
    <marker id="arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#f08254"/>
    </marker>
  </defs>
  <!-- ===== Arrows drawn first, behind nodes ===== -->
  <!-- Entry points -> /ingest (read) -->
  <path d="M 112 152 L 344 232" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)"/>
  <path d="M 304 152 L 380 232" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)"/>
  <path d="M 496 152 L 420 232" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)"/>
  <path d="M 688 152 L 456 232" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)"/>
  <!-- /ingest -> structured knowledge (write) -->
  <path d="M 336 296 L 108 356" stroke="#f08254" stroke-width="1" fill="none" marker-end="url(#arrow-accent)"/>
  <path d="M 372 296 L 256 356" stroke="#f08254" stroke-width="1" fill="none" marker-end="url(#arrow-accent)"/>
  <path d="M 400 296 L 400 356" stroke="#f08254" stroke-width="1" fill="none" marker-end="url(#arrow-accent)"/>
  <path d="M 428 296 L 544 356" stroke="#f08254" stroke-width="1" fill="none" marker-end="url(#arrow-accent)"/>
  <path d="M 464 296 L 692 356" stroke="#f08254" stroke-width="1" fill="none" marker-end="url(#arrow-accent)"/>
  <!-- ===== Zone 1: entry points ===== -->
  <text x="40" y="32" fill="#6c7587" font-size="9" font-family="'Geist Mono', monospace" letter-spacing="0.14em">ZONE 1 &#183; ENTRY POINTS</text>
  <line x1="40" y1="40" x2="760" y2="40" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>
  <rect x="32" y="72" width="160" height="80" rx="6" fill="#14171f"/>
  <rect x="32" y="72" width="160" height="80" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.12)"/>
  <text x="112" y="108" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Quick-notes</text>
  <text x="112" y="128" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">quick-note</text>
  <rect x="224" y="72" width="160" height="80" rx="6" fill="#14171f"/>
  <rect x="224" y="72" width="160" height="80" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.12)"/>
  <text x="304" y="108" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Articles, PDFs</text>
  <text x="304" y="128" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">article</text>
  <rect x="416" y="72" width="160" height="80" rx="6" fill="#14171f"/>
  <rect x="416" y="72" width="160" height="80" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.12)"/>
  <text x="496" y="108" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Transcripts</text>
  <text x="496" y="128" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">voice-transcript</text>
  <rect x="608" y="72" width="160" height="80" rx="6" fill="#14171f"/>
  <rect x="608" y="72" width="160" height="80" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.12)"/>
  <text x="688" y="108" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">LLM conversations</text>
  <text x="688" y="128" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">claude-chat</text>
  <!-- Arrow label -->
  <rect x="372" y="184" width="56" height="16" fill="#14171f"/>
  <text x="400" y="196" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle" letter-spacing="0.08em">READ</text>
  <!-- ===== /ingest engine (focal accent) ===== -->
  <rect x="320" y="232" width="160" height="64" rx="6" fill="#14171f"/>
  <rect x="320" y="232" width="160" height="64" rx="6" fill="rgba(240,130,84,0.18)" stroke="#f08254" stroke-width="1.2"/>
  <text x="400" y="260" fill="#e8eaef" font-size="13" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/ingest</text>
  <text x="400" y="280" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">classify, dedup, distill</text>
  <!-- Arrow label -->
  <rect x="372" y="318" width="56" height="16" fill="#14171f"/>
  <text x="400" y="330" fill="#f08254" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle" letter-spacing="0.08em">WRITE</text>
  <!-- ===== Zone 2: structured knowledge ===== -->
  <text x="40" y="348" fill="#6c7587" font-size="9" font-family="'Geist Mono', monospace" letter-spacing="0.14em">ZONE 2 &#183; STRUCTURED KNOWLEDGE</text>
  <rect x="40" y="356" width="128" height="72" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="104" y="388" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Projects</text>
  <text x="104" y="408" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">active work</text>
  <rect x="188" y="356" width="128" height="72" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="252" y="388" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Documentation</text>
  <text x="252" y="408" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">curated articles</text>
  <rect x="336" y="356" width="128" height="72" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="400" y="388" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Resources</text>
  <text x="400" y="408" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">references, lists</text>
  <rect x="484" y="356" width="128" height="72" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="548" y="388" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">People</text>
  <text x="548" y="408" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">person pages</text>
  <rect x="632" y="356" width="128" height="72" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="696" y="388" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Concepts</text>
  <text x="696" y="408" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">companies, frameworks</text>
  <!-- ===== Zone 3: service ===== -->
  <text x="40" y="464" fill="#6c7587" font-size="9" font-family="'Geist Mono', monospace" letter-spacing="0.14em">ZONE 3 &#183; SERVICE, READ AND WRITTEN BY EVERY COMMAND</text>
  <line x1="40" y1="472" x2="760" y2="472" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>
  <rect x="40" y="484" width="100" height="64" rx="6" fill="#14171f"/>
  <rect x="40" y="484" width="100" height="64" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.12)"/>
  <text x="90" y="512" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">manifest</text>
  <text x="90" y="530" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">sha256 ledger</text>
  <rect x="164" y="484" width="100" height="64" rx="6" fill="#14171f"/>
  <rect x="164" y="484" width="100" height="64" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.12)"/>
  <text x="214" y="512" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">log</text>
  <text x="214" y="530" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">append-only</text>
  <rect x="288" y="484" width="100" height="64" rx="6" fill="#14171f"/>
  <rect x="288" y="484" width="100" height="64" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.12)"/>
  <text x="338" y="512" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">hot.md</text>
  <text x="338" y="530" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">last 20 touches</text>
  <rect x="412" y="484" width="100" height="64" rx="6" fill="#14171f"/>
  <rect x="412" y="484" width="100" height="64" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.12)"/>
  <text x="462" y="512" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">sources</text>
  <text x="462" y="530" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">per-source pages</text>
  <rect x="536" y="484" width="100" height="64" rx="6" fill="#14171f"/>
  <rect x="536" y="484" width="100" height="64" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.12)"/>
  <text x="586" y="512" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">archives</text>
  <text x="586" y="530" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">snapshots</text>
  <rect x="660" y="484" width="100" height="64" rx="6" fill="#14171f"/>
  <rect x="660" y="484" width="100" height="64" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.12)"/>
  <text x="710" y="512" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">feedback</text>
  <text x="710" y="530" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">behavioral rules</text>
  <!-- ===== Legend ===== -->
  <line x1="40" y1="576" x2="760" y2="576" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>
  <text x="40" y="600" fill="#6c7587" font-size="9" font-family="'Geist Mono', monospace" letter-spacing="0.14em">LEGEND</text>
  <line x1="120" y1="596" x2="148" y2="596" stroke="#8e96aa" stroke-width="1" marker-end="url(#arrow)"/>
  <text x="156" y="600" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace">read</text>
  <line x1="224" y1="596" x2="252" y2="596" stroke="#f08254" stroke-width="1" marker-end="url(#arrow-accent)"/>
  <text x="260" y="600" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace">write</text>
</svg>
</div>

## The three zones

| Zone | Contents | Agent permission |
|---|---|---|
| Entry points | Folders you drop sources into. Configured per wiki | Read, add `processed` frontmatter, move per `post_ingest` rule |
| Structured knowledge | Projects, documentation, resources, people, concepts (whichever you enable) | Read and write |
| `_service/` | Manifest, log, hot list, source summaries, archives, feedback rules | Read and write |

Entry points are the boundary between things you saved and things the agent has read. Structured knowledge holds the distilled pages the agent writes and you edit. The `_service/` folder holds operational state that the agent maintains and mostly stays out of your way.

## The registry

The registry at `~/.claude/obsidian-wiki/wiki-registry.json` lists every wiki and its absolute root path. The plugin reads it on every invocation to resolve which wiki a command targets. It is set at the first `/setup-wiki` run and records the shared `vault_root` where the docs at `<vault_root>/_service/docs/` live. See [Entry points](/obsidian-wiki/concepts/entry-points/) and [Structured knowledge](/obsidian-wiki/concepts/structured-knowledge/) for what each zone does.

## The whole system on one screen

For the whole system at once, the plugin folder, the registry, the shared docs, one wiki blown up to show its three zones and config files, and the command groups, see the panopticon view.

<div class="diagram-frame">
<svg viewBox="0 0 1000 780" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#14171f"/>
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#8e96aa"/>
    </marker>
    <marker id="arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#f08254"/>
    </marker>
  </defs>
  <!-- ============ ARROWS FIRST (sit behind nodes) ============ -->
  <!-- TOP: Agent reads plugin / registry / shared docs -->
  <path d="M 736 94 L 722 94" stroke="#8e96aa" stroke-width="0.8" fill="none" marker-end="url(#arrow)" stroke-dasharray="3,3"/>
  <path d="M 848 132 L 848 148 L 380 148 L 380 132" stroke="#8e96aa" stroke-width="0.8" fill="none" marker-end="url(#arrow)" stroke-dasharray="3,3"/>
  <path d="M 848 132 L 848 160 L 148 160 L 148 132" stroke="#8e96aa" stroke-width="0.8" fill="none" marker-end="url(#arrow)" stroke-dasharray="3,3"/>
  <!-- MIDDLE: zone-to-zone flow -->
  <path d="M 340 436 L 358 436" stroke="#f08254" stroke-width="1" fill="none" marker-end="url(#arrow-accent)"/>
  <path d="M 640 436 L 658 436" stroke="#8e96aa" stroke-width="0.8" fill="none" marker-end="url(#arrow)" stroke-dasharray="3,3"/>
  <!-- ============ TOP BAND: plugin / global state ============ -->
  <text x="40" y="32" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.14em">PLUGIN AND GLOBAL STATE · ONE PER USER</text>
  <line x1="40" y1="40" x2="960" y2="40" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>
  <!-- plugin -->
  <rect x="40" y="56" width="216" height="76" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="148" y="84" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">obsidian-wiki plugin</text>
  <text x="148" y="104" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">~/.claude/plugins/obsidian-wiki/</text>
  <text x="148" y="120" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">commands · skills · templates · scripts · docs</text>
  <!-- registry (FOCAL / accent) -->
  <rect x="272" y="56" width="216" height="76" rx="6" fill="#14171f"/>
  <rect x="272" y="56" width="216" height="76" rx="6" fill="rgba(240,130,84,0.18)" stroke="#f08254"/>
  <text x="380" y="84" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">registry</text>
  <text x="380" y="104" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">~/.claude/obsidian-wiki/wiki-registry.json</text>
  <text x="380" y="120" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">list of wikis · vault_root</text>
  <!-- shared docs -->
  <rect x="504" y="56" width="216" height="76" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="612" y="84" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">shared docs</text>
  <text x="612" y="104" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">&lt;vault_root&gt;/_service/docs/</text>
  <text x="612" y="120" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">README + diagrams · refreshed by /upgrade</text>
  <!-- Agent -->
  <rect x="736" y="56" width="224" height="76" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="848" y="84" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Agent</text>
  <text x="848" y="104" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">runs command files</text>
  <text x="848" y="120" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">in Cowork or CLI</text>
  <!-- READS label on the elbow run -->
  <rect x="590" y="132" width="48" height="12" rx="2" fill="#14171f"/>
  <text x="614" y="141" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle" letter-spacing="0.08em">READS</text>
  <!-- ============ MIDDLE BAND: one wiki blown up ============ -->
  <text x="40" y="176" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.14em">ONE WIKI · REGISTER N OF THESE</text>
  <line x1="40" y1="184" x2="960" y2="184" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>
  <!-- container -->
  <rect x="40" y="196" width="920" height="380" rx="8" fill="#1d2030" stroke="#8e96aa" stroke-width="1.2"/>
  <text x="60" y="224" fill="#e8eaef" font-size="16" font-weight="600" font-family="'Geist Mono', monospace">&lt;wiki-root&gt;/</text>
  <text x="60" y="240" fill="#8e96aa" font-size="8" font-family="'Geist', sans-serif" font-style="italic">three zones plus config + index at the root</text>
  <!-- config: CLAUDE.md -->
  <rect x="60" y="248" width="280" height="48" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="200" y="272" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">CLAUDE.md</text>
  <text x="200" y="288" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">generic · identical for every wiki</text>
  <!-- config: wiki-config.md (you edit) -->
  <rect x="360" y="248" width="280" height="48" rx="6" fill="#14171f"/>
  <rect x="360" y="248" width="280" height="48" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.30)"/>
  <text x="500" y="272" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">wiki-config.md</text>
  <text x="500" y="288" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">YOUR config · entry points · structure · rules</text>
  <!-- config: index.md -->
  <rect x="660" y="248" width="280" height="48" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="800" y="272" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">index.md</text>
  <text x="800" y="288" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">auto-maintained page catalog</text>
  <!-- ZONE 1: entry points (you edit) -->
  <rect x="60" y="316" width="280" height="244" rx="6" fill="#14171f"/>
  <rect x="60" y="316" width="280" height="244" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.30)"/>
  <text x="76" y="336" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.12em">ZONE 1 · ENTRY POINTS</text>
  <text x="76" y="352" fill="#8e96aa" font-size="8" font-family="'Geist', sans-serif" font-style="italic">where you drop sources</text>
  <text x="76" y="380" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">99_Quick-notes/</text>
  <text x="76" y="400" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">98_Other/</text>
  <text x="76" y="420" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">4_Conversations/</text>
  <text x="76" y="440" fill="#8e96aa" font-size="12" font-family="'Geist Mono', monospace">(custom)</text>
  <text x="76" y="468" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.10em">POST-INGEST RULES</text>
  <text x="76" y="484" fill="#8e96aa" font-size="8" font-family="'Geist', sans-serif">move | keep | read_only</text>
  <text x="76" y="512" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.10em">SOURCE TYPES</text>
  <text x="76" y="528" fill="#8e96aa" font-size="8" font-family="'Geist', sans-serif">quick-note, article, claude-chat,</text>
  <text x="76" y="540" fill="#8e96aa" font-size="8" font-family="'Geist', sans-serif">voice-transcript, image, ...</text>
  <!-- ZONE 2: structured knowledge (agent writes) -->
  <rect x="360" y="316" width="280" height="244" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="376" y="336" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.12em">ZONE 2 · STRUCTURED KNOWLEDGE</text>
  <text x="376" y="352" fill="#8e96aa" font-size="8" font-family="'Geist', sans-serif" font-style="italic">where agent writes pages</text>
  <text x="376" y="380" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">1_Projects/</text>
  <text x="376" y="400" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">3_Documentation/</text>
  <text x="376" y="420" fill="#e8eaef" font-size="12" font-family="'Geist Mono', monospace">2_Resources/</text>
  <text x="376" y="440" fill="#8e96aa" font-size="12" font-family="'Geist Mono', monospace">(custom)</text>
  <text x="376" y="468" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.10em">PAGE LIFECYCLE</text>
  <text x="376" y="484" fill="#8e96aa" font-size="8" font-family="'Geist', sans-serif">draft &#8594; reviewed &#8594; verified</text>
  <text x="376" y="512" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.10em">PROVENANCE PER CLAIM</text>
  <text x="376" y="528" fill="#8e96aa" font-size="8" font-family="'Geist', sans-serif">extracted | ^[inferred] | ^[ambiguous]</text>
  <!-- ZONE 3: _service (agent-managed) -->
  <rect x="660" y="316" width="280" height="244" rx="6" fill="#1d2030" stroke="#8e96aa"/>
  <text x="676" y="336" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.12em">ZONE 3 · _SERVICE</text>
  <text x="676" y="352" fill="#8e96aa" font-size="8" font-family="'Geist', sans-serif" font-style="italic">operational state</text>
  <text x="676" y="376" fill="#e8eaef" font-size="8" font-family="'Geist Mono', monospace">.manifest.json     sha256 dedup</text>
  <text x="676" y="392" fill="#e8eaef" font-size="8" font-family="'Geist Mono', monospace">log.md             append-only</text>
  <text x="676" y="408" fill="#e8eaef" font-size="8" font-family="'Geist Mono', monospace">hot.md             last 20 touches</text>
  <text x="676" y="424" fill="#e8eaef" font-size="8" font-family="'Geist Mono', monospace">sources/           per-source pages</text>
  <text x="676" y="440" fill="#e8eaef" font-size="8" font-family="'Geist Mono', monospace">_archives/         snapshots</text>
  <text x="676" y="456" fill="#e8eaef" font-size="8" font-family="'Geist Mono', monospace">entry-points/      moved sources</text>
  <text x="676" y="472" fill="#e8eaef" font-size="8" font-family="'Geist Mono', monospace" font-weight="600">feedback.md        one-line rules</text>
  <text x="676" y="488" fill="#e8eaef" font-size="8" font-family="'Geist Mono', monospace" font-weight="600">custom-procedures/ multi-step hooks</text>
  <text x="676" y="516" fill="#8e96aa" font-size="8" font-family="'Geist', sans-serif" font-style="italic">last two are user-authored;</text>
  <text x="676" y="528" fill="#8e96aa" font-size="8" font-family="'Geist', sans-serif" font-style="italic">the rest agent-managed</text>
  <!-- inter-zone arrow labels -->
  <rect x="324" y="418" width="52" height="14" rx="2" fill="#14171f"/>
  <text x="350" y="428" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle" letter-spacing="0.08em">/INGEST</text>
  <rect x="628" y="418" width="44" height="14" rx="2" fill="#14171f"/>
  <text x="650" y="428" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle" letter-spacing="0.08em">TRACK</text>
  <!-- ============ BOTTOM BAND: commands ============ -->
  <text x="40" y="608" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.14em">COMMANDS · ALL TAKE A WIKI SLUG · ACT ON ANY WIKI VIA THE REGISTRY</text>
  <line x1="40" y1="616" x2="960" y2="616" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>
  <!-- Daily loop -->
  <rect x="40" y="632" width="216" height="92" rx="6" fill="#14171f"/>
  <rect x="40" y="632" width="216" height="92" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.30)"/>
  <text x="148" y="652" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Daily loop</text>
  <text x="148" y="672" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/status</text>
  <text x="148" y="688" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/ingest</text>
  <text x="148" y="704" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/ingest-url · /ingest-claude</text>
  <text x="148" y="720" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/capture</text>
  <!-- Maintenance -->
  <rect x="276" y="632" width="216" height="92" rx="6" fill="#14171f"/>
  <rect x="276" y="632" width="216" height="92" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.30)"/>
  <text x="384" y="652" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Maintenance</text>
  <text x="384" y="672" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/lint</text>
  <text x="384" y="688" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/cross-linker</text>
  <text x="384" y="704" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/archive · /restore</text>
  <text x="384" y="720" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/rebuild (rare)</text>
  <!-- Use and refine -->
  <rect x="512" y="632" width="216" height="92" rx="6" fill="#14171f"/>
  <rect x="512" y="632" width="216" height="92" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.30)"/>
  <text x="620" y="652" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Use and refine</text>
  <text x="620" y="672" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/query [--visibility ...]</text>
  <text x="620" y="688" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/update</text>
  <text x="620" y="704" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/research</text>
  <text x="620" y="720" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/project (list|new|archive)</text>
  <!-- Setup and teach -->
  <rect x="748" y="632" width="212" height="92" rx="6" fill="#14171f"/>
  <rect x="748" y="632" width="212" height="92" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.30)"/>
  <text x="854" y="652" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">Setup and teach</text>
  <text x="854" y="672" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/setup-wiki</text>
  <text x="854" y="688" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/upgrade · /update-docs</text>
  <text x="854" y="704" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/feedback</text>
  <text x="854" y="720" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">/daily-note</text>
  <!-- ============ LEGEND STRIP ============ -->
  <line x1="40" y1="744" x2="960" y2="744" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>
  <rect x="40" y="756" width="16" height="12" rx="2" fill="rgba(240,130,84,0.18)" stroke="#f08254"/>
  <text x="64" y="766" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace">FOCAL POINT</text>
  <line x1="176" y1="762" x2="204" y2="762" stroke="#f08254" stroke-width="1" marker-end="url(#arrow-accent)"/>
  <text x="216" y="766" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace">INGEST FLOW</text>
  <line x1="332" y1="762" x2="360" y2="762" stroke="#8e96aa" stroke-width="0.8" stroke-dasharray="3,3" marker-end="url(#arrow)"/>
  <text x="372" y="766" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace">READS / TRACKS</text>
  <rect x="520" y="756" width="16" height="12" rx="2" fill="#1d2030" stroke="#8e96aa"/>
  <text x="544" y="766" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace">AGENT-MANAGED</text>
  <rect x="700" y="756" width="16" height="12" rx="2" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.30)"/>
  <text x="724" y="766" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace">YOU EDIT</text>
</svg>
</div>

Two files at each wiki root drive everything: `CLAUDE.md` (generic boilerplate, identical across every wiki) and `wiki-config.md` (yours). Every command reads both on every invocation. See [Commands](/obsidian-wiki/using/commands/) for what each verb does.
