export {}

interface SearchItem {
  title: string
  description: string
  href: string
  type: string
}

const dialog = document.querySelector<HTMLDialogElement>('[data-search-dialog]')
const input = dialog?.querySelector<HTMLInputElement>('[data-search-input]')
const results = dialog?.querySelector<HTMLUListElement>('[data-search-results]')
const searchStatus = dialog?.querySelector<HTMLElement>('[data-search-status]')
let searchItems: SearchItem[] | undefined

function escapeHtml(value: string) {
  const node = document.createElement('div')
  node.textContent = value
  return node.innerHTML
}

async function openSearch() {
  if (!dialog || !input) return
  dialog.showModal()
  input.focus()
  if (!searchItems) {
    try {
      const response = await fetch('/search-index.json')
      if (!response.ok) throw new Error('Search index unavailable')
      searchItems = await response.json()
    } catch {
      if (searchStatus) searchStatus.textContent = 'Search could not be loaded.'
    }
  }
}

function renderResults(query: string) {
  if (!results || !searchStatus) return
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (!words.length) {
    results.replaceChildren()
    searchStatus.textContent = 'Start typing to search.'
    searchStatus.hidden = false
    return
  }
  const matches = (searchItems ?? []).filter((item) => {
    const text = `${item.title} ${item.description}`.toLowerCase()
    return words.every((word) => text.includes(word))
  }).slice(0, 12)

  results.innerHTML = matches.map((item) => `
    <li class="border-t border-(--color-border)">
      <a href="${escapeHtml(item.href)}" class="block px-5 py-4 hover:bg-(--color-bg-muted) focus-visible:bg-(--color-bg-muted)">
        <span class="label text-(--color-accent-text)">${escapeHtml(item.type)}</span>
        <strong class="mt-1 block font-medium">${escapeHtml(item.title)}</strong>
        ${item.description ? `<span class="mt-1 block text-sm text-(--color-text-muted)">${escapeHtml(item.description)}</span>` : ''}
      </a>
    </li>`).join('')
  searchStatus.textContent = matches.length ? `${matches.length} result${matches.length === 1 ? '' : 's'}` : 'No results found.'
  searchStatus.hidden = matches.length > 0
}

document.querySelectorAll<HTMLButtonElement>('[data-search-open]').forEach((button) => {
  button.addEventListener('click', () => void openSearch())
})
dialog?.querySelector('[data-search-close]')?.addEventListener('click', () => dialog.close())
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close()
})
input?.addEventListener('input', () => renderResults(input.value))
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    void openSearch()
  }
})
