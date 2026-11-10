// Reply counts on the "comment //" links. X needs a paid bearer token, so its
// count comes from the x-counts proxy on Coolify; Mastodon's public API needs no
// key and is fetched straight from the browser.
const countsOrigin = import.meta.env.PUBLIC_COUNTS_URL || 'https://counts.vernaillen.dev'

export function xPostId(url: string): string | undefined {
  return url.match(/^https:\/\/(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/)?.[1]
}

export function repliesSource(url: string): { url: string; field: string } | undefined {
  const xId = xPostId(url)
  if (xId) return { url: `${countsOrigin}/x/${xId}`, field: 'replies' }
  const mastodon = url.match(/^(https:\/\/[^/]+)\/@[^/]+\/(\d+)$/)
  if (mastodon) return { url: `${mastodon[1]}/api/v1/statuses/${mastodon[2]}`, field: 'replies_count' }
}
