import { useCallback, useEffect, useRef, useState } from 'react'
import { readJSON, todayKey, writeJSON } from './storage'
import { SPORT, currentUserId, enqueue, fetchEntries, flush, pendingOps } from './sync'
import type { Entry, Op, ServerEntry } from './sync'

export type Entries = Record<string, Record<string, Entry>>

interface Snapshot {
  date: string
  entries: Entries
}

const cacheKey = () => `catcher.cache.v3.${currentUserId()}`
export const MOBILITY_DAY = 'mobility'

export function utcNow(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export function utcToLocal(utc: string): Date {
  return new Date(`${utc.replace(' ', 'T')}Z`)
}

function applyOp(snap: Snapshot, op: Op): Snapshot {
  if (op.date !== snap.date) return snap
  if (op.action === 'reset') {
    const entries = { ...snap.entries }
    delete entries[op.dayId]
    return { ...snap, entries }
  }
  const { sets, weight, completedAt } = op
  return {
    ...snap,
    entries: { ...snap.entries, [op.dayId]: { ...snap.entries[op.dayId], [op.exerciseId]: { sets, weight, completedAt } } },
  }
}

function initial(): Snapshot {
  const date = todayKey()
  const cached = readJSON<Snapshot | null>(cacheKey(), null)
  const base: Snapshot = { date, entries: cached && cached.date === date ? cached.entries : {} }
  return pendingOps().reduce(applyOp, base)
}

export function groupEntries(list: ServerEntry[]): Entries {
  const out: Entries = {}
  for (const e of list) {
    out[e.dayId] = { ...out[e.dayId], [e.exerciseId]: { sets: e.sets, weight: e.weight, completedAt: e.completedAt } }
  }
  return out
}

export function useAthleteData() {
  const [snap, setSnap] = useState<Snapshot>(initial)
  const ref = useRef(snap)
  ref.current = snap

  useEffect(() => writeJSON(cacheKey(), snap), [snap])

  const load = useCallback(async () => {
    const date = todayKey()
    try {
      await flush()
      const remote = groupEntries(await fetchEntries(date))
      ref.current = pendingOps().reduce(applyOp, { date, entries: remote })
      setSnap(ref.current)
    } catch {
      setSnap((prev) => (prev.date === date ? prev : pendingOps().reduce(applyOp, { date, entries: {} })))
    }
  }, [])

  useEffect(() => {
    void load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const dispatch = useCallback((op: Op) => {
    const base = ref.current.date === op.date ? ref.current : { date: op.date, entries: {} }
    ref.current = applyOp(base, op)
    setSnap(ref.current)
    enqueue(op)
  }, [])

  const save = useCallback(
    (dayId: string, exerciseId: string, total: number, patch: Partial<Pick<Entry, 'sets' | 'weight'>>) => {
      const date = todayKey()
      const cur = ref.current.date === date ? ref.current.entries[dayId]?.[exerciseId] : undefined
      const sets = patch.sets ?? cur?.sets ?? 0
      const weight = patch.weight !== undefined ? patch.weight : (cur?.weight ?? null)
      const completedAt = sets >= total ? (cur?.completedAt ?? utcNow()) : null
      dispatch({ action: 'log', sport: SPORT, date, dayId, exerciseId, sets, weight, completedAt })
    },
    [dispatch],
  )

  const resetDay = useCallback(
    (dayId: string) => dispatch({ action: 'reset', sport: SPORT, date: todayKey(), dayId }),
    [dispatch],
  )

  const getEntry = useCallback((dayId: string, exerciseId: string) => snap.entries[dayId]?.[exerciseId], [snap.entries])
  const getSets = useCallback((dayId: string, exerciseId: string) => snap.entries[dayId]?.[exerciseId]?.sets ?? 0, [snap.entries])

  return { entries: snap.entries, getEntry, getSets, save, resetDay }
}
