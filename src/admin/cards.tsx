import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CollapseHeader, Collapsible, getAt, useDraft } from './fields'
import type { Path } from './fields'
import { noRec, pickRec } from './RecordCard'
import type { Rec } from './RecordCard'

export type FieldDef = [label: string, path: Path, fmt?: (v: string) => string]

const th = 'sticky top-0 bg-slate-800 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-300'
const td = 'max-w-[22rem] truncate whitespace-nowrap px-3 py-2 text-slate-100'
const rowCls = 'h-[3.1rem] cursor-pointer hover:bg-slate-800 focus-visible:bg-slate-800'
const btn = 'min-h-12 rounded-xl border px-5 text-sm font-bold active:bg-slate-800'

export function useCards(resetKey?: unknown) {
  const [openCard, setOpenCard] = useState<string | null>(null)
  const [recs, setRecs] = useState<Record<string, Rec>>({})
  useEffect(() => {
    setOpenCard(null)
    setRecs({})
  }, [resetKey])
  return {
    card: (k: string) => ({ open: openCard === k, onToggle: () => setOpenCard((o) => (o === k ? null : k)) }),
    rec: (k: string): Rec => recs[k] ?? noRec,
    setRec: (k: string) => (r: Rec) => setRecs((m) => ({ ...m, [k]: r })),
    pick: (k: string, n = 0) => {
      setOpenCard(k)
      setRecs((m) => ({ ...m, [k]: pickRec(m[k] ?? noRec, n) }))
    },
  }
}

const show = (draft: unknown, [, path, fmt]: FieldDef) => {
  const v = String(getAt(draft, path) ?? '')
  return fmt ? fmt(v) : v
}

export function SingleCard({ title, hint, open, onToggle, rec, setRec, fields, children }: { title: string; hint?: string; open: boolean; onToggle: () => void; rec: Rec; setRec: (r: Rec) => void; fields: FieldDef[]; children: ReactNode }) {
  const { draft } = useDraft()
  const box = useRef<HTMLElement>(null)
  const editBox = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open && rec.tick > 0) box.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [rec.tick, open])
  useEffect(() => {
    if (open && rec.mode === 'edit') editBox.current?.querySelector<HTMLElement>('input,textarea,select,button')?.focus({ preventScroll: true })
  }, [rec.mode, open])
  return (
    <Collapsible title={title} hint={hint} open={open} onToggle={onToggle} boxRef={box}>
      <div className="space-y-4 sm:col-span-2">
        {rec.mode === 'view' ? (
          <dl className="grid gap-x-6 gap-y-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f[0]}>
                <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">{f[0]}</dt>
                <dd className="mt-0.5 whitespace-pre-line break-words text-base text-slate-50">{show(draft, f) || '—'}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div ref={editBox} className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4 sm:grid-cols-2">
            {children}
          </div>
        )}
        <button type="button" onClick={() => setRec({ ...rec, mode: rec.mode === 'view' ? 'edit' : 'view' })} className={`${btn} border-amber-500 text-amber-400`}>
          {rec.mode === 'view' ? `Edit ${title.toLowerCase()}` : 'Done editing'}
        </button>
      </div>
    </Collapsible>
  )
}

export function FieldsTable({ title, fields, literal, onPick }: { title: string; fields?: FieldDef[]; literal?: [string, string][]; onPick: () => void }) {
  const { draft } = useDraft()
  const [open, setOpen] = useState(true)
  const rows: [string, string][] = literal ?? (fields ?? []).map((f) => [f[0], show(draft, f)])
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5" aria-label={title}>
      <CollapseHeader title={title} open={open} onToggle={() => setOpen((o) => !o)} />
      {open && (
        <>
          <p className="mb-3 text-sm text-slate-400">Click a row to view it. Scroll to see more than five.</p>
          <div className="max-h-[17.5rem] overflow-auto rounded-xl border border-slate-700" tabIndex={0}>
            <table className="w-full min-w-[20rem] text-sm">
              <thead>
                <tr>
                  <th className={th}>Detail</th>
                  <th className={th}>Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map(([k, v]) => (
                  <tr key={k} tabIndex={0} onClick={onPick} onKeyDown={(e) => e.key === 'Enter' && onPick()} aria-label={`View ${k}`} className={rowCls}>
                    <td className={`${td} font-semibold`}>{k}</td>
                    <td className={td}>{v || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

export function ListTable({ title, listPath, columns, noun, onPick }: { title: string; listPath: string[]; columns: [label: string, key: string][]; noun: string; onPick: (n: number) => void }) {
  const { draft } = useDraft()
  const [open, setOpen] = useState(true)
  const rows = ((getAt(draft, listPath) as Record<string, unknown>[] | undefined) ?? []).map((r, n) => ({ r, n })).filter((x) => columns.some(([, k]) => x.r[k]))
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5" aria-label={title}>
      <CollapseHeader title={title} open={open} onToggle={() => setOpen((o) => !o)} />
      {open && <p className="mb-3 text-sm text-slate-400">In the order entered. Click a {noun} to view it. Scroll to see more than five.</p>}
      {!open ? null : rows.length === 0 ? (
        <p className="text-sm text-slate-400">Nothing yet. Add one above.</p>
      ) : (
        <div className="max-h-[17.5rem] overflow-auto rounded-xl border border-slate-700" tabIndex={0}>
          <table className="w-full min-w-[24rem] text-sm">
            <thead>
              <tr>
                {columns.map(([l]) => (
                  <th key={l} className={th}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map(({ r, n }) => (
                <tr key={n} tabIndex={0} onClick={() => onPick(n)} onKeyDown={(e) => e.key === 'Enter' && onPick(n)} aria-label={`View ${noun} ${n + 1}`} className={rowCls}>
                  {columns.map(([l, k], c) => (
                    <td key={l} className={c === 0 ? `${td} font-semibold` : td}>{String(r[k] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
