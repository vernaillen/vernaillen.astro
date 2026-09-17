# vernaillen.dev

Personal website of [Wouter Vernaillen](https://vernaillen.dev), freelance full stack developer. A static [Astro](https://astro.build) site, styled with Tailwind CSS v4, served by nginx from a Docker image on Coolify.

## Stack

- **Astro 7**, static output, content collections for the blog, the projects and the page data in `content/`
- **Tailwind CSS v4** with the design tokens in `src/styles/global.css`; no `tailwind.config`
- **astro-icon** with the Lucide and Simple Icons sets
- **astro:assets** for every raster: content refers to `/images/...`, the files live under `src/assets/images/` and get resolved at build time (see `src/lib/images.ts` and the remark plugins in `src/lib/markdown.ts`)
- **satori + resvg** render an OG card per route at build time (`src/pages/og/`)
- **shiki** code blocks with a copy button (`src/lib/shiki-code-frame.ts`)
- No client framework: the interactive bits are small TypeScript modules in `src/scripts/` (theme, menu, ⌘K search, lightbox, reveal-on-scroll, FFT demo)

## Development

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # static site in dist/
pnpm preview      # serve dist/
pnpm lint:fix
pnpm typecheck    # astro check
pnpm check        # lint + typecheck + build, what CI runs
```

Node 22.12 or newer and pnpm 12 (see `packageManager` in `package.json`).

### Environment

Both variables are optional and only matter at build time.

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Read-only token for the live GitHub fetch behind `/open-source`. Without it the page renders the committed snapshot in `src/data/github-contributions.json` and shows its date. |
| `PUBLIC_RADIO_URL` | Origin of the radio stream proxy the FFT demo listens to. Defaults to `https://radio.vernaillen.dev/api/radio`. |

## Content

- **Blog posts** are `content/blog/{number}.{slug}.md`. A lower number is a newer post; the number is stripped from the URL, so `992.fft-visualizer.md` is `/blog/fft-visualizer`. Files that don't start with a digit (drafts, `.draft-title.md`) are not built.
- **Post images** go in `src/assets/images/blog/{number}.{slug}/` and are referenced as `/images/blog/{number}.{slug}/file.png`. A trailing `{.class width="..." height="..."}` block after an image is supported. Video stays in `public/images/` and is referenced as-is.
- **Projects** are `content/projects/{number}.{slug}.yml` with `website` (required) and `code` (optional) links; the number only orders the files.
- **Page copy** (home, about, career, projects, open source, blog index) lives in the YAML and markdown files directly under `content/`.
- Every post is also published as raw markdown at `/raw/blog/{slug}.md`, and the whole site as `/llms.txt` and `/llms-full.txt`.

## Deployment

`.github/workflows/ci.yml` calls the shared `vernaillen/workflows` pipeline on every push: `pnpm check`, Docker build, smoke test, then on `main` a push to the Coolify registry and a redeploy. The `Dockerfile` builds the site with Node and serves `dist/` with nginx on port 8080; `nginx.conf` holds the cache headers, the slash-less canonical URLs, the `vernaillen.com` redirect and the 404 page.

```bash
pnpm docker:preview   # build the image and serve it on http://localhost:8080
```

## Performance

`scripts/lighthouse.sh [origin] [output-dir]` runs a serial Lighthouse baseline (three mobile runs of the home page, a desktop run, and the projects, blog and open-source pages) and writes the reports to `.lighthouse/<date>/`.

## License

[MIT](./LICENSE)
