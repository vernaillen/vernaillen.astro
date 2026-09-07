# Nuxt-to-Astro migration decisions

The published pages, eleven published articles, five projects, public URLs, and interactive FFT demo were ported from `../vernaillen.new`.

## Intentional changes

- **Rendering:** Astro pre-renders the site. Small framework-free scripts handle theme switching, navigation, search, reveals, media playback, and copy controls.
- **Search:** a compact build-time JSON index replaces the Nuxt Content/Fuse command palette. It covers public pages and articles and loads only when search opens.
- **Editing:** Nuxt Studio and `/admin` are not carried over. Content is edited as reviewed Markdown and YAML in Git, keeping production fully static.
- **Drafts:** dot-prefixed Markdown files remain in the Nuxt repository and are deliberately excluded because they are unpublished working drafts.
- **About gallery:** the decorative project-logo polaroids are omitted; the portrait and projects remain in stronger contexts.
- **Homepage:** selected enterprise work and the existing FAQ are surfaced, while the career preview is shortened to three entries. The full history remains at `/career`.
- **Hosting:** the primary Docker deployment is built in GitHub Actions, deployed through Coolify, and may be served through Bunny CDN. Apache rules remain for the legacy Combell static-host path.
