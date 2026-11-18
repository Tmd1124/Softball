import type { SiteData, SportConfig, SportData } from '../data/recruitingData'
import { hasRealPhoto } from '../recruit/derive'

export interface Gap {
  step: string
  label: string
}

export interface Step {
  id: string
  label: string
}

export const SITE_STEPS: Step[] = [
  { id: 'athlete', label: 'Athlete' },
  { id: 'academics', label: 'Academics' },
  { id: 'contact', label: 'Contacts & social' },
]

export const SPORT_STEPS: Step[] = [
  { id: 'bio', label: 'Bio & metrics' },
  { id: 'teams', label: 'Teams & coaches' },
  { id: 'film', label: 'Film' },
  { id: 'summary', label: 'Summary & honors' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'contacts', label: 'Links & QR' },
]

const isPlaceholder = (v: string | undefined) => !v || v.trim() === '' || /\[|Month\/Year|\(000\) 000-0000|@example\.com/.test(v)

export interface Result {
  total: number
  gaps: Gap[]
}

class Collector {
  total = 0
  gaps: Gap[] = []
  check(step: string, label: string, v: string | undefined) {
    this.total++
    if (isPlaceholder(v)) this.gaps.push({ step, label })
  }
  get result(): Result {
    return { total: this.total, gaps: this.gaps }
  }
}

export function siteGaps(s: SiteData): Result {
  const g = new Collector()
  const a = s.athlete
  g.check('athlete', 'Name', a.name)
  g.check('athlete', 'School', a.school)
  g.check('athlete', 'City, state', a.location)
  g.check('athlete', 'Height', a.height)
  g.check('athlete', 'Jersey number', a.jersey)
  g.check('academics', 'GPA', s.academics.gpa)
  g.check('academics', 'Honors / advanced courses', s.academics.courses)
  const c = s.contact
  g.check('contact', 'Recruiting email', c.email)
  g.check('contact', 'Recruiting phone', c.phone)
  g.check('contact', 'Parent name', c.parent.name)
  g.check('contact', 'Parent email', c.parent.email)
  g.check('contact', 'Parent phone', c.parent.phone)
  g.check('contact', 'X / Twitter handle', c.social.x.handle)
  g.check('contact', 'Instagram handle', c.social.instagram.handle)
  return g.result
}

export function sportGaps(cfg: SportConfig, s: SportData): Result {
  const g = new Collector()
  g.check('bio', cfg.positionLabel, s.positions)
  if (cfg.handedness) g.check('bio', 'Bats / throws', s.handedness)
  g.check('bio', 'Photo of Ever', hasRealPhoto(s) ? 'set' : '')
  s.metrics.forEach((m) => {
    g.check('bio', `${m.label} value`, m.value)
    g.check('bio', `${m.label} verified date`, m.verified)
  })
  g.check('film', 'Featured video link', s.featured.embedUrl || s.featured.videoUrl)
  s.clips.forEach((c) => g.check('film', `${c.title} link`, c.embedUrl || c.videoUrl))
  s.schedule.forEach((e, i) => {
    g.check('schedule', `Event ${i + 1} date`, e.date)
    g.check('schedule', `Event ${i + 1} name`, e.event)
    g.check('schedule', `Event ${i + 1} location`, e.location)
    g.check('schedule', `Event ${i + 1} team`, e.team)
    g.check('schedule', `Event ${i + 1} ${s.scheduleColumns.info}`, e.info)
  })
  s.teams.forEach((t, i) => {
    const n = `Team ${i + 1}`
    g.check('teams', `${n} name`, t.name)
    g.check('teams', `${n} year`, t.year)
    g.check('teams', `${n} type`, t.type)
    g.check('teams', `${n} coach`, t.coach)
    if (t.type === 'Travel / AAU') g.check('teams', `${n} owner`, t.owner)
    g.check('teams', `${n} phone`, t.phone)
    g.check('teams', `${n} email`, t.email)
  })
  s.trainers.forEach((t, i) => {
    g.check('teams', `Trainer ${i + 1} name`, t.name)
    g.check('teams', `Trainer ${i + 1} phone`, t.phone)
    g.check('teams', `Trainer ${i + 1} email`, t.email)
  })
  return g.result
}
