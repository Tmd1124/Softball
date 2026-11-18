import type { RecruitingData, SportData } from '../data/recruitingData'

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
