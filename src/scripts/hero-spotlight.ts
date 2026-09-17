// Moves the gold dot-grid spotlight (.hero-spotlight) under the pointer.
// Fine-pointer devices only, and never under reduced motion.
const spotlight = document.querySelector<HTMLElement>('[data-hero-spotlight]')
const hero = spotlight?.parentElement

const enabled =
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (spotlight && hero && enabled) {
  let frame = 0
  let x = 0
  let y = 0

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect()
    x = event.clientX - rect.left
    y = event.clientY - rect.top
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      spotlight.style.setProperty('--mx', `${x}px`)
      spotlight.style.setProperty('--my', `${y}px`)
      spotlight.classList.add('is-active')
    })
  })

  hero.addEventListener('pointerleave', () => spotlight.classList.remove('is-active'))
}
