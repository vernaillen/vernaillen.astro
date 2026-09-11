import { visit } from 'unist-util-visit'
import type { Image, Paragraph, Root, RootContent } from 'mdast'
import type {} from 'mdast-util-to-hast'
import type { Properties } from 'hast'
import { optimizeLocalImage } from './images'

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

/**
 * Content images reference the Nuxt site's public path (`/images/...`), but in
 * this rebuild the raster files live under `src/assets/images/**` for
 * optimization. Resolve those paths through astro:assets instead of leaving a
 * dead `<img src="/images/...">` in the output.
 */
export function remarkLocalImages() {
  return async (tree: Root) => {
    const images: Image[] = []
    visit(tree, 'image', (node: Image) => {
      if (node.url.startsWith('/images/')) images.push(node)
    })
    for (const node of images) {
      const hProperties: Properties = node.data?.hProperties ?? {}
      const image = await optimizeLocalImage(node.url)
      if (!image) continue
      const data = (node.data ??= {})
      data.hProperties = {
        ...hProperties,
        src: image.src,
        loading: 'lazy',
        decoding: 'async',
      }
    }
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
export function remarkFftDemoBlock() {
  return async (tree: Root) => {
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
      const image = await optimizeLocalImage(poster)
      const node: RootContent = {
        type: 'paragraph',
        children: [],
        data: {
          hName: 'div',
          hProperties: { class: 'fft-demo-shell not-prose', 'data-fft-demo': '' },
          hChildren: [
            {
              type: 'element',
              tagName: 'img',
              properties: image
                ? {
                    src: image.src,
                    loading: 'lazy',
                    decoding: 'async',
                    alt: 'FFT Visualizer demo',
                    class: 'fft-demo-poster',
                  }
                : { alt: 'FFT Visualizer demo', class: 'fft-demo-poster' },
              children: [],
            },
            {
              type: 'element',
              tagName: 'div',
              properties: { class: 'fft-demo-overlay' },
              children: [
                {
                  type: 'element',
                  tagName: 'button',
                  properties: { type: 'button', class: 'fft-demo-play', 'data-fft-play': '', 'aria-label': 'Load interactive demo' },
                  children: [
                    {
                      type: 'element',
                      tagName: 'svg',
                      properties: {
                        xmlns: 'http://www.w3.org/2000/svg',
                        width: 22,
                        height: 22,
                        viewBox: '0 0 24 24',
                        fill: 'currentColor',
                      },
                      children: [{ type: 'element', tagName: 'path', properties: { d: 'M8 5v14l11-7z' }, children: [] }],
                    },
                  ],
                },
                {
                  type: 'element',
                  tagName: 'p',
                  properties: { class: 'fft-demo-caption' },
                  children: [{ type: 'text', value: 'Interactive demo — click to load' }],
                },
              ],
            },
          ],
        },
      }
      tree.children.splice(start, end - start + 1, node)
    }
  }
}
