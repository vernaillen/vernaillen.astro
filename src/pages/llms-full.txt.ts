import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { site } from '../lib/site'
import { getPage } from '../lib/content'

export const GET: APIRoute = async () => {
  const contents: string[] = []

  const { data: home } = await getPage('index')

  if (home) {
    const sections = [`# Home\n\nSource: ${site.url}/`]

    if (home.about?.description) {
      sections.push(`## ${home.about.title ?? 'About'}\n\n${home.about.description.trim()}`)
    }

    if (home.experience?.items?.length) {
      const lines = home.experience.items.map((item) => {
        const company = item.company.url ? `[${item.company.name}](${item.company.url})` : item.company.name
        return `- **${item.date}** — ${item.position} ${company}`
      })
      sections.push(`## ${home.experience.title ?? 'Work Experience'}\n\n${lines.join('\n')}`)
    }

    if (home.stats?.length) {
      const lines = home.stats.map((s) => `- **${s.value}** ${s.label}`)
      sections.push(`## At a Glance\n\n${lines.join('\n')}`)
    }

    if (home.faq?.categories?.length) {
      const blocks = [`## ${home.faq.title ?? 'FAQ'}`]
      for (const cat of home.faq.categories) {
        blocks.push(`### ${cat.title}`)
        for (const q of cat.questions) {
          blocks.push(`**${q.label}**\n\n${q.content.trim()}`)
        }
      }
      sections.push(blocks.join('\n\n'))
    }

    contents.push(sections.join('\n\n'))
  }

  const aboutEntry = await getPage('about')
  if (aboutEntry?.body) {
    contents.push(`# About\n\nSource: ${site.url}/about\n\n${aboutEntry.body.trim()}`)
  }

  const { data: career } = await getPage('career')
  if (career?.events?.length) {
    const lines = career.events.map((e) => `- **${e.date}** — *${e.category}* — ${e.title} @ ${e.location}`)
    const description = career.description ? `${career.description}\n\n` : ''
    contents.push(`# Career\n\nSource: ${site.url}/career\n\n${description}${lines.join('\n')}`)
  }

  const projects = await getCollection('projects')
  if (projects.length) {
    const sorted = [...projects].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    const blocks = sorted.map((p) => {
      const tags = p.data.tags.length ? `\n\nTags: ${p.data.tags.join(', ')}` : ''
      return `## [${p.data.title}](${p.data.url})\n\n${p.data.description}${tags}`
    })
    contents.push(`# Projects\n\nSource: ${site.url}/projects\n\n${blocks.join('\n\n')}`)
  }

  const posts = (await getCollection('blog')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  if (posts.length) {
    const blocks = posts.map((post) => {
      const url = `${site.url}/blog/${post.id}`
      const body = post.body?.trim() ?? ''
      return `## [${post.data.title}](${url})\n\nSource: ${url}\n\n${post.data.description}\n\n${body}`
    })
    contents.push(`# Blog\n\nSource: ${site.url}/blog\n\n${blocks.join('\n\n')}`)
  }

  return new Response(contents.join('\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
