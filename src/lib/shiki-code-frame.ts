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

// Comment tokens in both Material themes sit under 3:1 against the code
// background (#90A4AE on light, #676E95 on dark) and Lighthouse flags each
// one. Astro's highlighter does not forward Shiki's `colorReplacements`, so
// the swap happens on the emitted token styles instead; the replacements keep
// the hue and reach 4.5:1.
const COLOR_REPLACEMENTS: Record<string, string> = {
  '#90a4ae': '#607079',
  '#676e95': '#949bbd',
}

function replaceColor(value: string) {
  return COLOR_REPLACEMENTS[value.toLowerCase()] ?? value
}

/**
 * Wraps Shiki's `<pre>` output in the terminal-style code frame used across
 * blog posts (dots + filename + language + copy button) and lifts the
 * low-contrast comment colour. Markup only this pass — the copy-to-clipboard
 * behaviour is a client script added later.
 */
export function shikiCodeFrame(): ShikiTransformer {
  return {
    name: 'terminal-code-frame',
    tokens(lines) {
      for (const line of lines) {
        for (const token of line) {
          if (!token.htmlStyle) continue
          for (const [key, value] of Object.entries(token.htmlStyle)) token.htmlStyle[key] = replaceColor(value)
        }
      }
    },
    pre(node) {
      // The lighter theme's foreground is the same #90A4AE; unscoped tokens
      // inherit it from here.
      if (typeof node.properties.style === 'string') {
        node.properties.style = node.properties.style.replace(/#[0-9a-f]{6}/gi, replaceColor)
      }
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
