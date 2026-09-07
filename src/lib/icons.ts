// A handful of icon references in `content/**` use iconify sets that aren't
// installed (only lucide + simple-icons are). Substitute the closest
// equivalent from an approved set rather than editing the content files.
const ICON_SUBSTITUTIONS: Record<string, string> = {
  'i-mage-sound-waves': 'i-lucide-audio-waveform',
  'i-material-symbols-arrow-right-alt': 'i-lucide-arrow-right',
  'i-logos-mastodon-icon': 'i-simple-icons-mastodon',
  'i-logos-bluesky': 'i-simple-icons-bluesky',
}

// Converts Nuxt UI/UnoCSS-style icon names (`i-lucide-home`,
// `i-simple-icons-github`) used throughout `content/**` into astro-icon's
// `pack:name` format (`lucide:home`, `simple-icons:github`).
export function resolveIcon(name: string): string {
  const resolved = ICON_SUBSTITUTIONS[name] ?? name
  const withoutPrefix = resolved.replace(/^i-/, '')
  if (withoutPrefix.startsWith('simple-icons-')) {
    return `simple-icons:${withoutPrefix.slice('simple-icons-'.length)}`
  }
  return withoutPrefix.replace(/^([a-z]+)-/, '$1:')
}
