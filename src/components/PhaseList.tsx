import { formatTempo, phaseTitlesFor } from '../data/workouts'
import type { ExerciseInfo } from '../data/workouts'

export default function PhaseList({ exercise }: { exercise: ExerciseInfo }) {
  const titles = phaseTitlesFor(exercise)
  return (
    <section aria-label="3-phase breakdown" className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">3-phase breakdown</p>
      <ol className="mt-3 space-y-3">
        {titles.map((title, i) => (
          <li key={title} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-extrabold text-slate-950">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-bold leading-snug text-slate-50">{title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{exercise.cues[i]}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-slate-400">
        Tempo: <span className="text-slate-200">{formatTempo(exercise.tempo)}</span>
      </p>
    </section>
  )
}
