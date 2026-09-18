import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { site, buildDate } from '../lib/site'

// Hand-rolled RSS 2.0: the feed is a dozen items with title, link and
// description, not worth a dependency.
function escape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  const feedUrl = new URL('/rss.xml', site.url).toString()

  const items = posts.map((post) => {
    const link = new URL(`/blog/${post.id}`, site.url).toString()
    return `    <item>
      <title>${escape(post.data.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <description>${escape(post.data.description)}</description>
    </item>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(site.name)} — Blog</title>
    <link>${new URL('/blog', site.url).toString()}</link>
    <description>${escape(site.description)}</description>
    <language>en</language>
    <lastBuildDate>${buildDate.toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
