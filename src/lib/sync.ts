import { useSyncExternalStore } from 'react'
import { readJSON, writeJSON } from './storage'

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
  | ({ action: 'log'; date: string; dayId: string; exerciseId: string } & Entry)
  | { action: 'reset'; date: string; dayId: string }

export type SyncStatus = 'synced' | 'pending' | 'offline'

const KEY_STORAGE = 'catcher.athlete.v1'
const QUEUE_STORAGE = 'catcher.queue.v1'
const API = `${import.meta.env.BASE_URL}api/index.php`

export function athleteKey(): string {
  let key = readJSON<string>(KEY_STORAGE, '')
  if (!/^[a-f0-9]{32}$/.test(key)) {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    writeJSON(KEY_STORAGE, key)
  }
  return key
}

let queue: Op[] = readJSON<Op[]>(QUEUE_STORAGE, [])
let status: SyncStatus = queue.length ? 'pending' : 'synced'
let flushing = false
let retryTimer: number | undefined
const listeners = new Set<() => void>()

function setStatus(s: SyncStatus) {
  if (s === status) return
  status = s
  listeners.forEach((l) => l())
}

function saveQueue() {
  writeJSON(QUEUE_STORAGE, queue)
}

export function pendingOps(): Op[] {
  return queue
}

async function get<T>(query: string): Promise<T> {
  const res = await fetch(`${API}?${query}`, {
    headers: { 'X-Athlete-Key': athleteKey() },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`GET ${res.status}`)
  return (await res.json()) as T
}

export async function fetchEntries(date: string): Promise<ServerEntry[]> {
  await flush()
  return (await get<{ entries: ServerEntry[] }>(`date=${encodeURIComponent(date)}`)).entries
}

export async function fetchDates(): Promise<{ date: string; completed: number }[]> {
  await flush()
  return (await get<{ dates: { date: string; completed: number }[] }>('dates=1')).dates
}

async function post(op: Op): Promise<void> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'X-Athlete-Key': athleteKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify(op),
  })
  if (res.ok) return
  if (res.status >= 400 && res.status < 500 && res.status !== 429) return
  throw new Error(`post ${res.status}`)
}

export async function flush(): Promise<void> {
  if (flushing) return
  flushing = true
  window.clearTimeout(retryTimer)
  try {
    while (queue.length) {
      await post(queue[0])
      queue = queue.slice(1)
      saveQueue()
    }
    setStatus('synced')
  } catch {
    setStatus('offline')
    retryTimer = window.setTimeout(() => void flush(), 15000)
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
