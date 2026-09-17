const items = document.querySelectorAll<HTMLElement>('.reveal')
const STEP_MS = 40
const MAX_DELAY_MS = 240

if (items.length) {
  // Elements entering the viewport together cascade in DOM order, so grid
  // children (stat cells, cards, testimonials) reveal one after another.
  const observer = new IntersectionObserver(
    (entries) => {
      const batch = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target as HTMLElement)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      batch.forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(i * STEP_MS, MAX_DELAY_MS)}ms`
        el.classList.add('revealed')
        observer.unobserve(el)
      })
    },
    { threshold: 0.15 },
  )
  items.forEach((el) => observer.observe(el))
}
