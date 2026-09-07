import { copyWithFeedback } from './clipboard'

document.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.terminal-copy')
  if (!button?.dataset.code) return
  copyWithFeedback(button, button.dataset.code)
})
