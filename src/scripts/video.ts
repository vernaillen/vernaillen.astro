if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const shells = document.querySelectorAll<HTMLElement>('[data-project-video]')
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target.querySelector('video')
        if (!video) continue
        if (entry.isIntersecting) void video.play().catch(() => {})
        else video.pause()
      }
    },
    { threshold: 0.25 },
  )
  shells.forEach((el) => observer.observe(el))
}
