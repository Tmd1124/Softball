import { RotateCcw } from 'lucide-react'
import { PROGRAM_LABEL, PROGRAM_SUBTITLE, days } from '../data/workouts'
import type { Program, WorkoutDay, WorkoutItem } from '../data/workouts'
import ExerciseCard from './ExerciseCard'

interface Props {
  program: Program
  day: WorkoutDay
  getSets: (dayId: string, exerciseId: string) => number
  onProgram: (p: Program) => void
  onDay: (id: string) => void
  onToggle: (item: WorkoutItem) => void
  onOpen: (item: WorkoutItem) => void
  onReset: () => void
}

export default function DaySchedule({
  program,
  day,
  getSets,
  onProgram,
  onDay,
  onToggle,
  onOpen,
  onReset,
}: Props) {
  const programDays = days.filter((d) => d.program === program)
  const doneCount = day.items.filter((i) => getSets(day.id, i.id) >= i.sets).length
  const pct = Math.round((doneCount / day.items.length) * 100)
  const anyProgress = day.items.some((i) => getSets(day.id, i.id) > 0)

  return (
    <div>
      <div className="px-4 pt-5">
        <h1 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Catcher Strength &amp; Mobility
        </h1>
        <div
          role="radiogroup"
          aria-label="Program"
          className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-slate-900 p-1"
        >
          {(['off', 'in'] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={program === p}
              onClick={() => onProgram(p)}
              className={`min-h-12 rounded-xl px-2 text-center leading-tight transition-colors ${
                program === p ? 'bg-amber-500 text-slate-950' : 'text-slate-400 active:bg-slate-800'
              }`}
            >
              <span className="block text-sm font-bold">{PROGRAM_LABEL[p]}</span>
              <span className="block text-[11px] font-medium opacity-80">{PROGRAM_SUBTITLE[p]}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Workout day"
        className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {programDays.map((d) => {
          const on = d.id === day.id
          return (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onDay(d.id)}
              className={`min-h-12 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors ${
                on
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                  : 'border-slate-700 text-slate-300 active:bg-slate-800'
              }`}
            >
              {d.pill}
            </button>
          )
        })}
      </div>

      <section className="px-4 pt-5" aria-label="Day progress">
        <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-50">{day.title}</h2>
        <div className="mt-4 flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={day.items.length}
            aria-valuenow={doneCount}
            aria-label="Exercises completed"
            className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-300">
            {doneCount}/{day.items.length} done
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {doneCount === day.items.length ? 'Session complete. Great work.' : 'Progress resets each new day.'}
          </p>
          <button
            type="button"
            onClick={onReset}
            disabled={!anyProgress}
            className="flex min-h-12 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-400 active:bg-slate-800 disabled:opacity-40"
          >
            <RotateCcw size={15} aria-hidden /> Reset Day
          </button>
        </div>
      </section>

      <ul className="space-y-3 px-4 pb-40 pt-2">
        {day.items.map((item, i) => (
          <ExerciseCard
            key={`${day.id}-${item.id}`}
            item={item}
            index={i}
            completedSets={getSets(day.id, item.id)}
            onToggle={() => onToggle(item)}
            onOpen={() => onOpen(item)}
          />
        ))}
      </ul>
    </div>
  )
}
