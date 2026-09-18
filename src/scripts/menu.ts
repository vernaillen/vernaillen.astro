const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')
const panel = document.querySelector<HTMLElement>('[data-menu-panel]')
const backdrop = document.querySelector<HTMLElement>('[data-menu-backdrop]')

function setOpen(open: boolean) {
  if (!panel) return
  panel.hidden = !open
  if (backdrop) backdrop.hidden = !open
  toggle?.setAttribute('aria-expanded', String(open))
}

toggle?.addEventListener('click', () => setOpen(!!panel?.hidden))
backdrop?.addEventListener('click', () => setOpen(false))
panel?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)))

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && panel && !panel.hidden) setOpen(false)
})

// Leaving the mobile breakpoint with the menu open would keep the backdrop
// (both are md:hidden, but the state should not survive either).
window.matchMedia('(min-width: 48rem)').addEventListener('change', (event) => {
  if (event.matches) setOpen(false)
})
