import type { APIRoute } from 'astro'
import { site, buildDate } from '../lib/site'

const description = `${site.description}

vernaillen.dev is the personal site of Wouter Vernaillen — a Belgian freelance Full Stack Developer with 25+ years of experience. The site covers his professional work (Java/Spring backends, Nuxt/Vue frontends), open source projects (notably WPNuxt), and writing about modern web development, AI-assisted coding, and the tools he uses. Built with Astro and Tailwind CSS.`

const sections = [
  {
    title: 'Pages',
    links: [
      { title: 'Home', description: 'Landing page with intro, featured projects, work experience, testimonials, and FAQ.', href: '/' },
      { title: 'About', description: 'Personal background: developer, open source maker, sound healer. Building things that bridge worlds.', href: '/about' },
      { title: 'Career', description: 'Professional timeline since 2002 — the projects, companies, and technologies across 25+ years.', href: '/career' },
      { title: 'Projects', description: 'Open source tools, client work, and personal projects — from enterprise portals to creative coding experiments.', href: '/projects' },
      { title: 'Open Source', description: 'Modules, tools, and starters built and maintained, plus pull requests merged into ecosystem projects.', href: '/open-source' },
      { title: 'Blog', description: 'Articles on development, Nuxt, open source, and the tools I use.', href: '/blog' },
    ],
  },
]

const notes = [`Last updated: ${buildDate.toISOString().slice(0, 10)}`]

export const GET: APIRoute = () => {
  const document = [`# ${site.name}`, `> ${description}`]

  for (const section of sections) {
    document.push(`## ${section.title}`)
    document.push(section.links.map((link) => `- [${link.title}](${link.href}): ${link.description}`).join('\n'))
  }

  document.push('## Notes', notes.map((note) => `- ${note}`).join('\n'))

  return new Response(document.join('\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
