import { useCallback, useEffect, useRef, useState } from 'react'

export interface Countdown {
  total: number
  seconds: number
  fraction: number
  running: boolean
  active: boolean
  start: (seconds: number) => void
  add: (seconds: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
}

export function useCountdown(onDone: () => void): Countdown {
  const [total, setTotal] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [running, setRunning] = useState(false)
  const [active, setActive] = useState(false)
  const endAt = useRef(0)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      const left = Math.max(0, endAt.current - Date.now())
      setRemainingMs(left)
      if (left === 0) {
        setRunning(false)
        done.current()
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [running])

  const start = useCallback((seconds: number) => {
    endAt.current = Date.now() + seconds * 1000
    setTotal(seconds)
    setRemainingMs(seconds * 1000)
    setActive(true)
    setRunning(true)
  }, [])

  const add = useCallback((seconds: number) => {
    endAt.current += seconds * 1000
    setTotal((t) => t + seconds)
    setRemainingMs((r) => r + seconds * 1000)
  }, [])

  const pause = useCallback(() => {
    setRemainingMs(Math.max(0, endAt.current - Date.now()))
    setRunning(false)
  }, [])

  const resume = useCallback(() => {
    endAt.current = Date.now() + remainingMs
    setRunning(true)
  }, [remainingMs])

  const stop = useCallback(() => {
    setRunning(false)
    setActive(false)
    setRemainingMs(0)
  }, [])

  return {
    total,
    seconds: Math.ceil(remainingMs / 1000),
    fraction: total > 0 ? 1 - remainingMs / (total * 1000) : 0,
    running,
    active,
    start,
    add,
    pause,
    resume,
    stop,
  }
}
