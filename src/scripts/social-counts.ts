// Fills in the reply count badge on each "comment //" link once the page has
// loaded; a failed or zero count leaves the plain icon.
for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-replies-url]')) {
  const { repliesUrl, repliesField } = link.dataset
  fetch(repliesUrl!)
    .then((res) => (res.ok ? res.json() : undefined))
    .then((data) => {
      const replies = Number(data?.[repliesField!])
      if (!(replies > 0)) return
      const count = link.querySelector<HTMLElement>('[data-replies-count]')!
      count.textContent = String(replies)
      count.hidden = false
      link.ariaLabel = `${link.ariaLabel} (${replies} ${replies === 1 ? 'reply' : 'replies'})`
    })
    .catch(() => {})
}
