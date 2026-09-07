import { getEntry, type CollectionEntry } from 'astro:content'
import type { AboutPage, BlogMeta, CareerPage, IndexPage, LinksPage } from '../content.config'

type PageData = {
  index: IndexPage
  about: AboutPage
  career: CareerPage
  projects: LinksPage
  'open-source': LinksPage
  blog: BlogMeta
}

export async function getPage<K extends keyof PageData>(id: K) {
  const entry = await getEntry('pages', id)
  if (!entry) throw new Error(`Missing content entry: ${id}`)
  return entry as CollectionEntry<'pages'> & { data: PageData[K] }
}
