---
title: The ingest pipeline
description: The seven steps one source goes through, from SHA-256 hash to updated tracking
---

A source dropped into an entry point goes through seven steps, from a hash check that skips unchanged files to writing a page and updating the tracking files. Nothing runs on its own; the pipeline runs when you invoke `/ingest`.

<div class="diagram-frame">
<svg viewBox="0 0 800 740" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#14171f"/>
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#8e96aa"/>
    </marker>
    <marker id="arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#f08254"/>
    </marker>
  </defs>

  <!-- Eyebrow -->
  <text x="300" y="28" fill="#6c7587" font-size="10" font-family="'Geist Mono', monospace" letter-spacing="0.14em">INGEST ONE SOURCE</text>

  <!-- Arrows first (render behind boxes) -->
  <path d="M 400 80 L 400 108" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)"/>
  <path d="M 400 168 L 400 196" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)"/>
  <path d="M 500 228 L 596 228" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)" stroke-dasharray="5,4"/>
  <path d="M 400 256 L 400 284" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)"/>
  <path d="M 400 344 L 400 372" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)"/>
  <path d="M 400 432 L 400 460" stroke="#f08254" stroke-width="1.2" fill="none" marker-end="url(#arrow-accent)"/>
  <path d="M 400 520 L 400 548" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)"/>
  <path d="M 400 608 L 400 636" stroke="#8e96aa" stroke-width="1" fill="none" marker-end="url(#arrow)"/>

  <!-- Arrow label: hash match -->
  <rect x="512" y="208" width="76" height="16" rx="2" fill="#14171f"/>
  <text x="550" y="220" fill="#6c7587" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle" letter-spacing="0.10em">HASH MATCH</text>

  <!-- Node 1: file dropped -->
  <rect x="300" y="40" width="200" height="40" rx="6" fill="#14171f"/>
  <rect x="300" y="40" width="200" height="40" rx="6" fill="rgba(232,234,239,0.06)" stroke="#6c7587"/>
  <text x="400" y="64" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">file dropped in entry point</text>

  <!-- Node 2: SHA-256 -->
  <rect x="300" y="112" width="200" height="56" rx="6" fill="#14171f"/>
  <rect x="300" y="112" width="200" height="56" rx="6" fill="#1d2030" stroke="#e8eaef"/>
  <text x="400" y="136" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">compute SHA-256</text>
  <text x="400" y="154" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">compare to manifest</text>

  <!-- Node 3: skip (right offshoot) -->
  <rect x="600" y="200" width="160" height="56" rx="6" fill="#14171f"/>
  <rect x="600" y="200" width="160" height="56" rx="6" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.30)" stroke-dasharray="4,3"/>
  <text x="680" y="224" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">skip</text>
  <text x="680" y="242" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">no-op</text>

  <!-- Node 4: classify source -->
  <rect x="300" y="200" width="200" height="56" rx="6" fill="#14171f"/>
  <rect x="300" y="200" width="200" height="56" rx="6" fill="#1d2030" stroke="#e8eaef"/>
  <text x="400" y="224" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">classify source</text>
  <text x="400" y="242" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">assign source_quality</text>

  <!-- Node 5: extract items -->
  <rect x="300" y="288" width="200" height="56" rx="6" fill="#14171f"/>
  <rect x="300" y="288" width="200" height="56" rx="6" fill="#1d2030" stroke="#e8eaef"/>
  <text x="400" y="312" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">extract knowledge items</text>
  <text x="400" y="330" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">discard low-signal</text>

  <!-- Node 6: route per config -->
  <rect x="300" y="376" width="200" height="56" rx="6" fill="#14171f"/>
  <rect x="300" y="376" width="200" height="56" rx="6" fill="#1d2030" stroke="#e8eaef"/>
  <text x="400" y="400" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">route per CLAUDE.md</text>
  <text x="400" y="418" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">structured-knowledge folder</text>

  <!-- Node 7: write or update page (FOCAL) -->
  <rect x="300" y="460" width="200" height="60" rx="6" fill="#14171f"/>
  <rect x="300" y="460" width="200" height="60" rx="6" fill="rgba(240,130,84,0.18)" stroke="#f08254" stroke-width="1.2"/>
  <text x="400" y="484" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">write or update page</text>
  <text x="400" y="500" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">frontmatter, provenance</text>

  <!-- Node 8: post-ingest -->
  <rect x="300" y="548" width="200" height="56" rx="6" fill="#14171f"/>
  <rect x="300" y="548" width="200" height="56" rx="6" fill="#1d2030" stroke="#e8eaef"/>
  <text x="400" y="572" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">post-ingest rule</text>
  <text x="400" y="590" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">move or keep</text>

  <!-- Node 9: update tracking -->
  <rect x="280" y="636" width="240" height="40" rx="6" fill="#14171f"/>
  <rect x="280" y="636" width="240" height="40" rx="6" fill="rgba(232,234,239,0.06)" stroke="#8e96aa"/>
  <text x="400" y="656" fill="#e8eaef" font-size="12" font-weight="600" font-family="'Geist', sans-serif" text-anchor="middle">update manifest, log, hot.md</text>
  <text x="400" y="670" fill="#8e96aa" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle">append + push</text>

  <!-- Legend strip -->
  <line x1="40" y1="700" x2="760" y2="700" stroke="rgba(232,234,239,0.12)" stroke-width="1"/>
  <rect x="200" y="712" width="16" height="12" rx="2" fill="#1d2030" stroke="#e8eaef"/>
  <text x="224" y="722" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace">pipeline step</text>
  <rect x="336" y="712" width="16" height="12" rx="2" fill="rgba(240,130,84,0.18)" stroke="#f08254"/>
  <text x="360" y="722" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace">write page (focal)</text>
  <rect x="512" y="712" width="16" height="12" rx="2" fill="rgba(232,234,239,0.06)" stroke="rgba(232,234,239,0.30)" stroke-dasharray="4,3"/>
  <text x="536" y="722" fill="#8e96aa" font-size="9" font-family="'Geist Mono', monospace">skip branch</text>
