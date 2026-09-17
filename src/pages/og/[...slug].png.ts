import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { APIRoute } from 'astro'
import { getCollection, getEntry } from 'astro:content'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import type { AboutPage, BlogMeta, CareerPage, IndexPage, LinksPage } from '../../content.config'

const BG = '#0a0908'
const ACCENT = '#9c8e1b'
const FG = '#f9f8f5'
const MUTED = '#918d82'
const DIM = '#656158'

const fontDir = fileURLToPath(new URL('../../../node_modules/@fontsource/geist/files/', import.meta.url))
const geistRegular = readFileSync(`${fontDir}geist-latin-400-normal.woff`)
const geistMedium = readFileSync(`${fontDir}geist-latin-500-normal.woff`)

// The `WV` mark from the source site's <OgImage> component (app/components/
// OgImage/Vernaillen.takumi.vue in ../vernaillen.new), reused verbatim.
const LOGO_SVG = `<svg viewBox="0 0 754 276" width="120" height="44" xmlns="http://www.w3.org/2000/svg"><path fill="${ACCENT}" d="M0 0 H92 V184 H172 V0 H264 V184 H344 V0 H436 V276 H0 Z"/><path fill="${FG}" d="M490 0 H582 V184 H662 V0 H754 V276 H490 Z"/></svg>`
const LOGO_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString('base64')}`

// satori accepts plain React-element-like objects (`{ type, props }`) without
// a JSX runtime — see "Use without JSX" in satori's README. Its own types
// declare the element parameter as React's `ReactNode`, which this project
// doesn't otherwise depend on, so the tree is typed against this local shape
// instead and cast where it's passed to `satori()`.
interface OgNode {
  type: string
  props: {
    style?: Record<string, string | number>
    children?: OgNode | OgNode[] | string
    src?: string
    width?: number
    height?: number
  }
}

// One span per word in a wrapping row so the accent dot stays glued to the
// last word instead of sitting at the end of the first line when the title
// wraps. The column gap stands in for the word spaces.
function titleWithDot(title: string): OgNode {
  const words = title.split(/\s+/).filter(Boolean)
  const last = words.pop() ?? ''
  const wordStyle = { fontSize: 52, fontWeight: 500, color: FG, lineHeight: 1.3 }
  const word = (text: string): OgNode => ({ type: 'span', props: { style: wordStyle, children: text } })

  return {
    type: 'div',
    props: {
      style: { display: 'flex', flexWrap: 'wrap', columnGap: 14 },
      children: [
        ...words.map(word),
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'flex-end', gap: 14 },
            children: [
              word(last),
              {
                type: 'div',
                props: {
                  style: { width: 14, height: 14, marginBottom: 8, borderRadius: 9999, backgroundColor: ACCENT },
                },
              },
            ],
          },
        },
      ],
    },
  }
}

function ogImageTree(title: string, description: string): OgNode {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        backgroundColor: BG,
        fontFamily: 'Geist',
        position: 'relative',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { position: 'absolute', bottom: 0, left: 64, width: 115, height: 2, backgroundColor: ACCENT },
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', paddingLeft: 64, paddingRight: 64, paddingTop: 56 },
            children: { type: 'img', props: { src: LOGO_DATA_URI, width: 120, height: 44 } },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
              paddingLeft: 64,
              paddingRight: 64,
            },
            children: [
              titleWithDot(title),
              {
                type: 'div',
                props: {
                  style: { display: 'flex', fontSize: 24, color: MUTED, marginTop: 20, lineHeight: 1.4 },
                  children: description,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', paddingLeft: 64, paddingRight: 64, paddingBottom: 40 },
            children: { type: 'span', props: { style: { fontSize: 18, color: DIM }, children: 'vernaillen.dev' } },
          },
        },
      ],
    },
  }
}

async function generateOgPng(title: string, description: string) {
  const svg = await satori(ogImageTree(title, description), {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Geist', data: geistRegular, weight: 400, style: 'normal' },
      { name: 'Geist', data: geistMedium, weight: 500, style: 'normal' },
    ],
  })
  const resvg = new Resvg(svg, { background: BG })
  return resvg.render().asPng()
}

interface Route {
  slug: string
  title: string
  description: string
}

export async function getStaticPaths() {
  const routes: Route[] = []

  const index = await getEntry('pages', 'index')
  const indexData = index!.data as IndexPage
  routes.push({ slug: 'index', title: indexData.seo.title, description: indexData.seo.description })

  const about = await getEntry('pages', 'about')
  const aboutData = about!.data as AboutPage
  routes.push({ slug: 'about', title: aboutData.title, description: aboutData.description })

  const career = await getEntry('pages', 'career')
  const careerData = career!.data as CareerPage
  routes.push({ slug: 'career', title: careerData.title, description: careerData.description })

  const openSource = await getEntry('pages', 'open-source')
  const openSourceData = openSource!.data as LinksPage
  routes.push({ slug: 'open-source', title: openSourceData.title, description: openSourceData.description })

  const projects = await getEntry('pages', 'projects')
  const projectsData = projects!.data as LinksPage
  routes.push({ slug: 'projects', title: projectsData.title, description: projectsData.description })

  const blogMeta = await getEntry('pages', 'blog')
  const blogMetaData = blogMeta!.data as BlogMeta
  routes.push({ slug: 'blog', title: blogMetaData.title, description: blogMetaData.description })

  const posts = await getCollection('blog')
  for (const post of posts) {
    routes.push({ slug: `blog/${post.id}`, title: post.data.title, description: post.data.description })
  }

  return routes.map((route) => ({
    params: { slug: route.slug },
    props: { title: route.title, description: route.description },
  }))
}

export const GET: APIRoute<{ title: string; description: string }> = async ({ props }) => {
  const png = await generateOgPng(props.title, props.description)
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } })
}
