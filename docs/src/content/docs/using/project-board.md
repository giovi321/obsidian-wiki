---
title: The project board
description: An optional kanban of open tasks, one column per active project, rendered from a DataviewJS view stored in the vault
---

An optional dashboard: a horizontally scrolling kanban of open tasks, one column per
active project, discovered from the wiki's projects folder. It ships in
`templates/board/` and `/setup-wiki` offers to install it.

Tasks are read wherever they are already written, in Obsidian Tasks syntax, and routed
to a column by the wikilinks at the start of the line. Nothing is copied into a board
file, and no task ever moves between notes: the source note stays the only copy.

<div class="diagram-frame">
<svg viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, 'Segoe UI', Roboto, sans-serif">
  <rect width="100%" height="100%" fill="#191919"/>
  <!-- ===================== Board settings, collapsed ===================== -->
  <rect x="16" y="16" width="968" height="44" rx="8" fill="#2b2b2b"/>
  <text x="34" y="44" fill="#d8d8d8" font-size="16">▶ Board settings</text>
  <!-- ===================== Toolbar ===================== -->
  <rect x="16" y="74" width="250" height="32" rx="6" fill="#1d1d1d" stroke="#343434"/>
  <text x="28" y="95" fill="#6b6b6b" font-size="13">Filter tasks…</text>
  <text x="282" y="95" fill="#8a8a8a" font-size="11" letter-spacing="0.08em">SORT</text>
  <rect x="322" y="74" width="96" height="32" rx="6" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="334" y="95" fill="#d8d8d8" font-size="13">Manual</text>
  <rect x="428" y="79" width="21" height="22" rx="4" fill="#1d1d1d" stroke="#343434"/>
  <text x="434" y="95" fill="#8f8f8f" font-size="11">↑</text>
  <text x="462" y="95" fill="#6b6b6b" font-size="12.5">Reorder with the arrows in each column header</text>
  <!-- ================================================================== -->
  <!-- COLUMN 1 — Unassigned (triage). No arrows, no menu: not a project. -->
  <!-- ================================================================== -->
  <rect x="16" y="120" width="236" height="580" rx="8" fill="#1c1c1c" stroke="#2e2e2e"/>
  <text x="32" y="152" fill="#e4e4e4" font-size="15">Unassigned</text>
  <rect x="122" y="139" width="30" height="19" rx="9.5" fill="#2f2f2f"/>
  <text x="132" y="153" fill="#a2a2a2" font-size="12">2</text>
  <rect x="160" y="139" width="19" height="19" rx="4" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="165" y="153" fill="#9a9a9a" font-size="12" font-weight="600">+</text>
  <line x1="32" y1="170" x2="236" y2="170" stroke="#2e2e2e"/>
  <text x="32" y="192" fill="#757575" font-size="11.5" letter-spacing="0.07em">OPEN (2)</text>
  <rect x="30" y="202" width="208" height="86" rx="6" fill="#242424" stroke="#313131"/>
  <rect x="42" y="216" width="17" height="17" rx="4" fill="#1d1d1d" stroke="#6a6a6a"/>
  <text x="70" y="229" fill="#d8d8d8" font-size="13">chase the invoice from</text>
  <text x="70" y="248" fill="#d8d8d8" font-size="13">the print shop</text>
  <text x="215" y="229" fill="#8a8a8a" font-size="11">✎</text>
  <rect x="42" y="258" width="80" height="20" rx="5" fill="#2e2e2e"/>
  <text x="50" y="272" fill="#9a9a9a" font-size="11">created 11 Jan</text>
  <rect x="30" y="298" width="208" height="86" rx="6" fill="#242424" stroke="#313131"/>
  <rect x="42" y="312" width="17" height="17" rx="4" fill="#1d1d1d" stroke="#6a6a6a"/>
  <text x="70" y="325" fill="#d8d8d8" font-size="13">find out who owns the</text>
  <text x="70" y="344" fill="#d8d8d8" font-size="13">old status page</text>
  <text x="215" y="325" fill="#8a8a8a" font-size="11">✎</text>
  <rect x="42" y="354" width="80" height="20" rx="5" fill="#2e2e2e"/>
  <text x="50" y="368" fill="#9a9a9a" font-size="11">created 12 Jan</text>
  <!-- ================================================================== -->
  <!-- COLUMN 2 — website-redesign                                        -->
  <!-- ================================================================== -->
  <rect x="266" y="120" width="236" height="580" rx="8" fill="#1c1c1c" stroke="#2e2e2e"/>
  <text x="282" y="152" fill="#e4e4e4" font-size="15">website-redesign</text>
  <rect x="396" y="139" width="30" height="19" rx="9.5" fill="#2f2f2f"/>
  <text x="406" y="153" fill="#a2a2a2" font-size="12">4</text>
  <rect x="434" y="139" width="19" height="19" rx="4" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="439" y="153" fill="#9a9a9a" font-size="12" font-weight="600">+</text>
  <rect x="457" y="139" width="19" height="19" rx="4" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="463" y="153" fill="#9a9a9a" font-size="9">◀</text>
  <rect x="480" y="139" width="19" height="19" rx="4" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="486" y="153" fill="#9a9a9a" font-size="9">▶</text>
  <line x1="282" y1="170" x2="486" y2="170" stroke="#2e2e2e"/>
  <text x="282" y="192" fill="#757575" font-size="11.5" letter-spacing="0.07em">IN PROGRESS (1)</text>
  <rect x="280" y="202" width="208" height="86" rx="6" fill="#242424" stroke="#313131"/>
  <rect x="292" y="216" width="17" height="17" rx="4" fill="#1d1d1d" stroke="#6a6a6a"/>
  <path d="M 295 224.5 L 306 224.5" stroke="#8a8a8a" stroke-width="2"/>
  <text x="320" y="229" fill="#d8d8d8" font-size="13">rewrite the pricing page</text>
  <text x="320" y="248" fill="#d8d8d8" font-size="13">copy</text>
  <text x="465" y="229" fill="#8a8a8a" font-size="11">✎</text>
  <rect x="292" y="258" width="76" height="20" rx="5" fill="#2e2e2e"/>
  <text x="300" y="272" fill="#9a9a9a" font-size="11">created 7 Jan</text>
  <text x="282" y="314" fill="#757575" font-size="11.5" letter-spacing="0.07em">OPEN (3)</text>
  <rect x="280" y="324" width="208" height="86" rx="6" fill="#242424" stroke="#313131"/>
  <rect x="292" y="338" width="17" height="17" rx="4" fill="#1d1d1d" stroke="#6a6a6a"/>
  <text x="320" y="351" fill="#d8d8d8" font-size="13">⏫ ship the new</text>
  <text x="320" y="370" fill="#d8d8d8" font-size="13">navigation</text>
  <text x="465" y="351" fill="#8a8a8a" font-size="11">✎</text>
  <rect x="292" y="380" width="66" height="20" rx="5" fill="#2e2e2e"/>
  <text x="300" y="394" fill="#9a9a9a" font-size="11">Alex Rivera</text>
  <rect x="364" y="380" width="52" height="20" rx="5" fill="#2e2e2e"/>
  <text x="372" y="394" fill="#9a9a9a" font-size="11">due 9 Jan</text>
  <rect x="280" y="420" width="208" height="105" rx="6" fill="#242424" stroke="#313131"/>
  <rect x="292" y="434" width="17" height="17" rx="4" fill="#1d1d1d" stroke="#6a6a6a"/>
  <text x="320" y="447" fill="#d8d8d8" font-size="13">decide whether to retire</text>
  <text x="320" y="466" fill="#d8d8d8" font-size="13">legacy-export once the</text>
  <text x="320" y="485" fill="#d8d8d8" font-size="13">new site is live</text>
  <text x="465" y="447" fill="#8a8a8a" font-size="11">✎</text>
  <rect x="292" y="495" width="80" height="20" rx="5" fill="#2e2e2e"/>
  <text x="300" y="509" fill="#9a9a9a" font-size="11">created 12 Jan</text>
  <rect x="280" y="535" width="208" height="105" rx="6" fill="#242424" stroke="#313131"/>
  <rect x="292" y="549" width="17" height="17" rx="4" fill="#1d1d1d" stroke="#6a6a6a"/>
  <text x="320" y="562" fill="#d8d8d8" font-size="13">add a contact link to the</text>
  <text x="320" y="581" fill="#d8d8d8" font-size="13">header, per the findings</text>
  <text x="320" y="600" fill="#d8d8d8" font-size="13">above</text>
  <text x="465" y="562" fill="#8a8a8a" font-size="11">✎</text>
  <rect x="292" y="610" width="54" height="20" rx="5" fill="#2e2e2e"/>
  <text x="300" y="624" fill="#9a9a9a" font-size="11">due 2 Feb</text>
  <!-- ================================================================== -->
  <!-- COLUMN 3 — api-migration                                           -->
  <!-- ================================================================== -->
  <rect x="516" y="120" width="236" height="580" rx="8" fill="#1c1c1c" stroke="#2e2e2e"/>
  <text x="532" y="152" fill="#e4e4e4" font-size="15">api-migration</text>
  <rect x="638" y="139" width="30" height="19" rx="9.5" fill="#2f2f2f"/>
  <text x="648" y="153" fill="#a2a2a2" font-size="12">2</text>
  <rect x="676" y="139" width="19" height="19" rx="4" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="681" y="153" fill="#9a9a9a" font-size="12" font-weight="600">+</text>
  <rect x="699" y="139" width="19" height="19" rx="4" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="705" y="153" fill="#9a9a9a" font-size="9">◀</text>
  <rect x="722" y="139" width="19" height="19" rx="4" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="728" y="153" fill="#9a9a9a" font-size="9">▶</text>
  <line x1="532" y1="170" x2="736" y2="170" stroke="#2e2e2e"/>
  <text x="532" y="192" fill="#757575" font-size="11.5" letter-spacing="0.07em">OPEN (2)</text>
  <rect x="530" y="202" width="208" height="105" rx="6" fill="#242424" stroke="#313131"/>
  <rect x="542" y="216" width="17" height="17" rx="4" fill="#1d1d1d" stroke="#6a6a6a"/>
  <text x="570" y="229" fill="#d8d8d8" font-size="13">🔺 inventory every caller</text>
  <text x="570" y="248" fill="#d8d8d8" font-size="13">before touching the</text>
  <text x="570" y="267" fill="#d8d8d8" font-size="13">gateway</text>
  <text x="715" y="229" fill="#8a8a8a" font-size="11">✎</text>
  <rect x="542" y="277" width="70" height="20" rx="5" fill="#2e2e2e"/>
  <text x="550" y="291" fill="#9a9a9a" font-size="11">Sam Okafor</text>
  <rect x="618" y="277" width="58" height="20" rx="5" fill="#2e2e2e"/>
  <text x="626" y="291" fill="#9a9a9a" font-size="11">due 24 Jan</text>
  <rect x="530" y="317" width="208" height="86" rx="6" fill="#242424" stroke="#313131"/>
  <rect x="542" y="331" width="17" height="17" rx="4" fill="#1d1d1d" stroke="#6a6a6a"/>
  <text x="570" y="344" fill="#d8d8d8" font-size="13">decide whether to retire</text>
  <text x="570" y="363" fill="#d8d8d8" font-size="13">legacy-export or fold in</text>
  <text x="715" y="344" fill="#8a8a8a" font-size="11">✎</text>
  <rect x="542" y="373" width="80" height="20" rx="5" fill="#2e2e2e"/>
  <text x="550" y="387" fill="#9a9a9a" font-size="11">created 11 Jan</text>
  <!-- ================================================================== -->
  <!-- COLUMN 4 — docs-refresh, clipped by the right edge                 -->
  <!-- ================================================================== -->
  <rect x="766" y="120" width="236" height="580" rx="8" fill="#1c1c1c" stroke="#2e2e2e"/>
  <text x="782" y="152" fill="#e4e4e4" font-size="15">docs-refresh</text>
  <rect x="898" y="139" width="30" height="19" rx="9.5" fill="#2f2f2f"/>
  <text x="908" y="153" fill="#a2a2a2" font-size="12">2</text>
  <rect x="936" y="139" width="19" height="19" rx="4" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="941" y="153" fill="#9a9a9a" font-size="12" font-weight="600">+</text>
  <rect x="959" y="139" width="19" height="19" rx="4" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="965" y="153" fill="#9a9a9a" font-size="9">◀</text>
  <line x1="782" y1="170" x2="986" y2="170" stroke="#2e2e2e"/>
  <text x="782" y="192" fill="#757575" font-size="11.5" letter-spacing="0.07em">OPEN (2)</text>
  <rect x="780" y="202" width="208" height="86" rx="6" fill="#242424" stroke="#313131"/>
  <rect x="792" y="216" width="17" height="17" rx="4" fill="#1d1d1d" stroke="#6a6a6a"/>
  <text x="820" y="229" fill="#d8d8d8" font-size="13">draw the diagram for</text>
  <text x="820" y="248" fill="#d8d8d8" font-size="13">the install flow</text>
  <rect x="792" y="258" width="66" height="20" rx="5" fill="#2e2e2e"/>
  <text x="800" y="272" fill="#9a9a9a" font-size="11">Alex Rivera</text>
  <rect x="780" y="298" width="208" height="86" rx="6" fill="#242424" stroke="#313131"/>
  <rect x="792" y="312" width="17" height="17" rx="4" fill="#1d1d1d" stroke="#6a6a6a"/>
  <text x="820" y="325" fill="#d8d8d8" font-size="13">🔼 cut the guide down</text>
  <text x="820" y="344" fill="#d8d8d8" font-size="13">to one page</text>
  <rect x="792" y="354" width="58" height="20" rx="5" fill="#2e2e2e"/>
  <text x="800" y="368" fill="#9a9a9a" font-size="11">due 31 Jan</text>
