import { useEffect, useMemo, useState } from 'react'
import { Check, Pause, Play, PlayCircle, SkipForward, Square } from 'lucide-react'
import { getExercise, mobilityRoutine } from '../data/workouts'
import { buzz, chime, tick, unlockAudio, beep } from '../lib/audio'
import { useCountdown } from '../lib/countdown'
import { usePersisted } from '../lib/storage'

const PREP_SECONDS = 10

interface Segment {
  kind: 'prep' | 'work'
  stepId: string
  label: string
  seconds: number
  lastSide: boolean
}

interface Props {
  onOpen: (id: string) => void
  isDone: (id: string) => boolean
  onDone: (id: string, on: boolean) => void
}

const RING_R = 88
const RING_C = 2 * Math.PI * RING_R

export default function MobilityChecklist({ onOpen, isDone, onDone }: Props) {
  const [postGame, setPostGame] = usePersisted<boolean>('catcher.mobility.postgame.v1', false)
  const [seg, setSeg] = useState<number | null>(null)

  const steps = useMemo(() => mobilityRoutine.filter((s) => postGame || !s.postGame), [postGame])

  const segments = useMemo<Segment[]>(
    () =>
      steps.flatMap((s) => {
        const name = getExercise(s.id).name
        const work = Array.from({ length: s.sides }, (_, side) => ({
          kind: 'work' as const,
          stepId: s.id,
          label: s.sides === 2 ? (side === 0 ? `${name} · Left side` : `${name} · Right side`) : name,
          seconds: s.seconds,
          lastSide: side === s.sides - 1,
        }))
        return [
          { kind: 'prep' as const, stepId: s.id, label: `Get ready: ${name}`, seconds: PREP_SECONDS, lastSide: false },
          ...work,
        ]
      }),
    [steps],
  )

  const markDone = onDone

  const cd = useCountdown(() => {
    if (seg === null) return
    const cur = segments[seg]
    if (cur.kind === 'work' && cur.lastSide) markDone(cur.stepId, true)
    if (seg + 1 >= segments.length) {
      chime()
      buzz([300, 120, 300])
      setSeg(null)
    } else {
      setSeg(seg + 1)
    }
  })
  const { start, stop } = cd

  useEffect(() => {
    if (seg === null) {
      stop()
      return
    }
    const cur = segments[seg]
    start(cur.seconds)
    if (cur.kind === 'work') {
      chime()
      buzz(120)
    } else {
      beep(520, 90, 0.1)
    }
  }, [seg, segments, start, stop])

  useEffect(() => {
    if (cd.running && cd.seconds > 0 && cd.seconds <= 3) tick()
  }, [cd.running, cd.seconds])

  const current = seg === null ? null : segments[seg]
  const totalSeconds = segments.reduce((n, s) => n + s.seconds, 0)
  const doneCount = steps.filter((s) => isDone(s.id)).length
  const paused = current !== null && !cd.running

  return (
    <div className="px-4 pb-32 pt-5 md:grid md:grid-cols-[24rem_minmax(0,1fr)] md:items-start md:gap-8 md:px-6">
      <div className="md:sticky md:top-32">
      <h1 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Daily mobility</h1>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">10-Min Pre-Practice Routine</h2>
      <p className="mt-1 text-sm text-slate-400">
        Run it before practice or games. About {Math.round(totalSeconds / 60)} min including transitions.
      </p>

      <section
        aria-label="Interval timer"
        className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5"
      >
        {current ? (
          <div className="flex flex-col items-center">
            <div className="relative h-52 w-52">
              <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="100" cy="100" r={RING_R} fill="none" strokeWidth="10" className="stroke-slate-800" />
                <circle
                  cx="100"
                  cy="100"
                  r={RING_R}
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * cd.fraction}
                  className={current.kind === 'work' ? 'stroke-amber-500' : 'stroke-sky-400'}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  role="timer"
                  aria-live="off"
                  className={`text-6xl font-bold tabular-nums ${
                    current.kind === 'work' ? 'text-amber-400' : 'text-sky-300'
                  }`}
                >
                  {cd.seconds}
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {current.kind === 'work' ? 'Work' : 'Get ready'}
                </span>
              </div>
            </div>
            <p className="mt-3 text-center text-lg font-bold leading-snug text-slate-50" aria-live="polite">
              {current.label}
            </p>
            <p className="text-xs text-slate-500">
              Segment {(seg ?? 0) + 1} of {segments.length}
            </p>
            <div className="mt-4 grid w-full grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => (paused ? cd.resume() : cd.pause())}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-bold text-slate-950 active:bg-amber-400"
              >
                {paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (seg !== null && current.kind === 'work' && current.lastSide) markDone(current.stepId, true)
                  setSeg(seg !== null && seg + 1 < segments.length ? seg + 1 : null)
                }}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-800 text-sm font-semibold text-slate-100 active:bg-slate-700"
              >
                <SkipForward size={18} aria-hidden /> Skip
              </button>
              <button
                type="button"
                onClick={() => setSeg(null)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-800 text-sm font-semibold text-slate-100 active:bg-slate-700"
              >
                <Square size={16} aria-hidden /> Stop
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-slate-400">
              {steps.length} movements · {steps[0] && getExercise(steps[0].id).name} first. A chime marks each
              interval and a short tick counts down the last three seconds.
            </p>
            <button
              type="button"
              onClick={() => {
                unlockAudio()
                setSeg(0)
              }}
              className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 text-base font-bold text-slate-950 active:bg-amber-400"
            >
              <Play size={20} aria-hidden /> Start Routine
            </button>
          </div>
        )}
      </section>

      <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-800 px-4 text-sm text-slate-300">
        <span>Include post-game shoulder stretch</span>
        <input
          type="checkbox"
          checked={postGame}
          onChange={(e) => {
            setSeg(null)
            setPostGame(e.target.checked)
          }}
          className="h-6 w-6 accent-amber-500"
        />
      </label>

      </div>

      <div>
      <div className="mt-6 md:mt-0 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Checklist</h3>
        <p className="text-sm font-semibold tabular-nums text-slate-300">
          {doneCount}/{steps.length} done
        </p>
      </div>

      <ul className="mt-3 space-y-3">
        {mobilityRoutine.map((s, i) => {
          const ex = getExercise(s.id)
          const isDone_ = isDone(s.id)
          const active = current?.stepId === s.id
          const skipped = s.postGame && !postGame
          return (
            <li
              key={s.id}
              className={`rounded-2xl border p-4 transition-colors ${
                active
                  ? 'border-amber-500/70 bg-amber-500/5'
                  : isDone_
                    ? 'border-emerald-500/40 bg-emerald-950/30'
                    : 'border-slate-800 bg-slate-900'
              } ${skipped ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone_}
                  aria-label={`Mark ${ex.name} ${isDone_ ? 'incomplete' : 'complete'}`}
                  onClick={() => markDone(s.id, !isDone_)}
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 transition-colors ${
                    isDone_
                      ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                      : 'border-slate-600 text-transparent active:border-amber-500'
                  }`}
                >
                  <Check size={30} strokeWidth={3} aria-hidden />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {i + 1}
                    {s.postGame ? ' · Post-game' : ''}
                  </p>
                  <h4 className="text-lg font-bold leading-snug tracking-tight text-slate-50">{ex.name}</h4>
                  <p className="mt-0.5 text-base font-semibold text-amber-400">
                    {s.reps} · {s.seconds}s per side
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{ex.focus}</p>
              <button
                type="button"
                onClick={() => onOpen(s.id)}
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 text-sm font-semibold text-slate-100 active:bg-slate-700"
              >
                <PlayCircle size={20} aria-hidden /> Watch Form Video
              </button>
            </li>
          )
        })}
      </ul>
      </div>
    </div>
  )
}
