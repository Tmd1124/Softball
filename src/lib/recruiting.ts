import { useEffect, useState } from 'react'
import { api } from './api'
import { builtInSports, defaultSite, defaultSport } from '../data/recruitingData'
import type { RecruitingData, SiteData, SportConfig, SportData, StatItem } from '../data/recruitingData'

export interface Store {
  sports: SportConfig[]
  content: Record<string, SiteData | SportData | null>
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

export function mergeSport(cfg: SportConfig, sport: SportData | null): SportData {
  const base = defaultSport(cfg)
  const merged = { ...base, ...sport, label: cfg.label }
  if (!sport) return merged
  const legacy = sport as { team?: string; stats?: StatItem[] }
  let teams = (sport.teams ?? []).filter((t) => t.name).map((t) => ({ ...blankTeam, ...t }))
  if (!teams.length && legacy.team) teams = [{ ...blankTeam, name: legacy.team }]
  if (!teams.length && !sport.teams) teams = base.teams
  if (legacy.stats?.length && teams.length && !teams.some((t) => t.stats.length)) {
    const top = teams.reduce((m, t) => (yearNum(t) > yearNum(m) ? t : m), teams[0])
    teams = teams.map((t) => (t === top ? { ...t, stats: legacy.stats! } : t))
  }
  const { stats: _stats, ...rest } = merged as SportData & { stats?: StatItem[] }
  return { ...rest, teams }
}

export function merge(store: Store): RecruitingData {
  const sports: Record<string, SportData> = {}
  for (const cfg of store.sports) sports[cfg.id] = mergeSport(cfg, (store.content[cfg.id] as SportData | null) ?? null)
  return { ...mergeSite((store.content.site as SiteData | null) ?? null), sportList: store.sports, sports }
}

const fallback: Store = { sports: builtInSports, content: {} }

let pending: Promise<RecruitingData> | null = null

function load(): Promise<RecruitingData> {
  pending ??= api<Store>('recruiting.php')
    .then((r) => merge(r))
    .catch(() => merge(fallback))
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
