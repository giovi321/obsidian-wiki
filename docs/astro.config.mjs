import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://giovi321.github.io',
  base: '/obsidian-wiki',
  integrations: [
    starlight({
      title: 'obsidian-wiki',
      description: 'A Claude Code plugin that turns Obsidian folders into an agent-maintained wiki',
      components: {
        Head: './src/components/Head.astro',
      },
      customCss: ['./src/styles/theme.css', './src/styles/diagrams.css'],
      head: [
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;600&display=swap',
          },
        },
      ],
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/giovi321/obsidian-wiki',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/giovi321/obsidian-wiki/edit/main/docs/',
      },
      sidebar: [
        { label: 'Home', link: '/' },
        {
          label: 'Getting started',
          items: [
            { label: 'Install in Claude Code', link: '/getting-started/claude-code/' },
            { label: 'Install in Cowork', link: '/getting-started/cowork/' },
            { label: 'Obsidian plugins', link: '/getting-started/obsidian-plugins/' },
            { label: 'First run', link: '/getting-started/first-run/' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'Why a wiki, not a RAG', link: '/concepts/why-a-wiki-not-a-rag/' },
            { label: 'The two config files', link: '/concepts/config-files/' },
            { label: 'Entry points', link: '/concepts/entry-points/' },
            { label: 'Structured knowledge', link: '/concepts/structured-knowledge/' },
            { label: 'Page lifecycle', link: '/concepts/page-lifecycle/' },
            { label: 'Provenance and confidence', link: '/concepts/provenance-and-confidence/' },
            { label: 'Feedback and custom procedures', link: '/concepts/feedback-and-procedures/' },
          ],
        },
        {
          label: 'Architecture',
          items: [
            { label: 'Overview', link: '/architecture/overview/' },
            { label: 'The ingest pipeline', link: '/architecture/ingest-pipeline/' },
            { label: 'Folder structure', link: '/architecture/folder-structure/' },
            { label: 'Typed relationships', link: '/architecture/relationships/' },
          ],
        },
        {
          label: 'Using it',
          items: [
            { label: 'The daily workflow', link: '/using/daily-workflow/' },
            { label: 'Commands', link: '/using/commands/' },
            { label: 'Two or more wikis', link: '/using/multiple-wikis/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Confidence scoring', link: '/reference/confidence-scoring/' },
            { label: 'Source quality buckets', link: '/reference/source-quality/' },
            { label: 'Provenance markers', link: '/reference/provenance-markers/' },
            { label: 'Page frontmatter', link: '/reference/page-frontmatter/' },
            { label: 'Schemas', link: '/reference/schemas/' },
            { label: 'Visibility tags', link: '/reference/visibility-tags/' },
            { label: 'Retrieval and modes', link: '/reference/retrieval-and-modes/' },
          ],
        },
        {
          label: 'Extending',
          items: [
            { label: 'Customization', link: '/extending/customization/' },
            { label: 'Custom procedures', link: '/extending/custom-procedures/' },
            { label: 'Custom commands', link: '/extending/custom-commands/' },
            { label: 'Plugin updates', link: '/extending/plugin-updates/' },
          ],
        },
        {
          label: 'Help',
          items: [
            { label: 'FAQ', link: '/help/faq/' },
          ],
        },
      ],
    }),
  ],
});
