import { useEffect, useState } from 'react'
import { ApiError, api } from './api'
import { useAuth } from './auth'
import { getExercise } from '../data/workouts'

export type Sport = 'softball' | 'basketball'
export const SPORT_LABEL: Record<Sport, string> = { softball: 'Softball', basketball: 'Basketball' }

export interface SummaryEntry {
  dayId: string
  exerciseId: string
  sets: number
  weight: number | null
  completedAt: string | null
}

export interface SportSummary {
  completed: number
  days: number
  week: number
  lastAt: string | null
  bests: { exerciseId: string; weight: number }[]
  recent: SummaryEntry[]
}

export type SummaryState =
  | { state: 'loading' }
  | { state: 'signin' }
  | { state: 'error' }
  | { state: 'ok'; sports: Record<Sport, SportSummary> }

export function useSummary(): SummaryState {
  const { status, user } = useAuth()
  const [result, setResult] = useState<SummaryState>({ state: 'loading' })

  useEffect(() => {
    if (status === 'loading') return
    if (!user) {
      setResult({ state: 'signin' })
      return
    }
    let live = true
    setResult({ state: 'loading' })
    api<{ sports: Record<Sport, SportSummary> }>('activity.php?summary=1')
      .then((r) => live && setResult({ state: 'ok', sports: r.sports }))
      .catch((e) => live && setResult(e instanceof ApiError && e.status === 401 ? { state: 'signin' } : { state: 'error' }))
    return () => {
      live = false
    }
  }, [status, user])

  return result
}

export function exerciseName(id: string): string {
  try {
    return getExercise(id).name
  } catch {
    const words = id.replace(/-/g, ' ')
    return words.charAt(0).toUpperCase() + words.slice(1)
  }
}

export function utcToDate(utc: string): Date {
  return new Date(`${utc.replace(' ', 'T')}Z`)
}

export function fmtWhen(utc: string | null): string {
  if (!utc) return 'None yet'
  return utcToDate(utc).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function fmtLb(w: number): string {
  return `${Number.isInteger(w) ? w : w.toFixed(1)} lb`
}