</svg>
</div>

The board above is rendered from `templates/board/demo/`, the invented wiki the tests run
against, so every project and person in it is fictional.

## What it gives you

- One column per project whose lifecycle status the wiki lists as column-eligible. A
  dormant or completed project keeps its tasks off the board without them being deleted
- A triage column for tasks that name no project, which is the signal that they need a
  home
- Three lanes per column: in progress, open, and recently done
- Eight column-order modes with a direction toggle, plus a manual order set by arrows in
  the column headers
- A filter box that narrows every column as you type
- Click a checkbox to complete a task, right-click it for the full status set, and use
  the `+` in a column header to add one through the Tasks plugin's own modal
- 20 display settings stored as `board_*` keys in the board note's frontmatter, so two
  boards in one vault are configured independently
- Switch pills in the column headers for any per-project boolean you declare, so a flag
  something else reads is visible and flippable where the projects are

## Why a view, not a plugin

A custom Obsidian plugin lives in `.obsidian/`, which most sync setups deliberately
leave out. That means installing and reinstalling it on every device on every change. A
DataviewJS view stored in the vault syncs with the notes.

The same reasoning rules out a CSS snippet in `.obsidian/snippets/`: the stylesheet has
to live in the synced tree. It sits next to `view.js` and is loaded by the script
itself, not by `dv.view`, which resolves a sibling stylesheet by wikilink and injects it
with a `scope` attribute no browser implements.

