const localImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{png,jpg,jpeg,webp,avif,gif,svg}',
  { eager: true },
)

export function resolveLocalImage(rootPath: string) {
  if (!rootPath.startsWith('/images/')) return undefined
  const key = `/src/assets/images/${rootPath.slice('/images/'.length)}`
  return localImages[key]
}

// Resolves a content-authored `/images/...` path to the ImageMetadata Astro's
// own <Image> component expects, for use outside the markdown pipeline (page
// and component templates driven by YAML/frontmatter data).
export async function localImage(rootPath: string) {
  return resolveLocalImage(rootPath)?.default
}
