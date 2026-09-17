if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const shells = document.querySelectorAll<HTMLElement>('[data-project-video]')
  const inView = new Set<HTMLVideoElement>()

  function play(video: HTMLVideoElement) {
    void video.play().catch(() => {})
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target.querySelector('video')
        if (!video) continue
        if (entry.isIntersecting) {
          inView.add(video)
          if (!document.hidden) play(video)
        } else {
          inView.delete(video)
          video.pause()
        }
      }
    },
    { threshold: 0.25 },
  )
  shells.forEach((el) => observer.observe(el))

  // Muted loops keep decoding in a background tab; pause them until it is back.
  document.addEventListener('visibilitychange', () => {
    inView.forEach((video) => (document.hidden ? video.pause() : play(video)))
  })
}
