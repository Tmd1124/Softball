import { useEffect } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Collapsible, getAt, setAt, useDraft } from './fields'

export interface Rec {
  sel: number | null
  mode: 'view' | 'edit'
  tick: number
}

export const noRec: Rec = { sel: null, mode: 'view', tick: 0 }

export const pickRec = (prev: Rec, n: number): Rec => ({ sel: n, mode: 'view', tick: prev.tick + 1 })

type Row = Record<string, unknown>

const btn = 'min-h-12 rounded-xl border px-5 text-sm font-bold active:bg-slate-800'

export default function RecordCard({
  title,
  hint,
  listPath,
  noun,
  blank,
  max,
  open,
  onToggle,
  boxRef,
  rec,
  setRec,
  focusPrefix,
  settings,
  edit,
  view,
}: {
  title: string
  hint?: string
  listPath: string[]
  noun: string
  blank: Row | (() => Row)
  max: number
  open: boolean
  onToggle: () => void
  boxRef: RefObject<HTMLElement | null>
  rec: Rec
  setRec: (r: Rec) => void
  focusPrefix: string
  settings?: ReactNode
  edit: (n: number) => ReactNode
  view: (row: Row) => [string, string][]
}) {
  const { draft, setDraft } = useDraft()
  const rows = (getAt(draft, listPath) as Row[] | undefined) ?? []
  const row = rec.sel !== null ? rows[rec.sel] : undefined

  useEffect(() => {
    if (open && rec.tick > 0) boxRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [rec.tick, open, boxRef])

  useEffect(() => {
    if (open && rec.mode === 'edit' && rec.sel !== null) document.getElementById(`${focusPrefix}-${rec.sel}`)?.focus({ preventScroll: true })
  }, [rec.mode, rec.sel, open, focusPrefix])

  const add = () => {
    setDraft((d) => setAt(d, listPath, [...rows, typeof blank === 'function' ? blank() : structuredClone(blank)]))
    setRec({ sel: rows.length, mode: 'edit', tick: rec.tick + 1 })
  }
  const remove = () => {
    if (rec.sel === null) return
    setDraft((d) => setAt(d, listPath, rows.filter((_, j) => j !== rec.sel)))
    setRec({ sel: null, mode: 'view', tick: rec.tick })
  }

  return (
    <Collapsible title={title} hint={hint} open={open} onToggle={onToggle} boxRef={boxRef}>
      {settings}
      <div className="space-y-4 sm:col-span-2">
        {row && rec.mode === 'view' && (
          <dl className="grid gap-x-6 gap-y-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4 sm:grid-cols-2">
            {view(row).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">{k}</dt>
                <dd className="mt-0.5 break-words text-base text-slate-50">{v || '—'}</dd>
              </div>
            ))}
          </dl>
        )}
        {row && rec.mode === 'edit' && <div className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4 sm:grid-cols-2">{edit(rec.sel!)}</div>}
        {!row && (
          <p className="text-sm text-slate-400">
            {rows.length ? `Choose a ${noun} in the table below to view it, or add a new one.` : `No ${noun}s yet. Add the first one.`}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {row && rec.mode === 'view' && (
            <button type="button" onClick={() => setRec({ ...rec, mode: 'edit' })} className={`${btn} border-amber-500 text-amber-400`}>
              Edit this {noun}
            </button>
          )}
          {row && rec.mode === 'edit' && (
            <button type="button" onClick={() => setRec({ ...rec, mode: 'view' })} className={`${btn} border-amber-500 text-amber-400`}>
              Done editing
            </button>
          )}
          {row && (
            <button type="button" onClick={remove} className={`${btn} border-red-500/50 text-red-200`}>
              Delete this {noun}
            </button>
          )}
          {rows.length < max && (
            <button type="button" onClick={add} className={`${btn} border-slate-600 text-slate-100`}>
              Add {noun}
            </button>
          )}
        </div>
      </div>
    </Collapsible>
  )
}
