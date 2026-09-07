import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

const rawFiles = import.meta.glob<string>('/content/blog/*.md', { query: '?raw', import: 'default', eager: true })

function rawContentFor(filename: string) {
  const entry = Object.entries(rawFiles).find(([path]) => path.endsWith(`/${filename}`))
  return entry?.[1]
}

export async function getStaticPaths() {
  const posts = await getCollection('blog')
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { filename: post.filePath?.split('/').pop() ?? `${post.id}.md` },
  }))
}

export const GET: APIRoute = ({ props }) => {
  const raw = rawContentFor(props.filename as string)
  return new Response(raw ?? '', {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
