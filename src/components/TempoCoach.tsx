import { useEffect, useMemo, useState } from 'react'
import { Timer, Square } from 'lucide-react'
import { parseTempo } from '../data/workouts'
import { beep, chime, unlockAudio } from '../lib/audio'
import { useCountdown } from '../lib/countdown'

export default function TempoCoach({ tempo }: { tempo: string }) {
  const segs = useMemo(() => parseTempo(tempo), [tempo])
  const [idx, setIdx] = useState<number | null>(null)

  const cd = useCountdown(() => {
    setIdx((i) => {
      if (i === null) return null
      if (i + 1 >= segs.length) {
        chime()
        return null
      }
      return i + 1
    })
  })
  const { start, stop } = cd

  useEffect(() => {
    if (idx === null) {
      stop()
      return
    }
    start(segs[idx].seconds ?? 1)
    beep(idx === segs.length - 1 ? 1175 : 740, 110, 0.15)
  }, [idx, segs, start, stop])

  const seg = idx === null ? null : segs[idx]

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tempo coach</p>
          <p
            className="mt-1 text-2xl font-bold tabular-nums text-amber-400"
            aria-live="polite"
            aria-atomic="true"
          >
            {seg ? `${seg.label} ${cd.seconds}` : 'Ready'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            unlockAudio()
            setIdx(idx === null ? 0 : null)
          }}
          className="flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-slate-100 active:bg-slate-700"
        >
          {idx === null ? <Timer size={18} aria-hidden /> : <Square size={16} aria-hidden />}
          {idx === null ? 'Start rep' : 'Stop'}
        </button>
      </div>
    </div>
  )
}