The cost is enabling Dataview's JavaScript Queries once per device.

## Prerequisites

- **Dataview** with **Enable JavaScript Queries** switched on. That setting is per
  device, so it has to be switched on again in Obsidian on a phone or tablet. Without
  it the board note shows a raw code block, and the note carries a callout saying so
- **Tasks** for the add and edit buttons. The board parses and writes Tasks syntax
  itself, so everything else works without it
- A `purpose: projects` folder in the wiki. Without one the board would have no columns,
  and `/setup-wiki` will not offer it

## Configuration, in three places

<div class="diagram-frame">
<svg viewBox="0 0 1000 660" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, 'Segoe UI', Roboto, sans-serif">
  <rect width="100%" height="100%" fill="#191919"/>
  <defs>
    <!-- Checked box: Obsidian's accent colour, whatever the theme sets it to. -->
    <g id="bs-on">
      <rect width="17" height="17" rx="4" fill="#8b6cef"/>
      <path d="M 4 8.8 L 7 11.8 L 13 5" stroke="#ffffff" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g id="bs-off">
      <rect width="17" height="17" rx="4" fill="#1d1d1d" stroke="#5c5c5c"/>
    </g>
  </defs>
  <!-- ===================== Panel ===================== -->
  <rect x="16" y="16" width="968" height="564" rx="8" fill="#232323" stroke="#2e2e2e"/>
  <path d="M 16 24 a 8 8 0 0 1 8 -8 h 952 a 8 8 0 0 1 8 8 v 36 h -968 z" fill="#2b2b2b"/>
  <text x="34" y="44" fill="#d8d8d8" font-size="16">▼ Board settings</text>
  <!-- ===================== Group labels ===================== -->
  <text x="32"  y="92" fill="#8a8a8a" font-size="11" letter-spacing="0.09em">COLUMNS</text>
  <text x="266" y="92" fill="#8a8a8a" font-size="11" letter-spacing="0.09em">CHIPS</text>
  <text x="466" y="92" fill="#8a8a8a" font-size="11" letter-spacing="0.09em">LANES</text>
  <text x="722" y="92" fill="#8a8a8a" font-size="11" letter-spacing="0.09em">DENSITY</text>
  <!-- ===================== COLUMNS ===================== -->
  <use href="#bs-off" x="32" y="110"/>
  <text x="60" y="123" fill="#d8d8d8" font-size="13.5">Unassigned column</text>
  <use href="#bs-off" x="32" y="140"/>
  <text x="60" y="153" fill="#d8d8d8" font-size="13.5">Pin Unassigned (desktop only)</text>
  <use href="#bs-off" x="32" y="170"/>
  <text x="60" y="183" fill="#d8d8d8" font-size="13.5">Projects with no open tasks</text>
  <text x="32" y="217" fill="#d8d8d8" font-size="13.5">Column width (px)</text>
  <rect x="150" y="201" width="66" height="26" rx="5" fill="#1a1a1a" stroke="#3a3a3a"/>
  <text x="160" y="219" fill="#d8d8d8" font-size="12.5" font-family="ui-monospace, monospace">280</text>
  <!-- ===================== CHIPS ===================== -->
  <use href="#bs-on"  x="266" y="110"/>
  <text x="294" y="123" fill="#d8d8d8" font-size="13.5">Assignees</text>
  <use href="#bs-on"  x="266" y="140"/>
  <text x="294" y="153" fill="#d8d8d8" font-size="13.5">Due date</text>
  <use href="#bs-on"  x="266" y="170"/>
  <text x="294" y="183" fill="#d8d8d8" font-size="13.5">Created date</text>
  <use href="#bs-on"  x="266" y="200"/>
  <text x="294" y="213" fill="#d8d8d8" font-size="13.5">Priority</text>
  <use href="#bs-on"  x="266" y="230"/>
  <text x="294" y="243" fill="#d8d8d8" font-size="13.5">Done date</text>
  <use href="#bs-off" x="266" y="260"/>
  <text x="294" y="273" fill="#d8d8d8" font-size="13.5">Source note</text>
  <!-- ===================== LANES ===================== -->
  <use href="#bs-on"  x="466" y="110"/>
  <text x="494" y="123" fill="#d8d8d8" font-size="13.5">In progress lane</text>
  <use href="#bs-off" x="466" y="140"/>
  <text x="494" y="153" fill="#d8d8d8" font-size="13.5">Done lane</text>
  <text x="466" y="187" fill="#d8d8d8" font-size="13.5">Done lane window (days)</text>
  <rect x="626" y="171" width="66" height="26" rx="5" fill="#1a1a1a" stroke="#3a3a3a"/>
  <text x="636" y="189" fill="#d8d8d8" font-size="12.5" font-family="ui-monospace, monospace">7</text>
  <!-- ===================== DENSITY ===================== -->
  <use href="#bs-off" x="722" y="110"/>
  <text x="750" y="123" fill="#d8d8d8" font-size="13.5">Compact cards (hide meta line)</text>
  <!-- ===================== SCOPE ===================== -->
  <text x="32" y="326" fill="#8a8a8a" font-size="11" letter-spacing="0.09em">SCOPE</text>
  <text x="32" y="356" fill="#d8d8d8" font-size="13.5">Folders to scan</text>
  <rect x="32" y="366" width="212" height="72" rx="5" fill="#1a1a1a" stroke="#3a3a3a"/>
  <text x="44" y="386" fill="#c6c6c6" font-size="11.5" font-family="ui-monospace, monospace">demo</text>
  <path d="M 236 432 L 241 432 L 241 427 Z" fill="#4a4a4a"/>
  <text x="32" y="470" fill="#d8d8d8" font-size="13.5">Folders to skip</text>
  <rect x="32" y="480" width="212" height="72" rx="5" fill="#1a1a1a" stroke="#3a3a3a"/>
  <text x="44" y="500" fill="#c6c6c6" font-size="11.5" font-family="ui-monospace, monospace">demo/Archive</text>
  <path d="M 236 546 L 241 546 L 241 541 Z" fill="#4a4a4a"/>
  <!-- ===================== FLAGS ===================== -->
  <text x="466" y="326" fill="#8a8a8a" font-size="11" letter-spacing="0.09em">FLAGS</text>
  <rect x="466" y="340" width="300" height="196" rx="6" fill="#1d1d1d" stroke="#2e2e2e"/>
  <rect x="478" y="352" width="16" height="16" rx="4" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="482" y="364" fill="#8b6cef" font-size="9" font-weight="700">P</text>
  <text x="502" y="364" fill="#d8d8d8" font-size="13" font-weight="600">Publish</text>
  <rect x="676" y="350" width="66" height="21" rx="4" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="688" y="365" fill="#a0a0a0" font-size="11">Remove</text>
  <text x="478" y="390" fill="#6b6b6b" font-size="10.5">Field</text>
  <rect x="478" y="394" width="276" height="21" rx="4" fill="#1a1a1a" stroke="#3a3a3a"/>
  <text x="486" y="409" fill="#c6c6c6" font-size="11.5" font-family="ui-monospace, monospace">publish</text>
  <text x="478" y="431" fill="#6b6b6b" font-size="10.5">Label</text>
  <rect x="478" y="435" width="276" height="21" rx="4" fill="#1a1a1a" stroke="#3a3a3a"/>
  <text x="486" y="450" fill="#c6c6c6" font-size="11.5">Publish</text>
  <text x="478" y="472" fill="#6b6b6b" font-size="10.5">Glyph</text>
  <rect x="478" y="476" width="276" height="21" rx="4" fill="#1a1a1a" stroke="#3a3a3a"/>
  <text x="486" y="491" fill="#c6c6c6" font-size="11.5">P</text>
  <text x="478" y="513" fill="#6b6b6b" font-size="10.5">When on</text>
  <rect x="478" y="517" width="276" height="21" rx="4" fill="#1a1a1a" stroke="#3a3a3a"/>
  <text x="486" y="532" fill="#c6c6c6" font-size="11.5">Included the next time the site is built.</text>
  <rect x="466" y="546" width="80" height="26" rx="5" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="478" y="564" fill="#c0c0c0" font-size="12.5">Add flag</text>
  <rect x="266" y="496" width="132" height="34" rx="6" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="284" y="518" fill="#c0c0c0" font-size="13">Reset to defaults</text>
  <!-- ===================== Toolbar, below the panel ===================== -->
  <rect x="16" y="606" width="250" height="32" rx="6" fill="#1d1d1d" stroke="#343434"/>
  <text x="28" y="627" fill="#6b6b6b" font-size="13">Filter tasks…</text>
  <text x="282" y="627" fill="#8a8a8a" font-size="11" letter-spacing="0.08em">SORT</text>
  <rect x="322" y="606" width="96" height="32" rx="6" fill="#1d1d1d" stroke="#3a3a3a"/>
  <text x="334" y="627" fill="#d8d8d8" font-size="13">Manual</text>
  <rect x="428" y="611" width="21" height="22" rx="4" fill="#1d1d1d" stroke="#343434"/>
  <text x="434" y="627" fill="#8f8f8f" font-size="11">↑</text>
  <text x="462" y="627" fill="#6b6b6b" font-size="12.5">Reorder with the arrows in each column header</text>
