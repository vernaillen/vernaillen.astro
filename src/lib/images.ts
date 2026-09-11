import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const localImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{png,jpg,jpeg,webp,avif,gif,svg}',
  { eager: true },
)

export function resolveLocalImage(rootPath: string) {
  if (!rootPath.startsWith('/images/')) return undefined
  const key = `/src/assets/images/${rootPath.slice('/images/'.length)}`
  return localImages[key]
}

// Resolves a content-authored `/images/...` path to the ImageMetadata Astro's
// own <Image> component expects, for use outside the markdown pipeline (page
// and component templates driven by YAML/frontmatter data).
export async function localImage(rootPath: string) {
  return resolveLocalImage(rootPath)?.default
}

/**
 * Markdown-embedded images (remark plugins, run during the content layer's
 * sync step) can't go through `astro:assets`' `getImage()`: that virtual
 * module is only resolvable while a Vite environment is active, and sync
 * tears its temporary one down as soon as it believes every entry is done —
 * a `getImage()` call still in flight for a straggling file throws "Vite
 * module runner has been closed". Astro's own built-in markdown image
 * handling avoids this by never calling `getImage()` from the remark/rehype
 * pipeline either; it defers real optimization to a later render phase this
 * project's static `<img>` output doesn't have.
 *
 * Resolving through `src/assets/images` (via the glob above) doesn't work
 * either: that same ephemeral sync environment isn't wired up to Astro's
 * asset-metadata plugin, so the glob yields a bare source-relative module
 * specifier there instead of a real build-emitted asset URL — a path that
 * doesn't exist anywhere under `dist/`. So the handful of images referenced
 * directly in markdown bodies (as opposed to frontmatter, which `localImage()`
 * above resolves at page-render time in the main build environment, unaffected
 * by any of this) are kept as plain files under `public/images/...` and passed
 * through untouched here — no avif/webp conversion for these few images, but a
 * real, environment-independent URL that's guaranteed to exist in `dist/`.
 */
export async function optimizeLocalImage(rootPath: string) {
  const publicPath = fileURLToPath(new URL(`../../public${rootPath}`, import.meta.url))
  if (!existsSync(publicPath)) return undefined
  return { src: rootPath }
}
