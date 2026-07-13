---
title: The daily workflow
description: The cadence of dropping sources, ingesting, linting, and querying once a wiki is set up
---

Once a wiki is set up, the loop settles into a rhythm. Drop sources continuously, ingest them daily, lint weekly, archive monthly, and run the read and update commands any time.

<div class="diagram-frame">
<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#14171f"/>
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#8e96aa"/>
    </marker>
    <marker id="arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#f08254"/>
    </marker>
  </defs>

  <!-- Title -->
  <text x="40" y="36" fill="#6c7587" font-size="10" font-family="'Geist Mono', monospace" letter-spacing="0.18em">CADENCE OF THE DAILY LOOP</text>

  <!-- Vertical separator between cadence column and command column -->
  <line x1="180" y1="48" x2="180" y2="536" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>

  <!-- ================= LANE 1: CONTINUOUS ================= -->
  <text x="40" y="80" fill="#6c7587" font-size="9" font-family="'Geist Mono', monospace" letter-spacing="0.14em">CONTINUOUS</text>
  <text x="40" y="96" fill="#8e96aa" font-size="10" font-family="'Geist', sans-serif" font-style="italic">throughout your day</text>

  <rect x="200" y="56" width="560" height="48" rx="6" fill="#14171f"/>
  <rect x="200" y="56" width="560" height="48" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.30)"/>
  <text x="220" y="80" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif">drop files into entry points</text>
  <text x="220" y="96" fill="#8e96aa" font-size="10" font-family="'Geist Mono', monospace">no command needed; files sit until /ingest runs</text>

  <line x1="40" y1="120" x2="760" y2="120" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>

  <!-- ================= LANE 2: EVERY FEW DAYS (focal) ================= -->
  <text x="40" y="176" fill="#6c7587" font-size="9" font-family="'Geist Mono', monospace" letter-spacing="0.14em">EVERY FEW DAYS</text>
  <text x="40" y="192" fill="#8e96aa" font-size="10" font-family="'Geist', sans-serif" font-style="italic">check, then compile</text>

  <!-- arrow drawn before boxes -->
  <path d="M 340 176 L 396 176" stroke="#f08254" stroke-width="1.2" fill="none" marker-end="url(#arrow-accent)"/>
  <rect x="352" y="160" width="32" height="12" rx="2" fill="#14171f"/>
  <text x="368" y="169" fill="#f08254" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle" letter-spacing="0.1em">THEN</text>

  <rect x="200" y="152" width="140" height="48" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="270" y="176" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/status</text>
  <text x="270" y="192" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">what changed?</text>

  <rect x="400" y="152" width="160" height="48" rx="6" fill="#14171f"/>
  <rect x="400" y="152" width="160" height="48" rx="6" fill="rgba(240,130,84,0.18)" stroke="#f08254" stroke-width="1.2"/>
  <text x="480" y="176" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/ingest</text>
  <text x="480" y="192" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">distill new sources</text>

  <text x="584" y="180" fill="#8e96aa" font-size="10" font-family="'Geist', sans-serif" font-style="italic">pages written,</text>
  <text x="584" y="194" fill="#8e96aa" font-size="10" font-family="'Geist', sans-serif" font-style="italic">manifest updated</text>

  <line x1="40" y1="216" x2="760" y2="216" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>

  <!-- ================= LANE 3: WEEKLY ================= -->
  <text x="40" y="272" fill="#6c7587" font-size="9" font-family="'Geist Mono', monospace" letter-spacing="0.14em">WEEKLY</text>
  <text x="40" y="288" fill="#8e96aa" font-size="10" font-family="'Geist', sans-serif" font-style="italic">maintenance</text>

  <path d="M 340 272 L 396 272" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)"/>
  <rect x="352" y="256" width="32" height="12" rx="2" fill="#14171f"/>
  <text x="368" y="265" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle" letter-spacing="0.1em">THEN</text>

  <rect x="200" y="248" width="140" height="48" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="270" y="272" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/lint</text>
  <text x="270" y="288" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">find issues</text>

  <rect x="400" y="248" width="160" height="48" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="480" y="272" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/cross-linker</text>
  <text x="480" y="288" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">repair wikilinks</text>

  <text x="584" y="268" fill="#8e96aa" font-size="10" font-family="'Geist', sans-serif" font-style="italic">orphans, broken</text>
  <text x="584" y="282" fill="#8e96aa" font-size="10" font-family="'Geist', sans-serif" font-style="italic">links, stale pages</text>

  <line x1="40" y1="312" x2="760" y2="312" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>

  <!-- ================= LANE 4: MONTHLY OR RARE ================= -->
  <text x="40" y="368" fill="#6c7587" font-size="9" font-family="'Geist Mono', monospace" letter-spacing="0.14em">MONTHLY OR RARE</text>
  <text x="40" y="384" fill="#8e96aa" font-size="10" font-family="'Geist', sans-serif" font-style="italic">snapshots and resets</text>

  <rect x="200" y="344" width="140" height="48" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="270" y="368" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/archive</text>
  <text x="270" y="384" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">snapshot</text>

  <rect x="400" y="344" width="160" height="48" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)" stroke-dasharray="4,3"/>
  <text x="480" y="368" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/rebuild</text>
  <text x="480" y="384" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">reprocess all sources</text>

  <text x="584" y="364" fill="#8e96aa" font-size="10" font-family="'Geist', sans-serif" font-style="italic">rebuild only after</text>
  <text x="584" y="378" fill="#8e96aa" font-size="10" font-family="'Geist', sans-serif" font-style="italic">schema changes</text>

  <line x1="40" y1="408" x2="760" y2="408" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>

  <!-- ================= LANE 5: AD-HOC, ANY TIME ================= -->
  <text x="40" y="464" fill="#6c7587" font-size="9" font-family="'Geist Mono', monospace" letter-spacing="0.14em">AD-HOC, ANY TIME</text>
  <text x="40" y="480" fill="#8e96aa" font-size="10" font-family="'Geist', sans-serif" font-style="italic">use, refine, teach</text>

  <!-- Row 1 -->
  <rect x="200" y="444" width="128" height="40" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="264" y="461" fill="#e8eaef" font-size="11" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/query</text>
  <text x="264" y="475" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">ask the wiki</text>

  <rect x="344" y="444" width="128" height="40" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="408" y="461" fill="#e8eaef" font-size="11" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/update</text>
  <text x="408" y="475" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">refine a page</text>

  <rect x="488" y="444" width="128" height="40" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="552" y="461" fill="#e8eaef" font-size="11" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/research</text>
  <text x="552" y="475" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">web + distill</text>

  <rect x="632" y="444" width="128" height="40" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="696" y="461" fill="#e8eaef" font-size="11" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/capture</text>
  <text x="696" y="475" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">save this chat</text>

  <!-- Row 2 -->
  <rect x="200" y="492" width="128" height="40" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="264" y="509" fill="#e8eaef" font-size="11" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/ingest-url</text>
  <text x="264" y="523" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">one URL</text>

  <rect x="344" y="492" width="128" height="40" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="408" y="509" fill="#e8eaef" font-size="11" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/ingest-claude</text>
  <text x="408" y="523" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">conversation exports</text>

  <rect x="488" y="492" width="128" height="40" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="552" y="509" fill="#e8eaef" font-size="11" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/project</text>
  <text x="552" y="523" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">create/archive</text>

  <rect x="632" y="492" width="128" height="40" rx="6" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="696" y="509" fill="#e8eaef" font-size="11" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">/feedback</text>
  <text x="696" y="523" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">teach the agent</text>

  <!-- ================= LEGEND ================= -->
  <line x1="40" y1="556" x2="760" y2="556" stroke="rgba(232,234,239,0.12)" stroke-width="0.8"/>
  <text x="40" y="582" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" letter-spacing="0.14em">LEGEND</text>
  <rect x="120" y="572" width="14" height="14" rx="2" fill="rgba(240,130,84,0.18)" stroke="#f08254"/>
  <text x="142" y="583" fill="#8e96aa" font-size="10" font-family="'Geist Mono', monospace">primary loop</text>
  <rect x="264" y="572" width="14" height="14" rx="2" fill="#1d2030" stroke="rgba(232,234,239,0.30)"/>
  <text x="286" y="583" fill="#8e96aa" font-size="10" font-family="'Geist Mono', monospace">supporting</text>
  <rect x="400" y="572" width="14" height="14" rx="2" fill="#1d2030" stroke="rgba(232,234,239,0.30)" stroke-dasharray="4,3"/>
  <text x="422" y="583" fill="#8e96aa" font-size="10" font-family="'Geist Mono', monospace">rare / conditional</text>
