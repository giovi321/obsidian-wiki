---
title: Structured knowledge
description: How raw sources become short, cross-linked pages that read as standalone reference
---

Structured knowledge is the opposite of a chat log. Rather than saving every note as-is, the agent reads your raw sources and writes new pages that distill what is worth keeping.

## Distillation, not storage

A 5,000-word transcript becomes a 400-word page on the decision that was made, with a wikilink to the source. These pages read as standalone reference: you can edit them by hand without breaking anything, and cross-links between them let you navigate the graph.

The distilling step is the one that rarely gets done by hand. It is what turns a folder of things you once saved into a knowledge base you can query.

## Inputs and outputs stay separate

Raw sources sit in [entry-point folders](/obsidian-wiki/concepts/entry-points/). Distilled pages sit in knowledge folders. The two are never mixed:

- Deleting an input does not delete its output
- Deleting an output does not delete its input

## The knowledge folders

You choose which knowledge folders exist at setup and declare them in `wiki-config.md`. The standard suggestions are:

| Folder | Purpose |
|---|---|
| Projects | Active work, organized by intent category |
| Documentation | LLM-curated knowledge articles |
| Resources | Lists, references, recipes, places, contacts |
| People | Person pages |
| Concepts | Companies, markets, frameworks, technical concepts |

Enable the ones you want, override the paths, and add your own. Each subfolder of a knowledge folder gets a `<folder-name>.md` index page.

## Every page carries structure

A distilled page is more than prose. Its frontmatter records a summary, its sources, a confidence score, a lifecycle state, and the provenance mix of its claims. Its body carries inline provenance markers and wikilinks. That structure is what lets both you and the agent trust and navigate the page. See [provenance and confidence](/obsidian-wiki/concepts/provenance-and-confidence/) and the [page lifecycle](/obsidian-wiki/concepts/page-lifecycle/) for the two mechanisms that keep pages honest.

Pages are never stubs. Every wiki page (excluding source summaries, dashboards, and category indexes) must reach at least 250 words in the body. If the available material cannot fill that, the agent merges it into an existing page or defers creation until more material accumulates.

## Where to go next

- [Entry points](/obsidian-wiki/concepts/entry-points/): where raw sources land before distillation
- [Page lifecycle](/obsidian-wiki/concepts/page-lifecycle/): how your edits are protected once a page exists
- [Provenance and confidence](/obsidian-wiki/concepts/provenance-and-confidence/): how claims are marked and scored
