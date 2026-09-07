export async function copyWithFeedback(button: HTMLButtonElement, text: string) {
  await navigator.clipboard.writeText(text)
  button.classList.add('copied')
  setTimeout(() => button.classList.remove('copied'), 1500)
}
