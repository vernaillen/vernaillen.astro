import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { navLinks } from '../lib/links'

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog')
  const pages = navLinks.map((link) => ({ title: link.label, description: '', href: link.href, type: 'Page' }))
  const articles = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    href: `/blog/${post.id}`,
    type: 'Article',
  }))

  return new Response(JSON.stringify([...pages, ...articles]), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
