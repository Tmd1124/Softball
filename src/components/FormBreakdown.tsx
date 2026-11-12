import { useEffect, useState } from 'react'
import { phaseTitles, formatTempo } from '../data/workouts'
import type { ExerciseInfo } from '../data/workouts'
import { prefersReducedMotion } from '../lib/audio'

const STEP_MS = 3000

export default function FormBreakdown({ exercise }: { exercise: ExerciseInfo }) {
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(() => !prefersReducedMotion())
  const titles = phaseTitles[exercise.category]

  useEffect(() => {
    if (!auto) return
    const id = window.setInterval(() => setStep((s) => (s + 1) % 3), STEP_MS)
    return () => window.clearInterval(id)
  }, [auto])

  const pick = (i: number) => {
    setAuto(false)
    setStep(i)
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 to-slate-950 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        3-phase form breakdown
      </p>

      <ol className="mt-4 flex items-center gap-2" aria-label="Phases">
        {titles.map((t, i) => (
          <li key={t} className="flex flex-1 flex-col gap-2">
            <button
              type="button"
              onClick={() => pick(i)}
              aria-current={step === i ? 'step' : undefined}
              className="flex min-h-12 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold transition-colors aria-[current=step]:border-amber-500 aria-[current=step]:bg-amber-500/10 aria-[current=step]:text-amber-400"
            >
              <span className="text-lg font-bold leading-none tabular-nums">{i + 1}</span>
            </button>
            <div className="h-1 overflow-hidden rounded-full bg-slate-800">
              <div
                key={step === i && auto ? `run-${step}` : `idle-${i}-${step === i}`}
                className={`h-full rounded-full bg-amber-500 ${
                  step === i && auto ? 'phase-fill' : ''
                }`}
                style={{
                  width: step === i && auto ? undefined : step === i ? '100%' : step > i ? '100%' : '0%',
                  animationDuration: `${STEP_MS}ms`,
                }}
              />
            </div>
          </li>
        ))}
      </ol>

      <div key={step} className="phase-in mt-6 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
          Step {step + 1} of 3
        </p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">{titles[step]}</h3>
        <p className="mt-3 text-base leading-relaxed text-slate-300">{exercise.cues[step]}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <p className="text-xs font-medium text-slate-400">
          Tempo: <span className="text-slate-200">{formatTempo(exercise.tempo)}</span>
        </p>
        <button
          type="button"
          onClick={() => setAuto((a) => !a)}
          className="min-h-10 rounded-lg px-3 text-xs font-semibold text-slate-400 active:bg-slate-800"
        >
          {auto ? 'Pause' : 'Auto-play'}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-slate-600">Demo video not generated yet.</p>
    </div>
  )
}
