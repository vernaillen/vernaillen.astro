// The demo core (visualizer + WASM FFT) is only fetched when a visitor shows
// intent: warmed on hover/focus/touch so the click that follows finds the
// module cached, then booted with the radio started straight away.
type DemoCore = typeof import('./fft-demo-core')
let core: Promise<DemoCore> | undefined

function warm() {
  core ??= import('./fft-demo-core').catch((error: unknown) => {
    core = undefined
    throw error
  })
  return core
}

function rootOf(target: EventTarget | null) {
  return (target as HTMLElement | null)?.closest<HTMLElement>('[data-fft-demo]') ?? null
}

for (const type of ['pointerover', 'focusin', 'touchstart'] as const) {
  document.addEventListener(
    type,
    (event) => {
      if (rootOf(event.target)) warm().catch(() => {})
    },
    { passive: true },
  )
}

document.addEventListener('click', (event) => {
  const trigger = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-fft-play], [data-fft-controls] [data-source]')
  if (!trigger) return
  const root = rootOf(trigger)
  if (!root || 'fftBooted' in root.dataset) return
  const autostart = (trigger.dataset.source as 'radio' | 'mic' | undefined) ?? 'radio'
  trigger.disabled = true
  warm()
    .then((mod) => mod.boot(root, { autostart }))
    .catch(() => {
      trigger.disabled = false
      const caption = root.querySelector('.fft-demo-caption')
      if (caption) caption.textContent = 'Demo could not load — try again.'
    })
})
