import snapshot from '../data/github-contributions.json'

export interface GitHubProject {
  repo: string
  description: string
  stars: number
  url: string
  pr?: string
}

const AUTHORED_GROUPS = [
  { owner: 'wpnuxt', title: 'WPNuxt' },
  { owner: 'harmonics-audio', title: 'Harmonics Audio' },
  { owner: 'vernaillen', title: 'Vernaillen' },
]

// Repos to hide from the Open Source section (meta repos, profiles, etc.)
const HIDDEN_REPOS = new Set([
  'vernaillen/vernaillen',
  'vernaillen/.github',
  'vernaillen/vernaillen.github.io',
  'vernaillen/renovate-config',
  'vernaillen/roon-extension-test',
  'vernaillen/woonuxt-wpnuxt-test',
  'vernaillen/vue-typescript-tonejs-test',
  'vernaillen/vernaillen.dev.old',
  'vernaillen/vernaillen-website',
  'wpnuxt/.github',
  'harmonics-audio/.github',
])

// GitHub orgs where the user is the sole/primary maintainer. Public, non-fork
// repos in these orgs are treated as "authored" instead of "contributed".
const MAINTAINED_ORGS = ['wpnuxt', 'harmonics-audio']

interface RepoNode {
  nameWithOwner: string
  description: string | null
  stargazerCount: number
  url: string
  isFork: boolean
  pushedAt: string
}

async function ghRest(path: string, token: string, params?: Record<string, string>) {
  const url = new URL(`https://api.github.com${path}`)
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, value)
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) throw new Error(`GitHub REST request failed: ${res.status} ${path}`)
  return res.json()
}

