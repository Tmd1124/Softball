import type { ReactNode } from 'react'
import { SPORT_LABEL, exerciseName, fmtLb, fmtWhen, utcToDate } from '../lib/summary'
import type { Sport, SportSummary, SummaryEntry, SummaryState } from '../lib/summary'
import { useShell } from './SiteShell'

const SPORT_IDS: Sport[] = ['softball', 'basketball']

function Section({ id, title, kicker, children }: { id: string; title: string; kicker: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">{kicker}</p>
      <h2 id={id} className="mt-2 text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Notice({ state }: { state: SummaryState }) {
  const { openLogin } = useShell()
  if (state.state === 'loading') return <p className="text-sm text-slate-400">Loading…</p>
  if (state.state === 'error')
    return (
      <p role="alert" className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-200">
        Couldn&apos;t load this from the server. Check your connection and refresh.
      </p>
    )
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-5">
      <p className="text-sm text-slate-300">Sign in to see your status and highlights.</p>
      <button
        type="button"
        onClick={openLogin}
        className="min-h-12 rounded-full bg-amber-500 px-6 text-sm font-bold text-slate-950 active:bg-amber-400"
      >
        Sign in
      </button>
    </div>
  )
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-slate-50">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
    </div>
  )
}

function combine(sports: Record<Sport, SportSummary>) {
  const list = SPORT_IDS.map((s) => sports[s])
  const last = list.map((s) => s.lastAt).filter((x): x is string => !!x).sort().pop() ?? null
  return {
    completed: list.reduce((n, s) => n + s.completed, 0),
    week: list.reduce((n, s) => n + s.week, 0),
    days: list.reduce((n, s) => n + s.days, 0),
    lastAt: last,
  }
}

export function StatusSection({ state, sport }: { state: SummaryState; sport?: Sport }) {
  const title = sport ? `${SPORT_LABEL[sport]} status` : 'Status'
  return (
    <Section id={`status-${sport ?? 'all'}`} title={title} kicker="Where things stand">
      {state.state !== 'ok' ? (
        <Notice state={state} />
      ) : (
        <StatusBody sports={state.sports} sport={sport} />
      )}
    </Section>
  )
}

function StatusBody({ sports, sport }: { sports: Record<Sport, SportSummary>; sport?: Sport }) {
  const s = sport ? sports[sport] : combine(sports)
  const empty = s.completed === 0
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Completed" value={String(s.completed)} note="exercises logged" />
        <Tile label="Last 7 days" value={String(s.week)} note="completed" />
        <Tile label="Active days" value={String(s.days)} />
        <Tile label="Last activity" value={fmtWhen(s.lastAt)} />
      </div>
      {!sport && (
        <div className="grid gap-3 sm:grid-cols-2">
          {SPORT_IDS.map((id) => (
            <a
              key={id}
              href={`/${id}/`}
              className="flex min-h-16 items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-600"
            >
              <img src={`/img/${id}.svg`} alt="" width={40} height={40} />
              <span className="flex-1">
                <span className="block font-bold text-slate-50">{SPORT_LABEL[id]}</span>
                <span className="block text-sm text-slate-400">
                  {sports[id].completed === 0
                    ? 'Nothing logged yet'
                    : `${sports[id].completed} completed · ${sports[id].week} this week`}
                </span>
              </span>
              <span aria-hidden className="text-slate-500">
                →
              </span>
            </a>
          ))}
        </div>
      )}
      {sport && empty && (
        <p className="text-sm text-slate-400">
          {sport === 'basketball'
            ? 'No basketball activity has been logged yet. Basketball tracking is coming soon.'
            : 'No softball workouts have been completed yet. Open the workouts to log your first one.'}
        </p>
      )}
    </div>
  )
}

function Row({ entry, sport }: { entry: SummaryEntry; sport?: Sport }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      {sport && <img src={`/img/${sport}.svg`} alt={SPORT_LABEL[sport]} width={28} height={28} />}
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-slate-50">{exerciseName(entry.exerciseId)}</p>
        <p className="text-sm text-slate-400">
          {entry.sets} {entry.sets === 1 ? 'set' : 'sets'}
          {entry.completedAt && ` · ${utcToDate(entry.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
        </p>
      </div>
      {entry.weight !== null && <p className="text-lg font-bold tabular-nums text-amber-400">{fmtLb(entry.weight)}</p>}
    </li>
  )
}

export function HighlightsSection({ state, sport }: { state: SummaryState; sport?: Sport }) {
  const title = sport ? `${SPORT_LABEL[sport]} highlights` : 'Highlights'
  return (
    <Section id={`highlights-${sport ?? 'all'}`} title={title} kicker="Best and latest">
      {state.state !== 'ok' ? <Notice state={state} /> : <HighlightsBody sports={state.sports} sport={sport} />}
    </Section>
  )
}

function HighlightsBody({ sports, sport }: { sports: Record<Sport, SportSummary>; sport?: Sport }) {
  const ids = sport ? [sport] : SPORT_IDS
  const bests = ids
    .flatMap((id) => sports[id].bests.map((b) => ({ ...b, sport: id })))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
  const recent = ids
    .flatMap((id) => sports[id].recent.map((r) => ({ ...r, sport: id })))
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 5)

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Personal bests</h3>
        {bests.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No weights logged yet.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {bests.map((b) => (
              <li key={`${b.sport}-${b.exerciseId}`} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                {!sport && <img src={`/img/${b.sport}.svg`} alt={SPORT_LABEL[b.sport]} width={28} height={28} />}
                <p className="min-w-0 flex-1 truncate font-bold text-slate-50">{exerciseName(b.exerciseId)}</p>
                <p className="text-lg font-extrabold tabular-nums text-amber-400">{fmtLb(b.weight)}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Recently completed</h3>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Nothing completed yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((r) => (
              <Row key={`${r.sport}-${r.dayId}-${r.exerciseId}-${r.completedAt}`} entry={r} sport={sport ? undefined : r.sport} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
