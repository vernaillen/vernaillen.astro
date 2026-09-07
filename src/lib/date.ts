import type { CollectionEntry } from 'astro:content'

export function formatPostDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function sortPostsNewestFirst(posts: CollectionEntry<'blog'>[]) {
  return [...posts].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}
