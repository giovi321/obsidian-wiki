---
title: obsidian-wiki
description: A Claude Code plugin that turns Obsidian folders into an agent-maintained wiki
---

<div style="text-align: center; margin-bottom: 1rem;">
  <img src="assets/logo.svg" alt="obsidian-wiki" width="96" height="96" style="border-radius: 20px;" />
</div>

**A Claude Code plugin that turns Obsidian folders into a wiki an agent maintains for you**

You already save things you mean to come back to: quick notes, PDFs, saved articles, voice memos, exported chats. Most of it you never open again. obsidian-wiki fixes the second half of that habit. You drop a source into a folder, run one command, and the agent reads it and writes it up as short, cross-linked wiki pages: what the source said, distilled, with a link back to the original and a note on how much to trust it. You read and edit the result in Obsidian, exactly like any other note.

Nothing about it is magic and nothing runs on its own. It is a set of commands you invoke, a few folders in your vault, and a plain-markdown output you own. If you deleted the plugin tomorrow, every page it wrote would still be there and still readable.

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

## Why a wiki works well for an LLM

A wiki is the format that serves a language model and a human at the same time. The pages are plain markdown with named titles, explicit cross-links, typed relationships, and a note on each claim's source and confidence. A model reads that natively and can follow the links; you read the exact same file and can edit it.

That is the opposite of a typical RAG store, where your documents are chopped into embedding chunks you cannot read, retrieval returns fragments by fuzzy similarity, and there is nothing to open, correct, or trust. With a wiki you can structure any kind of knowledge for a model while keeping it fully human-readable. See [Why a wiki, not a RAG](concepts/why-a-wiki-not-a-rag/) for the full argument.

## What it does

- Ingests: scans folders you nominate as entry points, hashes new and changed files, classifies them by source type, extracts the durable knowledge, and writes it into your knowledge folders. Each claim carries a provenance marker; each page carries a confidence score
- Maintains: cross-links pages, surfaces orphans and broken links, flags stale and low-confidence content, tracks each page from `draft` to `reviewed` to `verified`, and proposes archiving projects that have gone quiet
- Answers and updates: answers questions using only the wiki, folds in targeted updates from a URL or free text, captures the durable parts of the current conversation, and runs web research that gets distilled back into pages

## Quick start

```bash
# In Claude Code CLI
/plugin marketplace add giovi321/obsidian-wiki
/plugin install obsidian-wiki
```

Then register a wiki and run the daily loop:

```text
/setup-wiki                       # interview: name, root folder, entry points
/ingest <slug> some-file.md       # distil a source into pages
/query <slug> "what did I save about X?"
```

Full walkthrough: [Install in Claude Code](getting-started/claude-code/) and [First run](getting-started/first-run/).

## What it is not

- Not a chat-history dump. Conversation sources score 0.3 by default and are filtered hard; verbatim assistant output is never written
- Not autonomous. Every command is invoked by you. There is no background indexing, no watcher, no scheduled task
- Not a replacement for Obsidian. Output is plain markdown with wikilinks and frontmatter on disk; you keep using Obsidian to read and navigate

## Where to go next

- New here: [Why a wiki, not a RAG](concepts/why-a-wiki-not-a-rag/), then [Install in Claude Code](getting-started/claude-code/)
- Understand the model: [Architecture overview](architecture/overview/) and [Concepts](concepts/config-files/)
- Daily use: [The daily workflow](using/daily-workflow/) and [Commands](using/commands/)
- Look something up: [Reference](reference/confidence-scoring/)
