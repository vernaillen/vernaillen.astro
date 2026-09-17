import type { SearchEntry } from '../pages/search-index.json'

const dialog = document.querySelector<HTMLDialogElement>('[data-search]')
const input = dialog?.querySelector<HTMLInputElement>('[data-search-input]')
const list = dialog?.querySelector<HTMLUListElement>('[data-search-results]')
const empty = dialog?.querySelector<HTMLElement>('[data-search-empty]')
const emptyQuery = dialog?.querySelector<HTMLElement>('[data-search-query]')

const MAX_RESULTS = 12
const SNIPPET_RADIUS = 70

let index: SearchEntry[] | null = null
let loading: Promise<SearchEntry[]> | null = null
let results: SearchEntry[] = []
let selected = 0

function loadIndex() {
  loading ??= fetch('/search-index.json')
    .then((response) => response.json() as Promise<SearchEntry[]>)
    .then((entries) => (index = entries))
  return loading
}

function terms(query: string) {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

// Every term has to hit somewhere (AND); titles weigh most, body text least.
function score(entry: SearchEntry, words: string[]) {
  const title = entry.title.toLowerCase()
  const description = entry.description.toLowerCase()
  const body = entry.body?.toLowerCase() ?? ''
  let total = 0
  for (const word of words) {
    let hit = 0
    if (title.includes(word)) hit += title.startsWith(word) ? 14 : 10
    if (description.includes(word)) hit += 4
    if (body.includes(word)) hit += 1
    if (!hit) return 0
    total += hit
  }
  return total + (entry.type === 'page' ? 1 : 0)
}

function search(query: string) {
  if (!index) return []
  const words = terms(query)
  if (words.length === 0) return index.filter((entry) => entry.type !== 'project').slice(0, MAX_RESULTS)
  return index
    .map((entry) => ({ entry, score: score(entry, words) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((item) => item.entry)
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

function highlight(text: string, words: string[]) {
  if (words.length === 0) return escapeHtml(text)
  const pattern = new RegExp(words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi')
  let html = ''
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0
    html += escapeHtml(text.slice(last, at)) + `<mark>${escapeHtml(match[0])}</mark>`
    last = at + match[0].length
  }
  return html + escapeHtml(text.slice(last))
}

// Description by default; a window around the first body hit when the query
// only matched the body.
function excerpt(entry: SearchEntry, words: string[]) {
  const inMeta = words.some((word) => (entry.title + ' ' + entry.description).toLowerCase().includes(word))
  if (inMeta || !entry.body || entry.type === 'project') return entry.description
  const body = entry.body
  const at = words.map((word) => body.toLowerCase().indexOf(word)).filter((i) => i >= 0).sort((a, b) => a - b)[0]
  if (at === undefined) return entry.description
  const start = Math.max(0, at - SNIPPET_RADIUS)
  const end = Math.min(body.length, at + SNIPPET_RADIUS)
  return (start > 0 ? '…' : '') + body.slice(start, end).trim() + (end < body.length ? '…' : '')
}

function render(query: string) {
  if (!list || !empty || !emptyQuery) return
  const words = terms(query)
  results = search(query)
  selected = 0
  list.innerHTML = results
    .map(
      (entry, i) => `
      <li role="option" id="search-option-${i}" data-index="${i}" aria-selected="${i === 0}" class="search-item">
        <a href="${escapeHtml(entry.href)}" data-astro-prefetch class="flex items-baseline gap-3 px-4 py-2.5" tabindex="-1">
          <span class="w-14 shrink-0 font-mono text-[10px] uppercase tracking-wider text-(--color-text-dimmed)">${entry.type}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium">${highlight(entry.title, words)}</span>
            <span class="block truncate text-xs text-(--color-text-muted)">${highlight(excerpt(entry, words), words)}</span>
          </span>
          ${entry.date ? `<span class="hidden shrink-0 font-mono text-[11px] text-(--color-text-dimmed) sm:block">${entry.date}</span>` : ''}
        </a>
      </li>`,
    )
    .join('')
  const none = words.length > 0 && results.length === 0
  empty.hidden = !none
  emptyQuery.textContent = query.trim()
  input?.setAttribute('aria-activedescendant', results.length ? 'search-option-0' : '')
}

function select(next: number) {
  if (!list || results.length === 0) return
  selected = (next + results.length) % results.length
  list.querySelectorAll<HTMLElement>('[role="option"]').forEach((option, i) => {
    option.setAttribute('aria-selected', String(i === selected))
  })
  const active = list.children[selected] as HTMLElement | undefined
  active?.scrollIntoView({ block: 'nearest' })
  input?.setAttribute('aria-activedescendant', `search-option-${selected}`)
}

function open() {
  if (!dialog || !input || dialog.open) return
  dialog.showModal()
  document.documentElement.classList.add('overflow-hidden')
  input.select()
  loadIndex().then(() => render(input.value))
}

function close() {
  dialog?.close()
}

if (dialog && input && list) {
  dialog.addEventListener('close', () => document.documentElement.classList.remove('overflow-hidden'))
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close()
  })
  dialog.querySelector('[data-search-close]')?.addEventListener('click', close)

  input.addEventListener('input', () => render(input.value))
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      select(selected + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      select(selected - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      list.querySelectorAll<HTMLAnchorElement>('a')[selected]?.click()
    }
  })

  list.addEventListener('mousemove', (event) => {
    const option = (event.target as HTMLElement).closest<HTMLElement>('[role="option"]')
    if (option && Number(option.dataset.index) !== selected) select(Number(option.dataset.index))
  })
  list.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest('a')
    if (link && new URL(link.href).pathname === location.pathname) close()
  })

  const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)
  document.querySelectorAll<HTMLElement>('[data-search-open]').forEach((button) => {
    button.addEventListener('click', open)
    button.addEventListener('pointerenter', () => void loadIndex(), { once: true })
    if (!isMac) button.querySelectorAll('kbd').forEach((kbd) => (kbd.textContent = 'Ctrl K'))
  })

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      if (dialog.open) close()
      else open()
    }
  })
}
