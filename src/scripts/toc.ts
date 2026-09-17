const links = document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')

if (links.length) {
  // Each heading has two links: the mobile <details> list and the sidebar.
  const headingMap = new Map<string, HTMLAnchorElement[]>()
  links.forEach((link) => {
    const id = link.getAttribute('href')?.slice(1)
    if (id) headingMap.set(id, [...(headingMap.get(id) ?? []), link])
  })

  const headings = [...headingMap.keys()]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null)

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const active = headingMap.get(entry.target.id)
        if (!active) continue
        links.forEach((l) => l.classList.remove('toc-active'))
        active.forEach((l) => l.classList.add('toc-active'))
      }
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
  )
  headings.forEach((heading) => observer.observe(heading))
}
