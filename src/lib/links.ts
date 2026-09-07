export interface NavLink {
  label: string
  href: string
  icon: string
  activePrefix?: string
}

export const navLinks: NavLink[] = [
  { label: 'Home', href: '/', icon: 'i-lucide-home' },
  { label: 'Projects', href: '/projects', icon: 'i-lucide-folder' },
  { label: 'Open Source', href: '/open-source', icon: 'i-simple-icons-github' },
  { label: 'Blog', href: '/blog', icon: 'i-lucide-file-text', activePrefix: '/blog' },
  { label: 'Career', href: '/career', icon: 'i-lucide-briefcase' },
  { label: 'About', href: '/about', icon: 'i-lucide-user' },
]

export function isNavLinkActive(link: NavLink, pathname: string): boolean {
  if (link.activePrefix) return pathname.startsWith(link.activePrefix)
  return pathname === link.href
}
