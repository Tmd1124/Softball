import type { RecruitingData, SportData, TeamItem } from '../data/recruitingData'

export function summaryText(sport: SportData) {
  const pop = sport.metrics.find((m) => m.key === 'popTime')?.value ?? ''
  return sport.summary.replace('{popTime}', pop)
}

export const hasRealPhoto = (s: SportData) => s.photo !== '' && !s.photo.startsWith('/img/hero-')

export function academicExtras(d: Pick<RecruitingData, 'academics'>): string {
  const a = d.academics
  return [a.classRank && `Class rank ${a.classRank}`, a.sat && `SAT ${a.sat}`, a.act && `ACT ${a.act}`, a.ncaaId && `NCAA ID ${a.ncaaId}`].filter(Boolean).join(' · ')
}

export function bodyLine(d: Pick<RecruitingData, 'athlete'>): string {
  return [d.athlete.height, d.athlete.weight].filter(Boolean).join(', ')
}

const yearOf = (t: TeamItem) => parseInt(t.year, 10) || 0

export const teamsNewestFirst = (s: SportData): TeamItem[] => [...s.teams].sort((a, b) => yearOf(b) - yearOf(a))

export const currentTeam = (s: SportData) => teamsNewestFirst(s)[0]?.name ?? ''

export interface RankedTeam {
  team: TeamItem
  n: number
  current: boolean
}

export function rankedTeams(s: SportData): RankedTeam[] {
  const list = s.teams
    .map((team, n) => ({ team, n }))
    .filter((x) => x.team.name)
    .sort((a, b) => yearOf(b.team) - yearOf(a.team))
  const top = list[0] ? yearOf(list[0].team) : 0
  return list.map((x) => ({ ...x, current: yearOf(x.team) === top }))
}

export const currentStats = (s: SportData) => rankedTeams(s)[0]?.team.stats ?? []
