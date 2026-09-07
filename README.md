# vernaillen.dev

The Astro source for [vernaillen.dev](https://vernaillen.dev), Wouter Vernaillen's portfolio and technical blog. It is a static rebuild of the previous Nuxt site with a custom editorial grid design.

## Requirements

- Node.js 26 (see `.node-version`)
- pnpm 12.3.4

## Development

```sh
pnpm install
pnpm dev
```

Run the complete local verification before opening a pull request:

```sh
pnpm check
pnpm test:e2e
```

`pnpm check` runs ESLint, Astro's type checker, and the production build. The browser tests start a preview server and check representative desktop and mobile layouts.

## Content and routes

- Page content lives in `content/` and is validated by `src/content.config.ts`.
- Blog filenames start with a numeric editorial prefix; public slugs omit it.
- Images imported from `src/assets/images/` are processed by Astro.
- Video files that must retain their original format live in `public/images/`.
- `/llms.txt`, `/llms-full.txt`, raw Markdown routes, the sitemap, and social cards are generated at build time.
- `/search-index.json` powers the dependency-free search dialog and is fetched only when search opens.

## Deployment

The GitHub Actions workflow checks every branch and builds the production Docker image. On `main`, it pushes the image to the private registry and asks Coolify to redeploy it. nginx serves `dist/`; Bunny CDN can cache the public deployment in front of it.

The build accepts `GITHUB_TOKEN` as a BuildKit secret to refresh open-source contribution data, with a checked-in snapshot as fallback. `PUBLIC_RADIO_URL` sets the FFT demo's audio proxy.

See [MIGRATION.md](./MIGRATION.md) for intentional differences from the Nuxt site.