async function ghGraphql<T>(query: string, token: string): Promise<T> {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`GitHub GraphQL request failed: ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(`GitHub GraphQL error: ${json.errors[0]?.message ?? 'unknown'}`)
  return json.data as T
}

async function fetchLiveContributions(token: string): Promise<{ authored: GitHubProject[]; contributed: GitHubProject[] }> {
  const user = await ghRest('/user', token)
  const username = user.login as string

  const ownedOwners = new Set([username.toLowerCase(), ...MAINTAINED_ORGS.map((o) => o.toLowerCase())])
  const isOwnedRepo = (nameWithOwner: string) => {
    const owner = nameWithOwner.split('/')[0]?.toLowerCase()
    return !!owner && ownedOwners.has(owner)
  }

  const contributedTo = await ghGraphql<{
    user: { repositoriesContributedTo: { nodes: Array<{ nameWithOwner: string; description: string | null; stargazerCount: number; url: string } | null> } }
  }>(
    `{
      user(login: "${username}") {
        repositoriesContributedTo(first: 100, contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, PULL_REQUEST_REVIEW]) {
          nodes { nameWithOwner description stargazerCount url }
        }
      }
    }`,
    token,
  )

  const ownRepos = await ghGraphql<{ user: { repositories: { nodes: RepoNode[] } } }>(
    `{
      user(login: "${username}") {
        repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: PUSHED_AT, direction: DESC}, privacy: PUBLIC, isFork: false) {
          nodes { nameWithOwner description stargazerCount url isFork pushedAt }
        }
      }
    }`,
    token,
  )

  const orgRepoNodes: RepoNode[] = []
  for (const org of MAINTAINED_ORGS) {
    try {
      const orgData = await ghGraphql<{ organization: { repositories: { nodes: RepoNode[] } } | null }>(
        `{
          organization(login: "${org}") {
            repositories(first: 100, orderBy: {field: PUSHED_AT, direction: DESC}, privacy: PUBLIC, isFork: false) {
              nodes { nameWithOwner description stargazerCount url isFork pushedAt }
            }
          }
        }`,
        token,
      )
      if (orgData.organization) orgRepoNodes.push(...orgData.organization.repositories.nodes)
    } catch (error) {
      console.warn(`[github] failed to fetch repos for org "${org}": ${(error as Error).message}`)
    }
  }

  // GitHub search qualifiers are space-separated; joining with a literal space
  // (not `+`) and letting encodeURIComponent handle the query string keeps the
  // qualifiers intact instead of fusing them into one malformed token.
  const excludedUsers = [...ownedOwners].map((u) => `-user:${u}`).join(' ')
  const prData = await ghRest('/search/issues', token, {
    q: `type:pr author:${username} ${excludedUsers}`,
    per_page: '100',
    page: '1',
  })

  const filteredPrs = (prData.items as Array<{ pull_request?: { merged_at?: string }; state: string; repository_url: string; title: string; html_url: string }>)
    .filter((pr) => pr.pull_request?.merged_at || pr.state === 'open')

  const prMap = new Map<string, { title: string; url: string; merged: boolean }>()
  for (const pr of filteredPrs) {
    const [owner, name] = pr.repository_url.split('/').slice(-2)
    const repo = `${owner}/${name}`
    const existing = prMap.get(repo)
    const merged = !!pr.pull_request?.merged_at
    if (!existing || (merged && !existing.merged)) {
      prMap.set(repo, { title: pr.title, url: pr.html_url, merged })
    }
  }

  const contributed: GitHubProject[] = contributedTo.user.repositoriesContributedTo.nodes
    .filter((node): node is NonNullable<typeof node> => node !== null)
    .filter((node) => !isOwnedRepo(node.nameWithOwner))
    .map((node) => {
      const pr = prMap.get(node.nameWithOwner)
      return {
        repo: node.nameWithOwner,
        description: pr?.title || node.description || '',
        stars: node.stargazerCount,
        url: node.url,
        pr: pr?.url,
      }
    })

  const contributedRepos = new Set(contributed.map((c) => c.repo))
  for (const [repo, pr] of prMap) {
    if (contributedRepos.has(repo) || isOwnedRepo(repo)) continue
    const [owner, name] = repo.split('/')
    try {
      const repoData = await ghRest(`/repos/${owner}/${name}`, token)
      contributed.push({ repo, description: pr.title, stars: repoData.stargazers_count, url: `https://github.com/${repo}`, pr: pr.url })
    } catch {
      contributed.push({ repo, description: pr.title, stars: 0, url: `https://github.com/${repo}`, pr: pr.url })
    }
  }
  contributed.sort((a, b) => b.stars - a.stars)

  const authored: GitHubProject[] = [...ownRepos.user.repositories.nodes, ...orgRepoNodes]
    .filter((node) => !HIDDEN_REPOS.has(node.nameWithOwner))
    .sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime())
    .map((node) => ({ repo: node.nameWithOwner, description: node.description || '', stars: node.stargazerCount, url: node.url }))

  return { authored, contributed }
}

interface Contributions {
  authored: GitHubProject[]
  contributed: GitHubProject[]
  // Set when the data comes from the committed snapshot instead of the API.
  snapshotDate?: string
}

async function loadContributions(): Promise<Contributions> {
  const token = process.env.GITHUB_TOKEN
  const fallback: Contributions = { ...snapshot, snapshotDate: snapshot.fetchedAt }
  if (!token) return fallback
  try {
    const data = await fetchLiveContributions(token)
    if (!data.authored.length) throw new Error('live fetch returned 0 authored repos')
    return data
  } catch (error) {
    console.warn(`[github] live fetch failed, falling back to snapshot: ${(error as Error).message}`)
    return fallback
  }
}

const contributions = await loadContributions()

export const authoredProjects = contributions.authored
export const contributedProjects = contributions.contributed
export const snapshotDate = contributions.snapshotDate

export const authoredGroups = AUTHORED_GROUPS.map((group) => ({
  ...group,
  projects: authoredProjects.filter((project) => project.repo.startsWith(`${group.owner}/`)),
})).filter((group) => group.projects.length)
