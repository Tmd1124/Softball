import { useEffect, useState } from 'react'
import { api } from './api'
import { defaultSite, defaultSports } from '../data/recruitingData'
import type { RecruitingData, SiteData, SportData, SportId, StatItem } from '../data/recruitingData'

export interface StoredContent {
  site: SiteData | null
  softball: SportData | null
  basketball: SportData | null
}

export function mergeSite(site: SiteData | null): SiteData {
  return {
    ...defaultSite,
    ...site,
    athlete: { ...defaultSite.athlete, ...site?.athlete },
    academics: { ...defaultSite.academics, ...site?.academics },
  }
}

const blankTeam = { year: '', name: '', type: '', coach: '', owner: '', phone: '', email: '', stats: [] }

const yearNum = (t: { year: string }) => parseInt(t.year, 10) || 0

export function mergeSport(id: SportId, sport: SportData | null): SportData {
  const merged = { ...defaultSports[id], ...sport }
  if (!sport) return merged
  const legacy = sport as { team?: string; stats?: StatItem[] }
  let teams = (sport.teams ?? []).filter((t) => t.name).map((t) => ({ ...blankTeam, ...t }))
  if (!teams.length && legacy.team) teams = [{ ...blankTeam, name: legacy.team }]
  if (!teams.length && !sport.teams) teams = defaultSports[id].teams
  if (legacy.stats?.length && teams.length && !teams.some((t) => t.stats.length)) {
    const top = teams.reduce((m, t) => (yearNum(t) > yearNum(m) ? t : m), teams[0])
    teams = teams.map((t) => (t === top ? { ...t, stats: legacy.stats! } : t))
  }
  const { stats: _stats, ...rest } = merged as SportData & { stats?: StatItem[] }
  return { ...rest, teams }
}

export function merge(c: StoredContent): RecruitingData {
  return { ...mergeSite(c.site), softball: mergeSport('softball', c.softball), basketball: mergeSport('basketball', c.basketball) }
}

export const sectionOf = (c: StoredContent, id: 'site' | SportId) => c[id]

let pending: Promise<RecruitingData> | null = null

function load(): Promise<RecruitingData> {
  pending ??= api<{ content: StoredContent }>('recruiting.php')
    .then((r) => merge(r.content))
    .catch(() => merge({ site: null, softball: null, basketball: null }))
  return pending
}

export function useRecruiting(): RecruitingData | null {
  const [data, setData] = useState<RecruitingData | null>(null)
  useEffect(() => {
    let live = true
    void load().then((d) => live && setData(d))
    return () => {
      live = false
    }
  }, [])
  return data
}
