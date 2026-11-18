import { useState } from 'react'
import { HelpTip, getAt, setAt, useDraft } from './fields'

interface Metric {
  key: string
  label: string
  value: string
  unit?: string
  verified: string
}

const MAX = 8
const blank = (): Metric => ({ key: `m${Date.now().toString(36)}`, label: '', value: '', unit: '', verified: '' })
const thisMonth = () => new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
const isPlaceholder = (v: string) => v === '' || /\[|Month\/Year/.test(v)
const shown = (v: string) => (isPlaceholder(v) ? '' : v)

const cell = 'h-12 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50 placeholder:text-slate-500'
const btn = 'min-h-12 rounded-xl border px-4 text-sm font-bold active:bg-slate-800 disabled:opacity-40'

function Cells({ m, onChange, idPrefix }: { m: Metric; onChange: (p: Partial<Metric>) => void; idPrefix: string }) {
  const lab = 'text-xs font-bold uppercase tracking-wider text-slate-400 @3xl:sr-only'
  return (
    <>
      <label className="block">
        <span className={lab}>Measurable</span>
        <input id={`${idPrefix}-label`} className={cell} value={m.label} maxLength={60} placeholder="100m time" aria-label="Measurable name" onChange={(e) => onChange({ label: e.target.value })} />
      </label>
      <label className="block">
        <span className={lab}>Value</span>
        <input className={cell} value={shown(m.value)} maxLength={30} placeholder="12.4" inputMode="decimal" aria-label="Value" onChange={(e) => onChange({ value: e.target.value })} />
      </label>
      <label className="block">
        <span className={lab}>Unit</span>
        <input className={cell} value={m.unit ?? ''} maxLength={10} placeholder="sec" aria-label="Unit" onChange={(e) => onChange({ unit: e.target.value })} />
      </label>
      <div className="block">
        <span className={lab}>Verified</span>
        <div className="flex gap-1">
          <input className={cell} value={shown(m.verified)} maxLength={30} placeholder="Oct 2026" aria-label="Verified month and year" onChange={(e) => onChange({ verified: e.target.value })} />
          <button type="button" onClick={() => onChange({ verified: thisMonth() })} className="min-h-12 shrink-0 rounded-xl border border-slate-600 px-3 text-xs font-bold text-slate-200 active:bg-slate-800">
            This month
          </button>
        </div>
      </div>
    </>
  )
}

export default function MetricsGrid({ suggestions = [] }: { suggestions?: { label: string; unit: string }[] }) {
  const { draft, setDraft, commit } = useDraft()
  const rows = ((getAt(draft, ['metrics']) as Metric[] | undefined) ?? []).map((m) => ({ ...m }))
  const [buf, setBuf] = useState<Record<number, Metric>>({})
  const [adding, setAdding] = useState<Metric | null>(null)
  const [choosing, setChoosing] = useState(false)
  const [asking, setAsking] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const write = async (next: Metric[]) => {
    setBusy(true)
    setError('')
    const apply = (d: unknown) => setAt(d, ['metrics'], next)
    const ok = commit ? await commit(apply) : (setDraft(apply), true)
    setBusy(false)
    return ok
  }
  const clean = (m: Metric): Metric => ({ ...m, label: m.label.trim(), value: m.value.trim() || '[X]', unit: (m.unit ?? '').trim(), verified: m.verified.trim() || 'Month/Year' })
  const check = (m: Metric) => {
    if (!m.label.trim()) {
      setError('Type a name for the measurable, like 100m time.')
      return false
    }
    return true
  }

  const saveRow = async (i: number) => {
    if (!check(buf[i])) return
    if (await write(rows.map((r, j) => (j === i ? clean(buf[i]) : r)))) setBuf(({ [i]: _, ...rest }) => rest)
  }
  const saveAdd = async () => {
    if (!adding || !check(adding)) return
    if (await write([...rows, clean(adding)])) setAdding(null)
  }
  const saveAll = async () => {
    const all = Object.values(buf)
    if (adding && adding.label.trim()) all.push(adding)
    if (!all.every(check)) return
    const next = rows.map((r, i) => (buf[i] ? clean(buf[i]) : r))
    if (adding && adding.label.trim()) next.push(clean(adding))
    if (await write(next)) {
      setBuf({})
      setAdding(null)
    }
  }
  const remove = async (i: number) => {
    if (await write(rows.filter((_, j) => j !== i))) {
      setAsking(null)
      setBuf({})
    }
  }
  const have = new Set(rows.map((r) => r.label.trim().toLowerCase()))
  const available = suggestions.filter((m) => !have.has(m.label.toLowerCase()))
  const startAdd = () => (available.length ? setChoosing(true) : setAdding(blank()))
  const pickSuggestion = (m?: { label: string; unit: string }) => {
    setChoosing(false)
    setAdding({ ...blank(), label: m?.label ?? '', unit: m?.unit ?? '' })
  }
  const editAll = () => setBuf(Object.fromEntries(rows.map((r, i) => [i, { ...r }])))

  const busyAll = Object.keys(buf).length > 1 || (Object.keys(buf).length > 0 && adding !== null)
  const row = 'grid gap-2 rounded-2xl border border-slate-700 bg-slate-950/40 p-3 @md:grid-cols-2 @3xl:grid-cols-[1.4fr_1fr_5.5rem_1.6fr_auto] @3xl:items-center'

  return (
    <div className="@container space-y-3 sm:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy || adding !== null || choosing || rows.length >= MAX} onClick={startAdd} className={`${btn} border-amber-500 text-amber-400`}>
          + Add measurable
        </button>
        {Object.keys(buf).length === 0 ? (
          <button type="button" disabled={busy || rows.length === 0} onClick={editAll} className={`${btn} border-slate-600 text-slate-100`}>
            Edit all
          </button>
        ) : (
          <>
            <button type="button" disabled={busy} onClick={() => void saveAll()} className={`${btn} border-amber-500 bg-amber-500 text-slate-950`}>
              {busy ? 'Saving…' : busyAll ? 'Save all' : 'Save'}
            </button>
            <button type="button" disabled={busy} onClick={() => { setBuf({}); setAdding(null); setError('') }} className={`${btn} border-slate-600 text-slate-100`}>
              Cancel
            </button>
          </>
        )}
        <HelpTip label="quick entry">
          Type the number and the date for each measurable. <strong>Edit all</strong> opens every row so you can fill them in one pass, then press <strong>Save all</strong>. Use a row’s own <strong>Edit</strong>, <strong>Save</strong> and <strong>Remove</strong> buttons for a quick change later. Saving publishes to the website right away. “This month” fills in today’s month and year. Value is only the number, and the unit goes in its own box.
        </HelpTip>
        <span className="text-xs text-slate-400">{rows.length} of {MAX}</span>
      </div>

      {choosing && (
        <section aria-label="Choose a measurable to add" className="space-y-3 rounded-2xl border border-amber-500/60 bg-slate-950/40 p-4">
          <p className="text-sm font-bold text-slate-100">What would you like to add?</p>
          <div className="flex flex-wrap gap-2">
            {available.map((m) => (
              <button key={m.label} type="button" onClick={() => pickSuggestion(m)} className="min-h-12 rounded-full border border-slate-600 px-4 text-sm font-semibold text-slate-100 active:bg-slate-800">
                {m.unit ? `${m.label} (${m.unit})` : m.label}
              </button>
            ))}
            <button type="button" onClick={() => pickSuggestion()} className="min-h-12 rounded-full border border-amber-500 px-4 text-sm font-bold text-amber-300 active:bg-amber-500/10">
              + Custom measurable
            </button>
          </div>
          <button type="button" onClick={() => setChoosing(false)} className="min-h-10 text-sm font-semibold text-slate-300 underline">
            Cancel
          </button>
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="hidden px-3 text-xs font-bold uppercase tracking-wider text-slate-400 @3xl:grid @3xl:grid-cols-[1.4fr_1fr_5.5rem_1.6fr_auto] @3xl:gap-2" aria-hidden>
        <span>Measurable</span>
        <span>Value</span>
        <span>Unit</span>
        <span>Verified</span>
        <span className="w-48" />
      </div>

      {rows.length === 0 && !adding && <p className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">No measurables yet. Press “+ Add measurable” to add the first one.</p>}

      {rows.map((m, i) => {
        const b = buf[i]
        return (
          <div key={m.key + i} className={row}>
            {b ? (
              <>
                <Cells m={b} idPrefix={`mg-${i}`} onChange={(p) => setBuf((x) => ({ ...x, [i]: { ...x[i], ...p } }))} />
                {Object.keys(buf).length === 1 && !adding ? (
                  <div className="flex gap-2 @md:col-span-2 @3xl:col-span-1 @3xl:w-48">
                    <button type="button" disabled={busy} onClick={() => void saveRow(i)} className={`${btn} flex-1 border-amber-500 bg-amber-500 text-slate-950`}>
                      Save
                    </button>
                    <button type="button" disabled={busy} onClick={() => setBuf(({ [i]: _, ...rest }) => rest)} className={`${btn} flex-1 border-slate-600 text-slate-100`}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span className="hidden @3xl:block @3xl:w-48" />
                )}
              </>
            ) : (
              <>
                <p className="font-bold text-slate-50">{m.label}</p>
                <p className="text-slate-100"><span className="text-xs font-bold uppercase tracking-wider text-slate-400 @3xl:hidden">Value </span>{shown(m.value) || <span className="text-slate-500">not entered</span>}</p>
                <p className="text-slate-300"><span className="text-xs font-bold uppercase tracking-wider text-slate-400 @3xl:hidden">Unit </span>{m.unit || '—'}</p>
                <p className="text-slate-300"><span className="text-xs font-bold uppercase tracking-wider text-slate-400 @3xl:hidden">Verified </span>{shown(m.verified) || <span className="text-slate-500">no date</span>}</p>
                {asking === i ? (
                  <div className="flex items-center gap-2 @md:col-span-2 @3xl:col-span-1 @3xl:w-48">
                    <button type="button" disabled={busy} onClick={() => void remove(i)} className={`${btn} flex-1 border-red-500 bg-red-500/20 text-red-100`}>
                      {busy ? '…' : 'Yes, remove'}
                    </button>
                    <button type="button" onClick={() => setAsking(null)} className={`${btn} flex-1 border-slate-600 text-slate-100`}>
                      Keep
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 @md:col-span-2 @3xl:col-span-1 @3xl:w-48">
                    <button type="button" aria-label={`Edit ${m.label}`} onClick={() => setBuf((x) => ({ ...x, [i]: { ...m } }))} className={`${btn} flex-1 border-slate-600 text-slate-100`}>
                      Edit
                    </button>
                    <button type="button" aria-label={`Remove ${m.label}`} onClick={() => setAsking(i)} className={`${btn} flex-1 border-red-500/50 text-red-200`}>
                      Remove
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}

      {adding && (
        <div className={`${row} border-amber-500/60`}>
          <Cells m={adding} idPrefix="mg-new" onChange={(p) => setAdding((x) => (x ? { ...x, ...p } : x))} />
          <div className="flex gap-2 @md:col-span-2 @3xl:col-span-1 @3xl:w-48">
            {Object.keys(buf).length === 0 && (
              <button type="button" disabled={busy} onClick={() => void saveAdd()} className={`${btn} flex-1 border-amber-500 bg-amber-500 text-slate-950`}>
                {busy ? 'Saving…' : 'Save'}
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => { setAdding(null); setError('') }} className={`${btn} flex-1 border-slate-600 text-slate-100`}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
