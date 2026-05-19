export type ReleasePhase = { title: string; bullets: string[] }
export type ReleaseEntry = { version: string; date: string; phases: ReleasePhase[] }

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((x) => Number(x))
  const pb = b.split('.').map((x) => Number(x))
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const av = pa[i] ?? 0
    const bv = pb[i] ?? 0
    if (av > bv) return 1
    if (av < bv) return -1
  }
  return 0
}

export function sortReleasesByVersion<T extends { version: string }>(releases: T[]): T[] {
  return [...releases].sort((a, b) => compareVersions(b.version, a.version))
}

export function parseReleaseHistory(raw: unknown): ReleaseEntry[] {
  if (!Array.isArray(raw)) return []
  const mapped = raw
    .map((r) => {
      if (!r || typeof r !== 'object') return null
      const row = r as { version?: unknown; date?: unknown; phases?: unknown }
      const version = String(row.version ?? '').trim()
      if (!version) return null
      const date = String(row.date ?? '').trim()
      const phases = Array.isArray(row.phases)
        ? row.phases
            .map((p) => {
              if (!p || typeof p !== 'object') return null
              const phase = p as { title?: unknown; bullets?: unknown }
              const title = String(phase.title ?? '').trim()
              if (!title) return null
              const bullets = Array.isArray(phase.bullets) ? phase.bullets.map((b) => String(b)).filter(Boolean) : []
              return { title, bullets }
            })
            .filter((p): p is ReleasePhase => Boolean(p))
        : []
      return { version, date, phases }
    })
    .filter((x): x is ReleaseEntry => Boolean(x))

  return sortReleasesByVersion(mapped)
}