</svg>
</div>


Structure lives in the `WIKIS` table in `view.js`: folder layout, project depth, people
folder, which statuses earn a column, where the add button writes, and what is in scope.
These describe a wiki's shape, so they are shared by every board on that wiki.

Appearance lives in the board note's own frontmatter as `board_*` keys, and the settings
panel on the board writes them for you.

Flags are the third, declared on the board note as `board_flags` and edited from the
same panel. They are neither structure nor appearance: a flag says what boolean a
project can carry, so it gets its own section below.

The setting to get right before any other is `exclude_folders`. Any folder holding
checkbox lines that are not project tasks belongs in it: meeting transcripts, imported
checklists, reading lists. A folder of transcripts can hold an order of magnitude more
checkbox lines than a wiki has real tasks. Including it does not break the board, it
buries every real task under the triage column, and nothing on screen says that is what
happened.

## Per-project flags

A flag is a boolean you keep in a project's frontmatter and something else reads: an
opt-in to an export, a publish gate, a review marker, a field a script outside the vault
greps for. Declare it on the board note and every project column grows a switch pill for
it.

```yaml
board_flags:
  - field: publish
    label: Publish
    glyph: P
    on_hint: Included the next time the site is built.
    off_hint: Kept out of the site build.
```

`field`, `label` and `glyph` are required, the two hints optional. The glyph is what the
pill shows, so one or two characters. Clicking a pill writes `field: true` or
`field: false` to that project's landing page and nothing else, never `last_activity`:
flipping a flag is not work on the project, and stamping the date would make a dormant
project look active in the board's own activity sort.