</svg>
</div>

- Continuous: drop files into entry points whenever something is worth keeping. No command needed; the files sit until you ingest
- Daily or every few days: `/status` to see what changed, then `/ingest` to compile the new sources into pages. This is the primary loop
- Weekly: `/lint` to surface issues, then `/cross-linker` to repair link problems
- Monthly or before a big change: `/archive` to snapshot the knowledge. Use `/rebuild` only when you have changed the schema and want to reprocess everything from scratch
- Any time: `/query` to ask a question, `/update` to refine a page, `/research` to pull sources from the web, `/capture` to save the durable parts of the current conversation, `/capture --quick` to stage findings in under 60 seconds, `/feedback` to teach a new rule
- Session end (optional): install `.claude/hooks/wiki-stop-capture.sh` (see `wiki-setup/SKILL.md`, "Optional: session-end capture hook") to have Claude Code nudge you with `/capture --quick` at the end of a session that had edits or shell activity

## Where to go next

- [Commands](/obsidian-wiki/using/commands/): the full command list and reference
- [Retrieval and modes](/obsidian-wiki/reference/retrieval-and-modes/): how read commands escalate and how append, rebuild, and restore differ
- [Feedback and custom procedures](/obsidian-wiki/concepts/feedback-and-procedures/): the two ways to teach the agent
