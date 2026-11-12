import { useEffect } from 'react'
import { Plus, SkipForward } from 'lucide-react'
import { useCountdown } from '../lib/countdown'
import { buzz, chime, tick } from '../lib/audio'

export interface RestRequest {
  id: number
  label: string
  seconds: number
}

interface Props {
  request: RestRequest | null
  onDismiss: () => void
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function RestTimerBar({ request, onDismiss }: Props) {
  const cd = useCountdown(() => {
    chime()
    buzz([200, 100, 200])
  })
  const { start, stop } = cd

  useEffect(() => {
    if (request) start(request.seconds)
    else stop()
  }, [request, start, stop])

  const finished = cd.active && !cd.running && cd.seconds === 0

  useEffect(() => {
    if (cd.running && cd.seconds > 0 && cd.seconds <= 3) tick()
  }, [cd.running, cd.seconds])

  useEffect(() => {
    if (!finished) return
    const id = window.setTimeout(onDismiss, 6000)
    return () => window.clearTimeout(id)
  }, [finished, onDismiss])

  if (!request || !cd.active) return null

  return (
    <div
      role="timer"
      aria-live="off"
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md px-3 pb-2"
    >
      <div
        className={`overflow-hidden rounded-2xl border shadow-2xl shadow-black/60 backdrop-blur ${
          finished ? 'border-emerald-500/60 bg-emerald-950/95' : 'border-amber-500/40 bg-slate-900/95'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium uppercase tracking-widest text-slate-400">
              {finished ? 'Rest over' : 'Rest'} · {request.label}
            </p>
            <p
              className={`text-3xl font-bold tabular-nums leading-tight ${
                finished ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {finished ? 'Go!' : mmss(cd.seconds)}
            </p>
          </div>
          {!finished && (
            <button
              type="button"
              onClick={() => cd.add(15)}
              className="flex min-h-12 min-w-12 items-center justify-center gap-1 rounded-xl bg-slate-800 px-3 text-sm font-semibold text-slate-200 active:bg-slate-700"
              aria-label="Add 15 seconds"
            >
              <Plus size={16} aria-hidden /> 15s
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="flex min-h-12 min-w-12 items-center justify-center gap-1 rounded-xl bg-slate-800 px-3 text-sm font-semibold text-slate-200 active:bg-slate-700"
            aria-label={finished ? 'Dismiss' : 'Skip rest'}
          >
            <SkipForward size={16} aria-hidden /> {finished ? 'Close' : 'Skip'}
          </button>
        </div>
        <div className="h-1.5 bg-slate-800">
          <div
            className={`h-full ${finished ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${finished ? 100 : cd.fraction * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