The settings panel's Flags group is the editor. Each declared flag gets a block with a
field per key, a Remove button, and there is an Add flag button under the list. The
frontmatter is the store either way, so editing it by hand works exactly as well.

Two things worth knowing:

- **The board does not know what reads the field.** It writes a boolean where you told
  it to, and that is the whole contract. Whatever consumes the flag, an ingest procedure,
  a build script, a query in another note, is on its own side of that line
- **Absent means off.** A project with no such key in its frontmatter shows the pill
  struck through, and so does an unparseable value. A consumer that treats a missing
  field as "no" therefore agrees with what the board shows

A flag whose declaration is wrong, no `field`, a glyph too long, two flags sharing a
field, or one trying to write `status` or `last_activity`, is dropped with a banner over
the board and a line in the panel saying which. It is never dropped silently: a pill that
never appears looks exactly like a board with no flags declared.

Two or three pills is as many as a column header carries comfortably. Beyond that the
header wraps and the project name stops being the first thing you read.

## Task syntax

The board routes on the leading run of wikilinks:

```
- [ ] [[Person]] [[project-slug]] description ➕ 2026-01-05 📅 2026-01-09 🔼
```

- Statuses: `[ ]` open, `[/]` in progress, `[x]` done, `[-]` cancelled
- Dates: `➕` created, `📅` due, `✅` done, `❌` cancelled
- Priorities, highest to lowest: `🔺 ⏫ 🔼 🔽 ⏬`

