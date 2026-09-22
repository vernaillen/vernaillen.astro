import type { CollectionEntry } from 'astro:content'
import { slugify } from './slug'

export interface TagSummary {
  tag: string
  slug: string
  count: number
}

export function collectTags(posts: CollectionEntry<'blog'>[]): TagSummary[] {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, slug: slugify(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}
