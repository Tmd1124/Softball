import { useEffect, useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { days, getExercise, mobilityRoutine } from '../data/workouts'
import { groupEntries, MOBILITY_DAY, utcToLocal } from '../lib/data'
import type { Entries } from '../lib/data'
import { todayKey } from '../lib/storage'
import { fetchDates, fetchEntries } from '../lib/sync'

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ok'; entries: Entries }

const fmtDate = (key: string) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

const fmtShort = (key: string) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

const fmtTime = (utc: string) =>
  utcToLocal(utc).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

const fmtWeight = (w: number) => `${Number.isInteger(w) ? w : w.toFixed(1)} lb`

interface Row {
  id: string
  name: string
  sets: number
  prescribedSets: number
  weight: number | null
  completedAt: string | null
  mobility: boolean
}

function buildGroups(entries: Entries) {
  const out: { id: string; title: string; rows: Row[] }[] = []
  const order = [...days.map((d) => d.id), MOBILITY_DAY]
  const extra = Object.keys(entries).filter((id) => !order.includes(id))
  for (const dayId of [...order, ...extra]) {
    const dayEntries = entries[dayId]
    if (!dayEntries) continue
    const day = days.find((d) => d.id === dayId)
    const known = day ? day.items.map((i) => i.id) : mobilityRoutine.map((m) => m.id)
    const ids = [
      ...known.filter((id) => dayEntries[id]),
      ...Object.keys(dayEntries).filter((id) => !known.includes(id)),
    ]
    const rows = ids.map((id): Row => {
      const e = dayEntries[id]
      let name = id
      try {
        name = getExercise(id).name
      } catch {
        // Exercise removed from the program; keep the raw id so old logs still show.
      }
      return {
        id,
        name,
        sets: e.sets,
        prescribedSets: day?.items.find((i) => i.id === id)?.sets ?? e.sets,
        weight: e.weight,
        completedAt: e.completedAt,
        mobility: dayId === MOBILITY_DAY,
      }
    })
    out.push({ id: dayId, title: day ? day.pill : dayId === MOBILITY_DAY ? 'Daily Mobility' : dayId, rows })
  }
  return out
}

export default function HistoryView({ entries: todayEntries }: { entries: Entries }) {
  const today = todayKey()
  const [date, setDate] = useState(today)
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [recent, setRecent] = useState<{ date: string; completed: number }[]>([])

  useEffect(() => {
    let live = true
    fetchDates()
      .then((d) => live && setRecent(d.slice(0, 14)))
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (date === today) return
    let live = true
    setLoad({ state: 'loading' })
    fetchEntries(date)
      .then((list) => live && setLoad({ state: 'ok', entries: groupEntries(list) }))
      .catch(() => live && setLoad({ state: 'error' }))
    return () => {
      live = false
    }
  }, [date, today])

  const view: Load = date === today ? { state: 'ok', entries: todayEntries } : load
  const groups = view.state === 'ok' ? buildGroups(view.entries) : []
  const rows = groups.flatMap((g) => g.rows)
  const completed = rows.filter((r) => r.completedAt).length

  return (
    <div className="px-4 pb-32 pt-5">
      <h1 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">History</h1>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">What I Did</h2>

      <label className="mt-4 block">
        <span className="text-sm font-semibold text-slate-300">Pick a date</span>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="mt-1 block h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-base font-semibold text-slate-50 [color-scheme:dark]"
        />
      </label>

      {recent.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {recent.map((r) => (
            <button
              key={r.date}
              type="button"
              onClick={() => setDate(r.date)}
              aria-pressed={r.date === date}
              className={`min-h-12 shrink-0 rounded-full border px-4 text-sm font-semibold ${
                r.date === date
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                  : 'border-slate-700 text-slate-300 active:bg-slate-800'
              }`}
            >
              {fmtShort(r.date)} · {r.completed}
            </button>
          ))}
        </div>
      )}

      <p className="mt-5 text-lg font-bold text-slate-100">{fmtDate(date)}</p>

      {view.state === 'loading' && <p className="mt-3 text-sm text-slate-400">Loading…</p>}
      {view.state === 'error' && (
        <p role="alert" className="mt-3 rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200">
          Couldn&apos;t load this date from the server. Check your connection and try again.
        </p>
      )}
      {view.state === 'ok' && rows.length === 0 && <p className="mt-3 text-sm text-slate-400">Nothing logged on this date.</p>}
      {view.state === 'ok' && rows.length > 0 && (
        <p className="mt-1 text-sm text-slate-400">
          {completed} of {rows.length} logged exercises completed
        </p>
      )}

      <div className="mt-4 space-y-5">
        {groups.map((g) => (
          <section key={g.id} aria-label={g.title}>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">{g.title}</h3>
            <ul className="mt-2 space-y-2">
              {g.rows.map((r) => (
                <li key={r.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-start gap-3">
                    {r.completedAt ? (
                      <CheckCircle2 size={24} className="mt-0.5 shrink-0 text-emerald-500" aria-label="Completed" />
                    ) : (
                      <Circle size={24} className="mt-0.5 shrink-0 text-slate-600" aria-label="Not completed" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-snug text-slate-50">{r.name}</p>
                      <p className="mt-0.5 text-sm text-slate-400">
                        {r.mobility ? 'Mobility routine' : `${r.sets}/${r.prescribedSets} sets`}
                        {r.completedAt ? ` · done at ${fmtTime(r.completedAt)}` : ' · not completed'}
                      </p>
                    </div>
                    {!r.mobility && (
                      <p
                        className={`shrink-0 text-right text-lg font-bold tabular-nums ${
                          r.weight === null ? 'text-slate-600' : 'text-amber-400'
                        }`}
                      >
                        {r.weight === null ? '—' : fmtWeight(r.weight)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