Links after the leading run are mentions, not assignments. A task reading
`[[project-a]] decide whether to retire [[project-b]]` belongs to project-a only, so it
does not show up as outstanding work on the project it proposes retiring. A task naming
two projects in its leading run does appear in both columns; that is deliberate.

## Writes

Three code paths modify a task: ticking a checkbox, setting a status from the card menu,
and adding a task. All three write one line to the task's own source note, and all three
fail closed. If the line the board parsed is no longer there, nothing is written and the
board says it is stale rather than guessing which line was meant.

Three more write frontmatter rather than a task line: the column menu's status change,
which writes `status` and `last_activity` to a project's landing page; a flag pill, which
writes one boolean to a project's landing page and nothing else; and the settings panel,
which writes `board_*` keys to the board note. Each is a single named key, so a failed
write leaves the note as it was.

Only the four statuses above are offered, because the parser reads exactly those
characters. Writing a fifth would produce a line the board cannot read back, and the
task would vanish from it.

A recurring task is refused rather than completed, since a line rewrite would not create
the next occurrence. The edit pencil hands it to the Tasks plugin instead.

## Trying it without touching your notes

`templates/board/demo/` is a small invented wiki that the board's own tests run against.
Copy it into a scratch vault alongside `view.js` and `view.css`, then open
`demo/Board.md`.

## Further reading

`templates/board/README.md` is the install and usage guide.
`templates/board/DESIGN.md` records why each decision went the way it did, and the traps
found while building it.
