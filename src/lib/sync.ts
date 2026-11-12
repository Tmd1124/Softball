import { useSyncExternalStore } from 'react'
import { ApiError, api } from './api'
import { readJSON, writeJSON } from './storage'

export const SPORT = 'softball'

export interface Entry {
  sets: number
  weight: number | null
  completedAt: string | null
}

export interface ServerEntry extends Entry {
  dayId: string
  exerciseId: string
}

export type Op =
  | ({ action: 'log'; sport: string; date: string; dayId: string; exerciseId: string } & Entry)
  | { action: 'reset'; sport: string; date: string; dayId: string }

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'auth'

let userId = 0
let queue: Op[] = []
let status: SyncStatus = 'synced'
let flushing = false
let retryTimer: number | undefined
const listeners = new Set<() => void>()

const queueKey = () => `catcher.queue.v3.${userId}`

export const currentUserId = () => userId

function setStatus(s: SyncStatus) {
  if (s === status) return
  status = s
  listeners.forEach((l) => l())
}

function saveQueue() {
  writeJSON(queueKey(), queue)
}

export function initSync(id: number): void {
  if (id === userId) return
  userId = id
  queue = readJSON<Op[]>(queueKey(), [])
  status = queue.length ? 'pending' : 'synced'
}

export function pendingOps(): Op[] {
  return queue
}

export async function fetchEntries(date: string): Promise<ServerEntry[]> {
  await flush()
  return (await api<{ entries: ServerEntry[] }>(`activity.php?sport=${SPORT}&date=${encodeURIComponent(date)}`)).entries
}

export async function fetchDates(): Promise<{ date: string; completed: number }[]> {
  await flush()
  return (await api<{ dates: { date: string; completed: number }[] }>(`activity.php?sport=${SPORT}&dates=1`)).dates
}

export async function flush(): Promise<void> {
  if (flushing || userId === 0) return
  flushing = true
  window.clearTimeout(retryTimer)
  try {
    while (queue.length) {
      try {
        await api('activity.php', queue[0])
      } catch (e) {
        if (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 429 && e.status !== 401) {
          // The server will never accept this op (validation error); drop it so it cannot block the queue.
        } else {
          throw e
        }
      }
      queue = queue.slice(1)
      saveQueue()
    }
    setStatus('synced')
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      setStatus('auth')
    } else {
      setStatus('offline')
      retryTimer = window.setTimeout(() => void flush(), 15000)
    }
  } finally {
    flushing = false
  }
}

export function enqueue(op: Op): void {
  queue = queue.filter((q) => {
    if (op.action === 'log' && q.action === 'log')
      return !(q.date === op.date && q.dayId === op.dayId && q.exerciseId === op.exerciseId)
    if (op.action === 'reset' && q.action === 'log') return !(q.date === op.date && q.dayId === op.dayId)
    return true
  })
  queue.push(op)
  saveQueue()
  if (status === 'synced') setStatus('pending')
  void flush()
}

window.addEventListener('online', () => void flush())

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => status,
  )
}
