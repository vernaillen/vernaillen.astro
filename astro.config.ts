import { readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
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

export default defineConfig({
  site: 'https://vernaillen.dev',
  trailingSlash: 'never',
  compressHTML: true,
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    icon(),
    sitemap({
      filter: (page) => !page.includes('/404'),
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
