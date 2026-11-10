import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { xPostId } from '../lib/social-counts'

// Allowlist for the x-counts proxy: it only spends X API reads on posts the blog links to.
export const GET: APIRoute = async () => {
  const posts = await getCollection('blog')
  const ids = posts.flatMap((post) => (post.data.social ?? []).map((s) => xPostId(s.url))).filter((id) => id !== undefined)
  return new Response(JSON.stringify([...new Set(ids)].sort()), { headers: { 'Content-Type': 'application/json' } })
}
