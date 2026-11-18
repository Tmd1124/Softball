import type { ScheduleEvent } from '../data/recruitingData'

const pad = (n: number | string) => String(n).padStart(2, '0')

export function formatDateInput(raw: string): string {
  if (/[a-z]/i.test(raw)) {
    const d = new Date(raw)
    return Number.isNaN(+d) ? raw.replace(/[a-z]/gi, '') : `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`
  }
  let m = ''
  let d = ''
  let y = ''
  let stage = 0
  let sep1 = false
  let sep2 = false
  for (const ch of raw) {
    if (/\d/.test(ch)) {
      if (stage === 0) {
        m += ch
        if (m.length === 2) stage = 1
      } else if (stage === 1) {
        d += ch
        if (d.length === 2) stage = 2
      } else if (y.length < 4) y += ch
    } else if (stage === 0 && m.length === 1) {
      m = `0${m}`
      stage = 1
      sep1 = true
    } else if (stage === 0 && m.length === 2) {
      stage = 1
      sep1 = true
    } else if (stage === 1 && d.length === 1) {
      d = `0${d}`
      stage = 2
      sep2 = true
    } else if (stage === 1 && d.length === 2) {
      stage = 2
      sep2 = true
    } else if (stage === 1 && m.length === 2 && d.length === 0) {
      sep1 = true
    } else if (stage === 2 && d.length === 2) {
      sep2 = true
    }
  }
  let out = m
  if (d.length > 0 || sep1) out += `/${d}`
  if (y.length > 0 || sep2) out += `/${y}`
  return out
}

export function parseDate(v: string): Date | null {
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]))
    return d.getMonth() === Number(m[1]) - 1 && d.getDate() === Number(m[2]) ? d : null
  }
  if (v === '' || /\[/.test(v)) return null
  const d = new Date(v)
  return Number.isNaN(+d) ? null : d
}

export const isFullDate = (v: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(v)

export function showDate(v: string): string {
  const d = parseDate(v)
  return d && !/\[/.test(v) ? `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}` : v
}

export function showTime(v: string | undefined): string {
  const m = (v ?? '').match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  if (!m) return ''
  const h = Number(m[1])
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`
}

export const mapLink = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`

export const hasAddress = (v: string) => v.trim() !== '' && !/\[/.test(v)

export const mapUrlOf = (e: ScheduleEvent) => (e.mapUrl && e.mapUrl !== '' ? e.mapUrl : hasAddress(e.location) ? mapLink(e.location) : '')

function stamp(e: ScheduleEvent): number | null {
  const d = parseDate(e.date)
  if (!d) return null
  const t = (e.time ?? '').match(/^(\d\d):(\d\d)$/)
  return d.getTime() + (t ? Number(t[1]) * 3600000 + Number(t[2]) * 60000 : 0)
}

export const NO_EVENTS = 'No events scheduled yet, check back.'

export const realEvents = (events: ScheduleEvent[]) => events.filter((e) => [e.date, e.event].some((v) => v.trim() !== '' && !v.includes('[')))

export function sortedEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  const dated = events.map((e, i) => ({ e, i, t: stamp(e) }))
  return [...dated.filter((x) => x.t !== null).sort((a, b) => a.t! - b.t! || a.i - b.i), ...dated.filter((x) => x.t === null)].map((x) => x.e)
}

export function nextEvents(events: ScheduleEvent[], count: number): ScheduleEvent[] {
  const today = new Date().setHours(0, 0, 0, 0)
  const sorted = sortedEvents(realEvents(events))
  const upcoming = sorted.filter((e) => {
    const t = stamp(e)
    return t === null || t >= today
  })
  return (upcoming.length ? upcoming : sorted).slice(0, count)
}
