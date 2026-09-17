// Click-to-enlarge for blog body images: a native <dialog> in blog/[slug].astro,
// with the clicked image morphing into the enlarged one through a same-document
// view transition (named `lightbox-image` in global.css).
const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]')
const enlarged = dialog?.querySelector<HTMLImageElement>('[data-lightbox-image]')
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

let sourceImage: HTMLImageElement | null = null

// The widest srcset candidate, falling back to whatever is displayed.
function largestSource(img: HTMLImageElement) {
  const candidates = img.srcset
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/))
    .filter(([url]) => url)
    .map(([url, descriptor]) => ({ url: url!, width: parseFloat(descriptor ?? '0') }))
    .sort((a, b) => b.width - a.width)
  return candidates[0]?.url ?? img.currentSrc ?? img.src
}

function morph(from: HTMLElement, to: HTMLElement, update: () => void) {
  if (reduceMotion || !document.startViewTransition) {
    update()
    return
  }
  from.style.viewTransitionName = 'lightbox-image'
  const transition = document.startViewTransition(() => {
    from.style.viewTransitionName = ''
    update()
    to.style.viewTransitionName = 'lightbox-image'
  })
  transition.finished.then(() => (to.style.viewTransitionName = ''))
}

async function open(img: HTMLImageElement) {
  if (!dialog || !enlarged || dialog.open) return
  const src = largestSource(img)
  const loader = new Image()
  loader.src = src
  await loader.decode().catch(() => undefined)

  sourceImage = img
  morph(img, enlarged, () => {
    enlarged.src = src
    enlarged.alt = img.alt
    enlarged.width = loader.naturalWidth || img.naturalWidth
    enlarged.height = loader.naturalHeight || img.naturalHeight
    dialog.showModal()
  })
}

function close() {
  if (!dialog || !enlarged || !dialog.open) return
  const target = sourceImage
  sourceImage = null
  if (!target) {
    dialog.close()
    return
  }
  morph(enlarged, target, () => dialog.close())
}

if (dialog && enlarged) {
  const images = document.querySelectorAll<HTMLImageElement>('.blog-prose img:not(.fft-demo-poster)')
  images.forEach((img) => {
    if (img.closest('a')) return
    img.dataset.lightbox = ''
    img.addEventListener('click', () => void open(img))
  })

  dialog.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (target === dialog || target.closest('[data-lightbox-stage], [data-lightbox-close]')) close()
  })
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault()
    close()
  })
}
