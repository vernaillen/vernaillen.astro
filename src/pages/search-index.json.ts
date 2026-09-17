import type { APIRoute } from 'astro'
import { getCollection, getEntry } from 'astro:content'
import { navLinks } from '../lib/links'

export interface SearchEntry {
  type: 'page' | 'post' | 'project'
  title: string
  description: string
  href: string
  date?: string
  body?: string
}

// Markdown → plain text, good enough for substring matching and snippets.
function plainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^::.*$/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)(\{[^}]*\})?/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^[\s>#]*(?:[-*+]|\d+\.)?\s*/gm, '')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const GET: APIRoute = async () => {
  const pages: SearchEntry[] = []
  for (const link of navLinks) {
    const id = link.href === '/' ? 'index' : link.href.slice(1)
    const page = await getEntry('pages', id)
    const data = page?.data as { description?: string } | undefined
    pages.push({ type: 'page', title: link.label, description: data?.description ?? '', href: link.href })
  }

  const posts = (await getCollection('blog'))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map<SearchEntry>((post) => ({
      type: 'post',
      title: post.data.title,
      description: post.data.description,
      href: `/blog/${post.id}`,
      date: post.data.date.toISOString().slice(0, 10),
      body: plainText(post.body ?? ''),
    }))

  const projects = (await getCollection('projects'))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map<SearchEntry>((project) => ({
      type: 'project',
      title: project.data.title,
      description: project.data.description,
      href: `/projects#${project.id}`,
      body: project.data.tags.join(' '),
    }))

  return new Response(JSON.stringify([...pages, ...posts, ...projects]), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