</svg>
</div>

## The seven steps

1. The agent computes SHA-256 and compares with `_service/.manifest.json`. If the hash matches, it skips; reruns never re-process unchanged files
2. Classify the source by type and assign a `source_quality` score from a fixed bucket list (paper, official, documentation, article, blog, voice-transcript, claude-chat, and so on)
3. Extract knowledge items: entities, claims, links. Discard greetings, dead-ends, and low-signal content
4. Route each item to a knowledge folder per the routing rules in `CLAUDE.md`
5. Write or update the page with full frontmatter: summary (≤200 chars), `sources`, `base_confidence`, `lifecycle: draft`, `provenance` fractions. Apply inline provenance markers (`^[inferred]`, `^[ambiguous]`) on individual claims
6. Apply the entry point's `post_ingest` rule: either add `processed: true` and move the file under `_service/entry-points/<entry-point>/<YYYY-MM>/`, or add the frontmatter and leave it in place
7. Update the manifest, append a one-liner to `_service/log.md`, push the touched page onto `_service/hot.md`

## Minimum page size

The minimum page size is 250 words. If a knowledge item cannot reach that threshold, the agent defers it until more material accumulates rather than producing a stub page.

## Related reference

- [Page frontmatter](/obsidian-wiki/reference/page-frontmatter/): the full frontmatter written at step 5
- [Schemas](/obsidian-wiki/reference/schemas/): the manifest and source ID rules used at steps 1 and 2
- [Confidence scoring](/obsidian-wiki/reference/confidence-scoring/): how `base_confidence` is computed
- [Page lifecycle](/obsidian-wiki/concepts/page-lifecycle/): why new pages start at `draft`
