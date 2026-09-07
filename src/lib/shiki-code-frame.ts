import type { Element, ElementContent, Properties } from 'hast'
import type { ShikiTransformer } from 'shiki'

// lucide "copy" icon body (stroke-based, 24x24 viewBox)
const COPY_ICON_PATH: ElementContent[] = [
  {
    type: 'element',
    tagName: 'rect',
    properties: { width: 14, height: 14, x: '8', y: '8', rx: '2', ry: '2' },
    children: [],
  },
  {
    type: 'element',
    tagName: 'path',
    properties: { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' },
    children: [],
  },
]

// lucide "check" icon body
const CHECK_ICON_PATH: ElementContent[] = [{ type: 'element', tagName: 'path', properties: { d: 'M20 6 9 17l-5-5' }, children: [] }]

function el(tagName: string, properties: Properties, children: ElementContent[] = []): Element {
  return { type: 'element', tagName, properties, children }
}

/**
 * Wraps Shiki's `<pre>` output in the terminal-style code frame used across
 * blog posts (dots + filename + language + copy button). Markup only this
 * pass — the copy-to-clipboard behaviour is a client script added later.
 */
// Comment tokens in both Material themes sit below WCAG AA (2.5–2.8:1); swap them for
// same-hue shades that clear 4.5:1 on the theme backgrounds.
const COMMENT_COLORS: Record<string, string> = { '#676E95': '#969EC4', '#90A4AE': '#607079' }

export function shikiCodeFrame(): ShikiTransformer {
  return {
    name: 'terminal-code-frame',
    span(node) {
      const style = node.properties.style
      if (typeof style !== 'string') return
      node.properties.style = style.replace(/#(?:676E95|90A4AE)\b/gi, (hex) => COMMENT_COLORS[hex.toUpperCase()] ?? hex)
    },
    pre(node) {
      const raw = (this.options.meta?.__raw ?? '').trim()
      const filename = /\[(.+)\]/.exec(raw)?.[1]
      const lang = this.options.lang

      const header = el('div', { class: 'terminal-header' }, [
        el('div', { class: 'terminal-dots' }, [
          el('span', { class: 'terminal-dot', style: 'background:#ff5f57' }),
          el('span', { class: 'terminal-dot', style: 'background:#febc2e' }),
          el('span', { class: 'terminal-dot', style: 'background:#28c840' }),
        ]),
        ...(filename ? [el('span', { class: 'terminal-filename' }, [{ type: 'text', value: filename }])] : []),
        el('span', { class: 'terminal-language' }, [{ type: 'text', value: lang }]),
      ])

      const copyButton = el(
        'button',
        {
          type: 'button',
          class: 'terminal-copy copy-btn',
          'data-code': this.source,
          'aria-label': 'Copy code',
        },
        [
          el(
            'svg',
            {
              class: 'icon-copy',
              xmlns: 'http://www.w3.org/2000/svg',
              width: 14,
              height: 14,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': 2,
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            },
            COPY_ICON_PATH,
          ),
          el(
            'svg',
            {
              class: 'icon-check',
              xmlns: 'http://www.w3.org/2000/svg',
              width: 14,
              height: 14,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': 2,
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            },
            CHECK_ICON_PATH,
          ),
        ],
      )

      return el('div', { class: 'terminal-block not-prose' }, [header, copyButton, node])
    },
  }
}
