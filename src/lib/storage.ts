import { useEffect, useState } from 'react'

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable (private mode / quota): progress just won't persist.
  }
}

export function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readJSON(key, initial))
  useEffect(() => writeJSON(key, value), [key, value])
  return [value, setValue] as const
}

export function todayKey(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
