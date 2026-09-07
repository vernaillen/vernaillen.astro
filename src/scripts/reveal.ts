const items = document.querySelectorAll<HTMLElement>('.reveal')

if (items.length) {
  const groups = new Map<Element | null, HTMLElement[]>()
  items.forEach((el) => {
    const group = groups.get(el.parentElement) ?? []
    group.push(el)
    groups.set(el.parentElement, group)
  })
  for (const group of groups.values()) {
    group.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 60, 120)}ms`
    })
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('revealed')
        observer.unobserve(entry.target)
      }
    },
    { threshold: 0.15 },
  )
  items.forEach((el) => observer.observe(el))
}
