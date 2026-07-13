---
title: Why a wiki, not a RAG
description: Why a human-readable wiki is a better substrate for an LLM than a vector store
---

A wiki is the rare knowledge format that serves a language model and a human equally well. The same markdown file is the model's context and your reference page. You can structure any kind of knowledge for the model, notes, transcripts, papers, conversations, and still open, read, edit, and trust every word of it. A vector store gives up that second half.

This page explains why that matters and where the two approaches differ.

## The short version

- A wiki page is plain markdown: a named title, a summary, cross-links, typed relationships, and a marker on each claim saying where it came from and how confident it is. A model reads that structure natively and can navigate it by links. So can you
- A RAG store turns your documents into embedding vectors and opaque chunks. Retrieval returns fragments by similarity score. There is nothing to open, nothing to correct, and no way to see what the model will pull before it pulls it
- Both retrieve knowledge for a model. Only one leaves you with a knowledge base you can also read

## What RAG does well, and where it leaves you

Retrieval-augmented generation embeds your documents into vectors, splits them into chunks, and at query time pulls the chunks whose vectors sit nearest the question. It scales to large corpora and needs no upfront structuring, which is its real strength: point it at a pile of files and it works.

The cost is everything downstream of the embedding:

- The store is not human-readable. Your knowledge now lives as float arrays in an index. You cannot browse it, and a teammate cannot read it
- Retrieval is fuzzy and opaque. Chunks come back by cosine similarity, so you cannot predict or audit what the model will see, and a near-miss silently returns the wrong passage
- Chunking severs structure. A document cut into 800-token windows loses its headings, its order, and the links between ideas. The model gets fragments, not a map
- There is nothing to curate. You cannot fix a wrong fact in a chunk, mark a claim as inferred rather than stated, or record that two documents contradict each other. The store only reflects the source; it never improves on it
- Provenance and trust are flattened. A confident-sounding sentence and a well-sourced fact look identical once they are vectors

None of this makes RAG wrong. It makes it a search index, not a knowledge base.

## What a wiki gives the model instead

A wiki keeps the knowledge in the form both readers want: prose with structure.

- Named, addressable pages. Each concept is one page with a stable title and aliases. The model can ask for a page by name; you can open it in Obsidian
- Explicit links and typed relationships. Pages reference each other with wikilinks, and relationships can be typed (`depends-on`, `part-of`, `caused-by`, and so on). The model can walk the graph deterministically instead of guessing by similarity. See [Typed relationships](../../architecture/relationships/)
- Distillation, not chunking. A 5,000-word transcript becomes a 400-word page on the decision that was made, with a link back to the source. The model reads the conclusion, not 800-token slices of the raw text
- Provenance on every claim. Each claim is marked as extracted, inferred, or ambiguous, so the model and the reader can tell a paraphrase from a synthesis. See [Provenance and confidence](../provenance-and-confidence/)
- Confidence you can see. Each page carries a score computed from the count and quality of its sources, so weak pages are visible rather than buried
- Deterministic retrieval. Answering a question walks the index, greps for a claim, and follows links, cheapest primitive first. The path is inspectable, not a similarity ranking. See [Retrieval and modes](../../reference/retrieval-and-modes/)
- You can edit it. Correct a fact, merge two pages, mark a contradiction. Your edits are protected by the [page lifecycle](../page-lifecycle/): once you have touched a page, the agent merges into it rather than overwriting it

The point that matters most: you can take any messy input and give it a shape a model can navigate, without giving up a form a human can read and fix. One artifact, two audiences.

## You can structure any knowledge this way

The distillation step is what makes arbitrary input usable. A voice memo, a PDF, a saved article, and a chat export all land in the same place: named pages with summaries, links, and provenance. The model does not care that the input was a transcript; it reads the page. You do not care that the page came from a transcript; you read the page. The messy origin is captured as a source link and otherwise gets out of the way.

That is why a wiki works for knowledge a RAG pipeline struggles with: anything where the durable value is a distilled conclusion rather than the raw document, and where you will later want to check, correct, or trust what the model told you.

## Not either / or

This is a contrast of substrates, not a rejection of retrieval. obsidian-wiki even ships a small RAG-style answer path: [`/query`](../../using/commands/) can pull candidate pages and answer from them. The difference is what sits underneath. Here the substrate is a readable, editable, cross-linked wiki, so retrieval runs over structure you can see, and the store keeps its value even with the model switched off.

If your only goal is fuzzy search over a large document dump, use a RAG. If you want a knowledge base you and a model can both read, navigate, and trust over years, build a wiki.

## Where to go next

- [Structured knowledge](../structured-knowledge/): how raw sources become distilled pages
- [Provenance and confidence](../provenance-and-confidence/): how claims are marked and scored
- [Typed relationships](../../architecture/relationships/): the graph the agent walks
- [The ingest pipeline](../../architecture/ingest-pipeline/): how one source becomes pages
