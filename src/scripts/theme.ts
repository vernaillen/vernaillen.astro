const STORAGE_KEY = 'color-mode'
const THEME_COLOR = { light: '#ffffff', dark: '#0a0908' }
const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')

function isDark() {
  return document.documentElement.classList.contains('dark')
}

const toggles = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')

function labelToggles() {
  const label = `Switch to ${isDark() ? 'light' : 'dark'} mode`
  toggles.forEach((button) => button.setAttribute('aria-label', label))
}

function applyTheme(next: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', next === 'dark')
  if (themeMeta) themeMeta.content = THEME_COLOR[next]
  localStorage.setItem(STORAGE_KEY, next)
  labelToggles()
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The markup ships the dark-mode label; the inline head script may already
// have switched to light before this module runs.
labelToggles()

toggles.forEach((button) => {
  button.addEventListener('click', (event) => {
    const next = isDark() ? 'light' : 'dark'

    if (reduceMotion || !document.startViewTransition) {
      applyTheme(next)
      return
    }

    const { clientX, clientY } = event
    const radius = Math.hypot(Math.max(clientX, innerWidth - clientX), Math.max(clientY, innerHeight - clientY))

    const transition = document.startViewTransition(() => applyTheme(next))
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${clientX}px ${clientY}px)`, `circle(${radius}px at ${clientX}px ${clientY}px)`],
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  })
})
