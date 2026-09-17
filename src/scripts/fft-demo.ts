document.addEventListener('click', (event) => {
  const trigger = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-fft-play]')
  if (!trigger) return
  const root = trigger.closest<HTMLElement>('[data-fft-demo]')
  if (!root) return
  trigger.disabled = true
  import('./fft-demo-core')
    .then((mod) => mod.boot(root))
    .catch(() => {
      const caption = root.querySelector('.fft-demo-caption')
      if (caption) caption.textContent = 'Demo could not load — reload the page to try again.'
    })
})
