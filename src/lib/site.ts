export const site = {
  url: 'https://vernaillen.dev',
  name: 'Wouter Vernaillen',
  description: 'Freelance Full Stack Developer, specializing in Java, Spring, Nuxt & DevOps.',
  email: 'wouter@vernaillen.com',
  meetingLink: 'https://calendly.com/vernaillen/15min',
}

// Every route gets a matching generated `/og/<path>.png` (src/pages/og/[...slug].png.ts).
export function ogImagePath(path: string): string {
  return path === '/' ? '/og/index.png' : `/og${path}.png`
}

export const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/vernaillen', icon: 'i-simple-icons-github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/woutervernaillen/', icon: 'i-simple-icons-linkedin' },
  { label: 'X', href: 'https://x.com/vernaillen', icon: 'i-simple-icons-x' },
]

// Astro build time stands in for the source site's git-log-based "last
// updated"/"last deployed" timestamps — this repo isn't a git repository.
export const buildDate = new Date()

export function formatDeployedAt(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Brussels',
  }).format(date)
}
