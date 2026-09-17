import { readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'
import { unified } from '@astrojs/markdown-remark'
import { remarkImageAttrs, remarkLocalImages, remarkFftDemoBlock } from './src/lib/markdown'
import { shikiCodeFrame } from './src/lib/shiki-code-frame'

// astro:assets emits both the derived (avif/webp) output AND a raw hashed
// copy of the source raster it read `ImageMetadata` from, as a byproduct of
// resolving the dynamic `import.meta.glob` loader in src/lib/images.ts. The
// raw copy is never referenced by any built page — only the derived output
// is. Delete those originals so they don't ship to production.
function pruneUnreferencedImageOriginals() {
  return {
    name: 'prune-unreferenced-image-originals',
    hooks: {
      'astro:build:done': async ({ dir }: { dir: URL }) => {
        const distDir = dir.pathname
        const files: string[] = []
        const walk = (path: string) => {
          for (const entry of readdirSync(path)) {
            const full = join(path, entry)
            if (statSync(full).isDirectory()) walk(full)
            else files.push(full)
          }
        }
        walk(distDir)

        const textFiles = files.filter((f) => /\.(html|css|js|xml|txt)$/.test(f))
        const haystack = textFiles.map((f) => readFileSync(f, 'utf-8')).join('\n')

        const assetDir = join(distDir, '_astro')
        let removed = 0
        for (const entry of readdirSync(assetDir)) {
          if (!/\.(png|jpe?g|webp|gif)$/.test(entry)) continue
          if (haystack.includes(entry)) continue
          unlinkSync(join(assetDir, entry))
          removed++
        }
        if (removed) console.log(`[prune-unreferenced-image-originals] removed ${removed} unreferenced file(s)`)
      },
    },
  }
}

// Blog post publish dates keyed by slug, read straight from the markdown
// frontmatter (content collections aren't available at config time).
function blogPostDates() {
  const dir = fileURLToPath(new URL('content/blog', import.meta.url))
  const dates = new Map<string, Date>()
  for (const file of readdirSync(dir)) {
    const slug = /^\d+\.(.+)\.md$/.exec(file)?.[1]
    const date = /^date:\s*["']?(\d{4}-\d{2}-\d{2})/m.exec(readFileSync(join(dir, file), 'utf-8'))?.[1]
    if (slug && date) dates.set(slug, new Date(date))
  }
  return dates
}

const SITE = 'https://vernaillen.dev'
const postDates = blogPostDates()

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  compressHTML: true,
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    icon(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize: (item) => {
        const slug = new URL(item.url).pathname.match(/^\/blog\/([^/]+)$/)?.[1]
        const date = slug && postDates.get(slug)
        return date ? { ...item, lastmod: date.toISOString() } : item
      },
    }),
    pruneUnreferencedImageOriginals(),
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'material-theme-lighter',
        dark: 'material-theme-palenight',
      },
      defaultColor: false,
      wrap: false,
      transformers: [shikiCodeFrame()],
    },
    processor: unified({
      remarkPlugins: [remarkImageAttrs, remarkFftDemoBlock, remarkLocalImages],
    }),
  },
})
