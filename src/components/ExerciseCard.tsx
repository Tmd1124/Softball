import { Check, Clock, PlayCircle } from 'lucide-react'
import { formatTempo, getExercise } from '../data/workouts'
import type { WorkoutItem } from '../data/workouts'

interface Props {
  item: WorkoutItem
  index: number
  completedSets: number
  onToggle: () => void
  onOpen: () => void
}

export default function ExerciseCard({ item, index, completedSets, onToggle, onOpen }: Props) {
  const ex = getExercise(item.id)
  const done = completedSets >= item.sets

  return (
    <li
      className={`rounded-2xl border p-4 transition-colors ${
        done ? 'border-emerald-500/40 bg-emerald-950/30' : 'border-slate-800 bg-slate-900'
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={onToggle}
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark ${ex.name} ${done ? 'incomplete' : 'complete'}`}
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 transition-colors ${
            done
              ? 'border-emerald-500 bg-emerald-500 text-slate-950'
              : 'border-slate-600 text-transparent active:border-amber-500'
          }`}
        >
          <Check size={30} strokeWidth={3} aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Exercise {index + 1}
          </p>
          <h3
            className={`text-lg font-bold leading-snug tracking-tight ${
              done ? 'text-slate-400 line-through decoration-slate-600' : 'text-slate-50'
            }`}
          >
            {ex.name}
          </h3>
          <p className="mt-0.5 text-base font-semibold text-amber-400">
            {item.sets} × {item.reps}
            {completedSets > 0 && !done && (
              <span className="ml-2 text-sm font-medium text-slate-400">
                ({completedSets}/{item.sets} sets)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
          {formatTempo(ex.tempo)}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
          <Clock size={12} aria-hidden /> {item.rest}s rest
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        <span className="font-semibold text-slate-100">Catcher focus: </span>
        {ex.focus}
      </p>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-bold text-slate-950 active:bg-amber-400"
      >
        <PlayCircle size={20} aria-hidden /> Watch Form Video &amp; Log Sets
      </button>
    </li>
  )
}
