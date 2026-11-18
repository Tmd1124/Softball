import type { SiteData, SportData } from '../data/recruitingData'
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
  { id: 'film', label: 'Film' },
  { id: 'summary', label: 'Summary & honors' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'contacts', label: 'Coaches & links' },
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

export function sportGaps(id: string, s: SportData): Result {
  const g = new Collector()
  g.check('bio', 'Positions', s.positions)
  if (id === 'softball') g.check('bio', 'Bats / throws', s.handedness)
  g.check('bio', 'Team', s.team)
  g.check('bio', 'Photo of Ever', hasRealPhoto(s) ? 'set' : '')
  s.metrics.forEach((m) => {
    g.check('bio', `${m.label} value`, m.value)
    g.check('bio', `${m.label} verified date`, m.verified)
  })
  g.check('film', 'Featured video link', s.featured.embedUrl)
  s.clips.forEach((c) => g.check('film', `${c.title} link`, c.embedUrl))
  s.schedule.forEach((e, i) => {
    g.check('schedule', `Event ${i + 1} date`, e.date)
    g.check('schedule', `Event ${i + 1} name`, e.event)
    g.check('schedule', `Event ${i + 1} location`, e.location)
    g.check('schedule', `Event ${i + 1} team`, e.team)
    g.check('schedule', `Event ${i + 1} ${s.scheduleColumns.info}`, e.info)
  })
  s.coaches.forEach((c) => {
    g.check('contacts', `${c.role}: name`, c.name)
    g.check('contacts', `${c.role}: phone`, c.phone)
    g.check('contacts', `${c.role}: email`, c.email)
  })
  return g.result
}
