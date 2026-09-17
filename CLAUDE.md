# Project: vernaillen.dev (Astro)

Personal developer website for Wouter Vernaillen, built with Astro 7 (static output), Tailwind CSS v4 and astro-icon. No client framework: interactivity is plain TypeScript in `src/scripts/`.

## After Making Changes

Always run lint and typecheck after changes and make sure there are no errors:

```bash
pnpm lint:fix
pnpm typecheck
```

`pnpm check` (lint, typecheck, build) is what CI runs.

## Key Directories

- `src/pages/` — routes, including the generated endpoints (`og/`, `raw/blog/`, `llms*.txt`, `search-index.json`, sitemap via `@astrojs/sitemap`)
- `src/components/`, `src/layouts/Base.astro` — templates; `Base` carries head, JSON-LD, header, footer and the ⌘K search dialog
- `src/lib/` — build-time helpers: `site.ts` (site constants, `availability` pill label), `markdown.ts` (remark plugins), `images.ts` (`/images/...` → `src/assets/images` resolver), `github.ts` (open-source page data), `shiki-code-frame.ts`
- `src/scripts/` — browser modules, one concern each (theme, menu, search, lightbox, reveal, hero spotlight, FFT demo)
- `src/styles/global.css` — Tailwind `@theme` tokens, component classes, view transitions, keyframes
- `content/` — blog posts, projects and page data (content collections, schemas in `src/content.config.ts`)
- `src/assets/images/` — every raster, processed by `astro:assets`; `public/images/` only holds video
- `src/data/github-contributions.json` — snapshot used when there is no `GITHUB_TOKEN` at build time

## Deployment

- **Docker image on Coolify.** `.github/workflows/ci.yml` only sets this repo's parameters; the pipeline itself is `vernaillen/workflows/.github/workflows/coolify-deploy.yml`: check → Docker build → smoke test on port 8080 → on `main`, push to `registry.apps.vernaillen.dev` and redeploy. What `check` does lives in `package.json`, not in the workflow.
- **`Dockerfile`** builds with Node 26 + pnpm 12 and serves `dist/` with nginx as a non-root user on 8080. `GITHUB_TOKEN` is a BuildKit secret (`BUILD_SECRETS` repo secret), `PUBLIC_RADIO_URL` a build arg from the `RADIO_ORIGIN_URL` repo variable.
- **Caching headers, redirects and the 404 page come from `nginx.conf`**, not from Astro. `/_astro/` and `/images/` are immutable, `/og/` caches a day, everything else revalidates. Canonical URLs have no trailing slash (`trailingSlash: 'never'` + nginx 301 for `/x/`); `vernaillen.com` and `/links` redirect to the apex.
- **DNS lives on Bunny DNS, managed with DNSControl** in `~/git/dnscontrol`.
- The FFT radio demo needs a live server, so it stays on Coolify at `radio.vernaillen.dev`; the static build points at it via `PUBLIC_RADIO_URL`.
- Self-hosted analytics script loaded from `c.analytics.apps.vernaillen.dev` (inline in `src/layouts/Base.astro`).
- `buildDate` in `src/lib/site.ts` is the "last deployed" timestamp shown in the footer: the Docker build stage has no `.git` to read a commit date from.

## Known Quirks

- **Stale markdown renders:** Astro caches content renders. Wipe `node_modules/.astro` (build) or `.astro` (dev, or `pnpm dev --force`) before judging a change to `src/lib/markdown.ts` or the shiki transformer.
- **Images in content are `/images/...` paths**, matching the old Nuxt site, but the files live in `src/assets/images/`. `remarkLocalImages` rewrites them to relative imports so `astro:assets` picks them up; templates use `localImage()` from `src/lib/images.ts`. A path with no file under `src/assets/images/` is left as-is and served from `public/` (that is how video works), so a typo is a silent 404, not a build error.
- **Body images get a 2x srcset** (`bodyImageProperties` in `markdown.ts`) for retina and the lightbox; the max rendered width is capped there.
- **Nuxt MDC leftovers in the markdown:** `{.class width= height=}` attribute blocks and the `::fft-visualizer-demo` block are handled by the remark plugins in `src/lib/markdown.ts`; other MDC syntax is not supported.
- **The `astro:assets` build emits an unreferenced raw copy of every glob-loaded raster;** the `pruneUnreferencedImageOriginals` hook in `astro.config.ts` deletes them from `dist/` after the build.
- **OG images** are rendered with satori from plain `{ type, props }` objects (no JSX runtime); fonts are the `@fontsource/geist` woff files.
- **View transitions** are CSS-only cross-document crossfades typed `page`; the theme toggle's circular wipe and the lightbox morph are same-document `startViewTransition` calls and must keep `::view-transition-*(root)` static.
- **Search** is a build-time JSON index (`src/pages/search-index.json.ts`) queried client-side; no external service.
- `sharp`, `esbuild` and `@resvg/resvg-js` are allow-listed in `pnpm-workspace.yaml` (`allowBuilds`) so their postinstall scripts run.

## Do NOT (Project-Specific)
- Do NOT put rasters in `public/images/`; only video belongs there. Rasters go in `src/assets/images/`.
- Do NOT add a `tailwind.config`; tokens live in the `@theme` block of `src/styles/global.css`.
- Do NOT add a client framework or a search/analytics SaaS; the site is deliberately dependency-light.
- Do NOT rely on Astro `redirects` or route rules for headers; nginx.conf is the source of truth in production.
- Do NOT run `pnpm dev`; ask the user to start it.

## Blog Post Conventions
- Numbered files: lower number = newer (`992` is newer than `999`); the number is stripped from the URL (`992.fft-visualizer.md` → `/blog/fft-visualizer`)
- Frontmatter: `title`, `description`, `minRead`, `date` (`YYYY-MM-DD`), `image` (`src` + optional `height`/`alt`), `author`, optional `social` links
- Author: Wouter Vernaillen / Full Stack Developer / `/images/woutervernaillen.jpg`
- Images: `src/assets/images/blog/{number}.{slug}/`, referenced as `/images/blog/{number}.{slug}/file.png`
- Drafts: prefix the filename with a dot (`.draft-title.md`); the collection only loads files starting with a digit
- Each post is also served as raw markdown at `/raw/blog/{slug}.md` and included in `/llms-full.txt`
