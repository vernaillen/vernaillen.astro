import { visit } from 'unist-util-visit'
import type { Image, Paragraph, Root, RootContent } from 'mdast'
import type {} from 'mdast-util-to-hast'
import type { Properties } from 'hast'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fftControlsHtml } from './fft-demo'

interface CurlyAttrs {
  class?: string
  width?: string
  height?: string
}

/**
 * `remark-smartypants` runs before this plugin and turns straight `"..."`
 * quotes into typographic “...” ones — including inside this trailing curly-
 * attr text, which is still plain prose to it at that point. The quoted-value
 * branch below has to accept either quote style to still match.
 */
function parseCurlyAttrs(input: string): CurlyAttrs {
  const attrs: CurlyAttrs = {}
  const re = /\.([\w-]+)|([\w-]+)=["“]([^"”]*)["”]|([\w-]+)=(\S+)/g
  let m: RegExpExecArray | null
   
  while ((m = re.exec(input))) {
    if (m[1]) {
      attrs.class = attrs.class ? `${attrs.class} ${m[1]}` : m[1]
    } else if (m[2] === 'width' || m[2] === 'height') {
      attrs[m[2]] = m[3]
    } else if (m[4] === 'width' || m[4] === 'height') {
      attrs[m[4]] = m[5]
    }
  }
  return attrs
}

/**
 * `![alt](src){.rounded-lg height="671" width="1192"}` — a trailing curly-brace
 * attribute block is not standard markdown; it parses as plain text right after
 * the image. Capture it into the image node's hProperties and drop the text.
 */
export function remarkImageAttrs() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: Paragraph) => {
      for (let i = 0; i < node.children.length - 1; i++) {
        const image = node.children[i]
        const text = node.children[i + 1]
        if (image.type !== 'image' || text.type !== 'text') continue
        const match = /^\{([^}]*)\}/.exec(text.value)
        if (!match) continue
        const attrs = parseCurlyAttrs(match[1])
        const data = (image.data ??= {})
        const hProperties: Properties = (data.hProperties ??= {})
        if (attrs.class) hProperties.class = attrs.class
        if (attrs.width) hProperties.width = attrs.width
        if (attrs.height) hProperties.height = attrs.height
        text.value = text.value.slice(match[0].length)
      }
      node.children = node.children.filter((c) => !(c.type === 'text' && c.value === ''))
    })
  }
}

const MAX_BODY_IMAGE_WIDTH = 900

/**
 * Content bodies reference the Nuxt site's public path (`/images/...`) while
 * the rasters live under `src/assets/images/**`. Rewriting the url to a path
 * relative to the markdown file is all Astro needs: its own `remarkCollectImages`
 * runs after these plugins, records the relative path as an asset import, and
 * `rehypeImages` turns the `<img>` into a placeholder that `render(entry)`
 * resolves through `getImage()` at page render time — in the main build
 * environment, not during content sync (where calling `getImage()` from a
 * remark plugin races the sync teardown: "Vite module runner has been closed").
 */
function assetRelativePath(rootPath: string, from: string | undefined) {
  if (!rootPath.startsWith('/images/') || !from) return undefined
  const asset = fileURLToPath(new URL(`../assets/images/${rootPath.slice('/images/'.length)}`, import.meta.url))
  if (!existsSync(asset)) return undefined
  return path.relative(path.dirname(from), asset)
}

function bodyImageProperties(existing?: Properties): Properties {
  const props: Properties = { ...existing, loading: 'lazy', decoding: 'async', format: 'avif' }
  // Authored `width`/`height` describe the Nuxt layout; keep the ratio implicit
  // (Astro derives height from the source) and cap at the prose column width.
  props.width = Math.min(Number(props.width) || MAX_BODY_IMAGE_WIDTH, MAX_BODY_IMAGE_WIDTH)
  delete props.height
  return props
}

export function remarkLocalImages() {
  return (tree: Root, file: { path?: string }) => {
    visit(tree, 'image', (node: Image) => {
      const url = assetRelativePath(node.url, file.path)
      if (!url) return
      node.url = url
      const data = (node.data ??= {})
      data.hProperties = bodyImageProperties(data.hProperties)
    })
  }
}

function textLine(node: RootContent | undefined): string | undefined {
  if (node?.type !== 'paragraph' && node?.type !== 'heading') return undefined
  const [child] = node.children
  return node.children.length === 1 && child?.type === 'text' ? child.value : undefined
}

/**
 * `::component-name` / `---` / `key: value` / `---` / `::` — a Nuxt MDC block.
 * The only one in the content set is `::fft-visualizer-demo` with a single
 * `poster:` prop. Renders a static poster shell with a click-to-load button;
 * `fft-demo.ts` boots the interactive WebGL visualizer on click.
 *
 * A `---` line with no blank line before it is CommonMark-ambiguous: it can
 * parse as a `thematicBreak`, or get absorbed as a Setext heading underline
 * for the text line above it. The source content has no blank line before
 * either `---`, so both the `::fft-visualizer-demo` and `poster:` lines come
 * through as `heading` nodes with the `thematicBreak`s consumed into them —
 * matching below tolerates either shape rather than requiring content edits.
 */
const FFT_OVERLAY_HTML = [
  '<div class="fft-demo-overlay">',
  '<button type="button" class="fft-demo-play" data-fft-play aria-label="Play the interactive demo">',
  '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  '</button>',
  '<p class="fft-demo-caption">Interactive demo — press play to listen</p>',
  '</div>',
].join('')

export function remarkFftDemoBlock() {
  return (tree: Root, file: { path?: string }) => {
    const matches: { start: number; end: number; poster: string }[] = []
    for (let i = 0; i < tree.children.length; i++) {
      const name = /^::fft-visualizer-demo\s*$/.exec(textLine(tree.children[i]) ?? '')
      if (!name) continue
      let j = i + 1
      if (tree.children[j]?.type === 'thematicBreak') j++
      const poster = /poster:\s*(\S+)/.exec(textLine(tree.children[j]) ?? '')?.[1]
      j++
      if (tree.children[j]?.type === 'thematicBreak') j++
      const isBlock = textLine(tree.children[j]) === '::' && poster
      if (isBlock && poster) matches.push({ start: i, end: j, poster })
    }

    for (const { start, end, poster } of matches.reverse()) {
      const posterImage: Image = {
        type: 'image',
        url: assetRelativePath(poster, file.path) ?? poster,
        alt: 'FFT Visualizer demo',
        data: { hProperties: bodyImageProperties({ class: 'fft-demo-poster' }) },
      }
      const node: Paragraph = {
        type: 'paragraph',
        children: [posterImage, { type: 'html', value: FFT_OVERLAY_HTML + fftControlsHtml() }],
        data: { hName: 'div', hProperties: { class: 'fft-demo-shell not-prose', 'data-fft-demo': '' } },
      }
      tree.children.splice(start, end - start + 1, node)
    }
  }
}
