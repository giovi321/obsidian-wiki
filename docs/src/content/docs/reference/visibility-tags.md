---
title: Visibility tags
description: The optional public, internal, and PII tags that gate what a query can surface
---

Visibility tags are optional. Enable them by adding `visibility/public`, `visibility/internal`, `visibility/pii` to your `wiki-config.md` `tags:` list. With it on, any page can carry one of three tags.

| Tag | Meaning | Default behavior |
|---|---|---|
| `visibility/public` | Safe to share or publish externally | The agent never sets this automatically; setting it requires explicit confirmation |
| `visibility/internal` | Private to you, not for sharing | Treated as the default when no visibility tag is set |
| `visibility/pii` | Contains personally identifiable information (addresses, IBANs, government IDs, contacts) | The agent treats PII-tagged content as sensitive; `/lint` flags pages in folders you mark as PII-bearing that lack the tag |

## Filtering a query by visibility

Use the `--visibility <level>` flag on `/query` to restrict the candidate set.

```
/query p --visibility public "what did I publish about X?"
/query p --visibility pii "list my saved IBANs"
```

The agent applies the filter before generating the answer. Pages tagged outside the requested level are excluded from the candidate set. If the filter excludes everything, the agent says so and recommends a source that would close the gap.

## Enforcing PII tagging in lint

To have `/lint` enforce PII tagging, list the PII-bearing folders under `pii_paths:` in `wiki-config.md` frontmatter (for example `pii_paths: ["2_Resources/Admin/", "2_Resources/People/"]`). `/lint` then flags any page in those folders that lacks the `visibility/pii` tag, and any `visibility/public` page still in `draft`.

The visibility filter is read-time only. The agent does not yet block writes to PII-tagged pages without confirmation; that is documented as unimplemented enforcement. See [commands](/obsidian-wiki/using/commands/) for the full `/query` and `/lint` reference.
