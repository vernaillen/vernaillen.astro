const items = document.querySelectorAll<HTMLElement>('.reveal')

if (items.length) {
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
