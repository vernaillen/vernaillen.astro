import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const linkSchema = z.object({
  label: z.string(),
  to: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
  variant: z.string().optional(),
  size: z.string().optional(),
  target: z.string().optional(),
})

const blog = defineCollection({
  loader: glob({
    pattern: '[0-9]*.md',
    base: './content/blog',
    generateId: ({ entry }) => entry.replace(/^\d+\./, '').replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    minRead: z.number(),
    date: z.coerce.date(),
    image: z.object({
      src: z.string(),
      height: z.number().optional(),
      alt: z.string().optional(),
    }),
    author: z.object({
      name: z.string(),
      description: z.string(),
      avatar: z.object({ src: z.string(), alt: z.string() }),
    }),
    social: z
      .array(
        z.object({
          name: z.string(),
          url: z.string(),
          icon: z.string().optional(),
        }),
      )
      .optional(),
  }),
})

const projects = defineCollection({
  loader: glob({
    pattern: '*.yml',
    base: './content/projects',
    generateId: ({ entry }) => entry.replace(/^\d+\./, '').replace(/\.yml$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string(),
    code: z.string().url().optional(),
    website: z.string().url(),
    tags: z.array(z.string()),
    date: z.coerce.date(),
    demo: z.string().optional(),
    video: z.boolean().optional(),
  }),
})

// `content/*.{yml,md}` mixes several unrelated page shapes into one directory
// (mirroring the source site's per-page Nuxt Content files). Each member
// schema is `.strict()` so the union only matches the one page it belongs to
// instead of silently stripping fields from the wrong shape.
const aboutSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    images: z.array(z.object({ src: z.string(), alt: z.string() })),
  })
  .strict()

const indexSchema = z
  .object({
    seo: z.object({ title: z.string(), description: z.string() }),
    title: z.string(),
    title2: z.string(),
    description: z.string(),
    hero: z.object({ links: z.array(linkSchema) }),
    stats: z.array(z.object({ value: z.string().optional(), since: z.number().optional(), label: z.string() })),
    about: z.object({ title: z.string(), description: z.string() }),
    caseStudies: z.array(
      z.object({
        client: z.string(),
        title: z.string(),
        challenge: z.string(),
        contribution: z.string(),
        evidence: z.string(),
        stack: z.array(z.string()),
      }),
    ),
    experience: z.object({
      title: z.string(),
      items: z.array(
        z.object({
          position: z.string(),
          date: z.coerce.string(),
          company: z.object({
            name: z.string(),
            logo: z.string(),
            url: z.string(),
            color: z.string(),
          }),
        }),
      ),
    }),
    testimonials: z.array(
      z.object({
        quote: z.string(),
        author: z.object({
          name: z.string(),
          description: z.string(),
          avatar: z.object({ src: z.string(), alt: z.string() }),
        }),
      }),
    ),
    blog: z.object({ title: z.string(), description: z.string() }),
    faq: z.object({
      title: z.string(),
      description: z.string(),
      categories: z.array(
        z.object({
          title: z.string(),
          questions: z.array(z.object({ label: z.string(), content: z.string() })),
        }),
      ),
    }),
  })
  .strict()

const careerSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    events: z.array(
      z.object({
        category: z.string(),
        title: z.string(),
        date: z.coerce.string(),
        location: z.string(),
        stack: z.array(z.string()),
        links: z.array(linkSchema).optional(),
      }),
    ),
    links: z.array(linkSchema),
  })
  .strict()

const linksPageSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    links: z.array(linkSchema),
  })
  .strict()

const blogMetaSchema = z
  .object({
    title: z.string(),
    description: z.string(),
  })
  .strict()

const pages = defineCollection({
  loader: glob({ pattern: '*.{yml,md}', base: './content' }),
  schema: z.union([aboutSchema, indexSchema, careerSchema, linksPageSchema, blogMetaSchema]),
})

export const collections = { blog, projects, pages }

export type IndexPage = z.infer<typeof indexSchema>
export type CareerPage = z.infer<typeof careerSchema>
export type AboutPage = z.infer<typeof aboutSchema>
export type LinksPage = z.infer<typeof linksPageSchema>
export type BlogMeta = z.infer<typeof blogMetaSchema>
