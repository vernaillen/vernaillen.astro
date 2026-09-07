const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')
const panel = document.querySelector<HTMLElement>('[data-menu-panel]')

toggle?.addEventListener('click', () => {
  if (!panel) return
  const opening = panel.hidden
  panel.hidden = !opening
  toggle.setAttribute('aria-expanded', String(opening))
})

panel?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    if (!panel) return
    panel.hidden = true
    toggle?.setAttribute('aria-expanded', 'false')
  })
})
