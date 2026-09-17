export const site = {
  url: 'https://vernaillen.dev',
  name: 'Wouter Vernaillen',
  jobTitle: 'Freelance Full Stack Developer',
  description: 'Freelance Full Stack Developer, specializing in Java, Spring, Nuxt & DevOps.',
  email: 'wouter@vernaillen.com',
  meetingLink: 'https://calendly.com/vernaillen/15min',
  // Availability pill in the home hero. `null` hides it; a label such as
  // 'Available for new projects from Q1 2027' renders it as a link to the
  // meeting page.
  availability: null as string | null,
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

// Build time doubles as the "last updated"/"last deployed" timestamp: the
// Docker build stage has no .git to read a commit date from.
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
