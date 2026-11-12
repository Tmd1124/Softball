import { useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { formatTempo } from '../data/workouts'
import type { ExerciseInfo, WorkoutItem } from '../data/workouts'
import FormBreakdown from './FormBreakdown'
import TempoCoach from './TempoCoach'
import { unlockAudio } from '../lib/audio'

interface Props {
  exercise: ExerciseInfo
  item?: WorkoutItem
  completedSets: number
  weight: number | null
  onSetsChange: (n: number) => void
  onWeightChange: (w: number | null) => void
  onRest: (label: string, seconds: number) => void
  onClose: () => void
}

type VideoState = 'loading' | 'ok' | 'failed'

export default function VideoPlayerModal({
  exercise,
  item,
  completedSets,
  weight,
  onSetsChange,
  onWeightChange,
  onRest,
  onClose,
}: Props) {
  const [video, setVideo] = useState<VideoState>('loading')
  const closeRef = useRef<HTMLButtonElement>(null)
  const src = `/softball/videos/${exercise.id}.mp4`

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const tapSet = (n: number) => {
    unlockAudio()
    if (!item) return
    if (n <= completedSets) {
      onSetsChange(n - 1)
      return
    }
    onSetsChange(n)
    if (n < item.sets) onRest(exercise.name, item.rest)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="sheet-backdrop absolute inset-0 bg-black/70"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={exercise.name}
        className="sheet-up relative flex max-h-[94dvh] w-full max-w-md flex-col rounded-t-3xl border-t border-slate-800 bg-slate-950"
      >
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-50">{exercise.name}</h2>
            {item && (
              <p className="mt-1 text-sm font-medium text-amber-400">
                {item.sets} × {item.reps}
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-slate-300 active:bg-slate-800"
          >
            <X size={22} aria-hidden />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-36 pt-4">
          {item && (
            <section aria-label="Set logger" className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Sets</p>
                <p className="text-xs text-slate-400">
                  {completedSets}/{item.sets} · {item.rest}s rest
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {Array.from({ length: item.sets }, (_, i) => i + 1).map((n) => {
                  const done = n <= completedSets
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => tapSet(n)}
                      aria-pressed={done}
                      aria-label={`Set ${n}${done ? ', done' : ''}`}
                      className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-lg font-bold transition-colors ${
                        done
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                          : 'border-slate-600 text-slate-200 active:border-amber-500'
                      }`}
                    >
                      {done ? <Check size={26} strokeWidth={3} aria-hidden /> : n}
                    </button>
                  )
                })}
              </div>
              <label className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-200">Weight used (lb)</span>
                <input
                  key={weight ?? 'none'}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={2000}
                  step="any"
                  defaultValue={weight ?? ''}
                  placeholder="e.g. 135"
                  onBlur={(e) => {
                    const raw = e.currentTarget.value.trim()
                    const n = raw === '' ? null : Number(raw)
                    if (n !== null && (!Number.isFinite(n) || n < 0 || n > 2000)) return
                    if (n !== weight) onWeightChange(n === null ? null : Math.round(n * 10) / 10)
                  }}
                  className="h-12 w-32 rounded-xl border border-slate-700 bg-slate-950 px-3 text-right text-lg font-semibold tabular-nums text-slate-50 placeholder:text-slate-600"
                />
              </label>
              <p className="mt-3 text-xs text-slate-500">
                Tap a set when finished. The rest timer starts automatically. Sets and weight are saved with the time you finish.
              </p>
            </section>
          )}

          <div
            className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 ${
              video === 'ok' ? 'mx-auto aspect-[9/16] max-h-[56dvh]' : ''
            }`}
          >
            {video !== 'ok' && <FormBreakdown exercise={exercise} />}
            {video !== 'failed' && (
              <video
                src={src}
                playsInline
                loop
                muted
                autoPlay
                controls
                preload="auto"
                onLoadedData={(e) => {
                  setVideo('ok')
                  void e.currentTarget.play().catch(() => undefined)
                }}
                onError={() => setVideo('failed')}
                className={
                  video === 'ok'
                    ? 'absolute inset-0 h-full w-full bg-black object-cover'
                    : 'pointer-events-none absolute h-px w-px opacity-0'
                }
              />
            )}
          </div>

          <section aria-label="Coaching focus" className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Catcher focus</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{exercise.focus}</p>
            <p className="mt-3 text-xs text-slate-400">
              Tempo: <span className="text-slate-200">{formatTempo(exercise.tempo)}</span>
            </p>
          </section>

          <TempoCoach tempo={exercise.tempo} />
        </div>
      </div>
    </div>
  )
}
