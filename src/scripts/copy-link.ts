import { copyWithFeedback } from './clipboard'

document.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-copy-link]')
  const url = button?.dataset.copyLink
  if (!url) return
  copyWithFeedback(button, url)
})
