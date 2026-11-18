import { useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, api } from '../lib/api'
import type { SportConfig } from '../data/recruitingData'
import { CATALOG, slugify } from '../data/sportCatalog'
import { mergeSport } from '../lib/recruiting'
import type { Store } from '../lib/recruiting'
import { HelpTip } from './fields'
import { sportGaps } from './gaps'

const COLORS: [string, string][] = [
  ['Green', '#22c55e'],
  ['Orange', '#f97316'],
  ['Blue', '#3b82f6'],
  ['Red', '#ef4444'],
  ['Purple', '#a855f7'],
  ['Gold', '#eab308'],
  ['Teal', '#14b8a6'],
  ['Pink', '#ec4899'],
]

const OTHER = '__other'

interface FormState {
  pick: string
  label: string
  id: string
  idTouched: boolean
  accent: string
  positionLabel: string
  positionStyle: 'multi' | 'pair'
  all: string[]
  checked: string[]
  handedness: boolean
  allM: string[]
  checkedM: string[]
  baseP: string[]
  baseM: string[]
}

const blankForm: FormState = { pick: '', label: '', id: '', idTouched: false, accent: COLORS[0][1], positionLabel: 'Positions', positionStyle: 'multi', all: [], checked: [], handedness: false, allM: [], checkedM: [], baseP: [], baseM: [] }

const MAX_METRICS = 8
const mkey = (label: string, unit: string) => `${label}|${unit}`
const mshow = (k: string) => {
  const [label, unit] = k.split('|')
  return unit ? `${label} (${unit})` : label
}

const fromCatalog = (name: string): FormState => {
  const c = CATALOG.find((x) => x.name === name)!
  return {
    pick: name,
    label: c.name,
    id: slugify(c.name),
    idTouched: false,
    accent: c.accent,
    positionLabel: c.label,
    positionStyle: c.style,
    all: c.positions,
    baseP: c.positions,
    baseM: c.metrics.map(([l, u]) => mkey(l, u)),
    checked: c.positions,
    handedness: c.handedness,
    allM: c.metrics.map(([l, u]) => mkey(l, u)),
    checkedM: c.metrics.slice(0, 4).map(([l, u]) => mkey(l, u)),
  }
}

const fromConfig = (c: SportConfig): FormState => {
  const cat = CATALOG.find((x) => slugify(x.name) === c.id)
  const known = cat?.positions ?? []
  const own = c.metrics.map((m) => mkey(m.label, m.unit))
  return {
    pick: c.id,
    label: c.label,
    id: c.id,
    idTouched: true,
    accent: c.accent,
    positionLabel: c.positionLabel,
    positionStyle: c.positionStyle,
    all: [...new Set([...known, ...c.positions])],
    baseP: known,
    baseM: cat?.metrics.map(([l, u]) => mkey(l, u)) ?? [],
    checked: c.positions,
    handedness: c.handedness,
    allM: [...new Set([...(cat?.metrics.map(([l, u]) => mkey(l, u)) ?? []), ...own])],
    checkedM: own,
  }
}

const input = 'mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50 placeholder:text-slate-500'

function Q({ n, label, help, htmlFor, children }: { n?: number; label: string; help: ReactNode; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center">
        {n && <span aria-hidden className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-extrabold text-slate-950">{n}</span>}
        <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-200">{label}</label>
        <HelpTip label={label}>{help}</HelpTip>
      </div>
      {children}
    </div>
  )
}

function HowTo({ onClose }: { onClose: () => void }) {
  return (
    <section aria-label="How adding a sport works" className="rounded-3xl border border-amber-500/50 bg-amber-500/10 p-5 text-sm leading-relaxed text-slate-100">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-extrabold text-amber-300">How to add a sport (about 5 minutes, no code)</h2>
        <button type="button" onClick={onClose} aria-label="Close the steps" className="-mt-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-amber-500/60 text-lg font-bold text-amber-300 active:bg-amber-500/20">
          ✕
        </button>
      </div>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5">
        <li><strong>Pick the sport</strong> from the list. Its name, color, positions and starter measurables fill in for you. If it is not on the list, choose <em>Other</em> and type it. Tap the <span className="font-bold text-amber-300">?</span> beside any question if you are not sure.</li>
        <li><strong>Tick the positions</strong> you want to offer, and the <strong>measurables</strong> coaches ask about. Untick any that do not apply, or add your own.</li>
        <li><strong>Press Add sport.</strong> It starts hidden, so nobody else can see it yet.</li>
        <li><strong>Fill in its pages.</strong> The sport gets its own button at the top of this screen for its photo, measurables, teams, film and schedule, the same as Softball.</li>
        <li><strong>Press “Show on the website”</strong> on this screen when you are ready.</li>
      </ol>
      <p className="mt-2">To take a sport off the website, press <strong>Hide</strong>. Nothing is deleted, and you can show it again any time.</p>
    </section>
  )
}

function SportForm({ initial, editing, existingIds, busy, error, onSubmit, onCancel }: { initial: FormState; editing: boolean; existingIds: string[]; busy: boolean; error: string; onSubmit: (body: Record<string, unknown>) => void; onCancel: () => void }) {
  const uid = useId()
  const [f, setF] = useState(initial)
  const [custom, setCustom] = useState('')
  const [customM, setCustomM] = useState({ label: '', unit: '' })
  const set = (patch: Partial<FormState>) => setF((p) => ({ ...p, ...patch }))
  const picked = f.pick !== ''
  const positions = f.all.filter((p) => f.checked.includes(p))
  const metricKeys = f.allM.filter((k) => f.checkedM.includes(k))

  const choose = (name: string) => {
    if (name === '') setF(blankForm)
    else if (name === OTHER) setF({ ...blankForm, pick: OTHER })
    else setF(fromCatalog(name))
  }
  const toggle = (p: string) => set({ checked: f.checked.includes(p) ? f.checked.filter((x) => x !== p) : [...f.checked, p] })
  const addCustom = () => {
    const v = custom.trim()
    if (!v || f.all.includes(v)) {
      setCustom('')
      return
    }
    set({ all: [...f.all, v], checked: [...f.checked, v] })
    setCustom('')
  }

  const removeP = (p: string) => set({ all: f.all.filter((x) => x !== p), checked: f.checked.filter((x) => x !== p) })
  const removeM = (k: string) => set({ allM: f.allM.filter((x) => x !== k), checkedM: f.checkedM.filter((x) => x !== k) })
  const toggleM = (k: string) => set({ checkedM: f.checkedM.includes(k) ? f.checkedM.filter((x) => x !== k) : [...f.checkedM, k] })
  const addCustomM = () => {
    const label = customM.label.trim().replace(/\|/g, '')
    const unit = customM.unit.trim().replace(/\|/g, '')
    setCustomM({ label: '', unit: '' })
    const k = mkey(label, unit)
    if (!label || f.allM.includes(k) || metricKeys.length >= MAX_METRICS) return
    set({ allM: [...f.allM, k], checkedM: [...f.checkedM, k] })
  }

  const submit = () =>
    onSubmit({
      label: f.label,
      id: f.id,
      accent: f.accent,
      positionLabel: f.positionLabel,
      positionStyle: f.positionStyle,
      positions,
      handedness: f.handedness,
      metrics: metricKeys.map((k) => {
        const [label, unit] = k.split('|')
        return { label, unit }
      }),
    })

  const fineTune = (
    <div className="space-y-5">
      <Q label="Sport name" htmlFor={`${uid}-name`} help={<>What the sport is called. It shows in the menu, in the page title and on the printed profile. Example: <strong>Track &amp; Field</strong>.</>}>
        <input id={`${uid}-name`} className={`${input} h-12`} value={f.label} maxLength={40} placeholder="Track & Field" onChange={(e) => set({ label: e.target.value, ...(f.idTouched || editing ? {} : { id: slugify(e.target.value) }) })} />
      </Q>
      {editing ? (
        <p className="text-sm text-slate-400">Web address: <strong className="text-slate-200">everharris.com/{f.id}/</strong> (cannot be changed)</p>
      ) : (
        <Q label="Web address" htmlFor={`${uid}-id`} help={<>The last part of the page’s web address. It is made from the name for you. Use only lowercase letters, numbers and dashes. <strong>It cannot be changed later.</strong></>}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">everharris.com/</span>
            <input id={`${uid}-id`} className={`${input} mt-0 h-12 min-w-0 flex-1`} value={f.id} maxLength={30} placeholder="track-and-field" onChange={(e) => set({ id: e.target.value.toLowerCase(), idTouched: true })} />
            <span className="text-sm text-slate-400">/</span>
          </div>
        </Q>
      )}
      <Q label="What do you call the choices?" htmlFor={`${uid}-plabel`} help={<>The heading above the list of choices when you fill in her bio. Use <strong>Positions</strong> for team sports, <strong>Events</strong> for track or swimming, or <strong>Weight classes</strong> for wrestling.</>}>
        <input id={`${uid}-plabel`} className={`${input} h-12`} list={`${uid}-plist`} value={f.positionLabel} maxLength={20} onChange={(e) => set({ positionLabel: e.target.value })} />
        <datalist id={`${uid}-plist`}>
          <option value="Positions" />
          <option value="Events" />
          <option value="Weight classes" />
        </datalist>
      </Q>
      <Q label="How are they picked?" help={<><strong>Choose several</strong> lets her tick more than one, like a softball player who plays catcher and first base. <strong>Main and backup</strong> picks one main choice and an optional second, like basketball.</>}>
        <div className="mt-1 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="How are they picked?">
          {([['multi', 'Choose several'], ['pair', 'Main and backup']] as const).map(([v, t]) => (
            <label key={v} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm font-semibold ${f.positionStyle === v ? 'border-amber-500 text-amber-300' : 'border-slate-600 text-slate-200'}`}>
              <input type="radio" name={`${uid}-style`} checked={f.positionStyle === v} onChange={() => set({ positionStyle: v })} className="h-5 w-5 accent-amber-500" />
              {t}
            </label>
          ))}
        </div>
      </Q>
      <label className="flex min-h-12 cursor-pointer items-center gap-3 text-sm font-semibold text-slate-200">
        <input type="checkbox" checked={f.handedness} onChange={(e) => set({ handedness: e.target.checked })} className="h-5 w-5 accent-amber-500" />
        This sport needs Bats / Throws
        <HelpTip label="Bats / Throws">Turn this on for baseball, softball and similar sports. It adds a Bats / Throws pick-list to the Bio step.</HelpTip>
      </label>
    </div>
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-5"
    >
      <h2 className="text-lg font-bold text-slate-50">{editing ? `Edit ${initial.label} settings` : 'Add a sport'}</h2>

      {!editing && (
        <Q n={1} label="Which sport?" htmlFor={`${uid}-pick`} help={<>Choose from the most common college sports that offer scholarships. Everything else fills in for you and can be changed. If your sport is not listed, choose <strong>Other</strong> and type it.</>}>
          <select id={`${uid}-pick`} className={`${input} h-12`} value={f.pick} onChange={(e) => choose(e.target.value)}>
            <option value="">Choose a sport…</option>
            {CATALOG.map((c) => (
              <option key={c.name} value={c.name} disabled={existingIds.includes(slugify(c.name))}>
                {c.name}
                {existingIds.includes(slugify(c.name)) ? ' (already added)' : ''}
              </option>
            ))}
            <option value={OTHER}>Other sport (I will type it)</option>
          </select>
        </Q>
      )}

      {(editing || picked) && (
        <>
          {f.pick === OTHER ? (
            fineTune
          ) : (
            <details open={editing} className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
              <summary className="min-h-10 cursor-pointer text-sm font-bold text-slate-200">
                {f.label || 'Sport'} · everharris.com/{f.id}/ · {f.positionLabel} · <span className="text-amber-300">change name, address or settings</span>
              </summary>
              <div className="mt-4">{fineTune}</div>
            </details>
          )}

          <Q n={2} label="Color" help="The accent color for this sport’s pages, buttons and printed profile. Pick one that matches the team colors. You can change it later.">
            <div className="mt-1 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Color">
              {COLORS.map(([name, hex]) => (
                <button key={hex} type="button" role="radio" aria-checked={f.accent === hex} aria-label={name} onClick={() => set({ accent: hex })} className={`h-12 w-12 rounded-full border-4 ${f.accent === hex ? 'border-white' : 'border-transparent'}`} style={{ background: hex }} />
              ))}
              <label className="ml-1 flex items-center gap-2 text-sm text-slate-300">
                Other
                <input type="color" value={f.accent} onChange={(e) => set({ accent: e.target.value })} aria-label="Pick another color" className="h-12 w-14 cursor-pointer rounded-lg border border-slate-600 bg-slate-950 p-1" />
              </label>
            </div>
          </Q>

          <Q n={3} label={`${f.positionLabel || 'Positions'} to offer`} help={<>This is the checklist you will choose from when you fill in Ever’s bio. Untick any that do not apply to her level. Add your own below if something is missing. You can change this list later.</>}>
            <fieldset className="mt-1">
              <legend className="sr-only">{f.positionLabel} to offer</legend>
              {f.all.length > 0 && (
                <div className="mb-2 flex gap-2">
                  <button type="button" onClick={() => set({ checked: f.all })} className="min-h-10 rounded-full border border-slate-600 px-3 text-xs font-bold text-slate-200 active:bg-slate-800">Select all</button>
                  <button type="button" onClick={() => set({ checked: [] })} className="min-h-10 rounded-full border border-slate-600 px-3 text-xs font-bold text-slate-200 active:bg-slate-800">Clear all</button>
                  <span className="self-center text-xs text-slate-400">{positions.length} of {f.all.length} ticked</span>
                </div>
              )}
              <div className="grid gap-1 rounded-xl border border-slate-600 bg-slate-950 p-2 sm:grid-cols-2">
                {f.all.length === 0 && <p className="p-2 text-sm text-slate-400">No choices yet. Add your own below.</p>}
                {f.all.map((p) => (
                  <div key={p} className="flex items-center rounded-lg hover:bg-slate-800">
                    <label className="flex min-h-12 flex-1 items-center gap-3 px-2 text-sm text-slate-100">
                      <input type="checkbox" className="h-5 w-5 accent-amber-500" checked={f.checked.includes(p)} onChange={() => toggle(p)} />
                      {p}
                    </label>
                    {!f.baseP.includes(p) && (
                      <button type="button" onClick={() => removeP(p)} aria-label={`Remove ${p} from the list`} title="Remove from the list" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg text-red-300 active:bg-red-500/10">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  aria-label={`Add your own ${f.positionLabel.toLowerCase()}`}
                  className={`${input} mt-0 h-12 min-w-0 flex-1`}
                  value={custom}
                  maxLength={40}
                  placeholder="Add your own…"
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustom()
                    }
                  }}
                />
                <button type="button" onClick={addCustom} className="min-h-12 rounded-xl border border-slate-600 px-4 text-sm font-bold text-slate-100 active:bg-slate-800">Add</button>
              </div>
            </fieldset>
          </Q>

          {!editing && (
            <Q n={4} label="Starter measurables" help={<>The numbers coaches ask about. The four most important are ticked for you. Tick up to {MAX_METRICS} that matter for Ever, or add your own. They become the boxes on the sport page. You type the actual numbers, and the date they were measured, later in Bio &amp; metrics. You can add or remove boxes there at any time.</>}>
              <fieldset className="mt-1">
                <legend className="sr-only">Starter measurables</legend>
                <div className="mb-2 flex items-center gap-2">
                  <button type="button" onClick={() => set({ checkedM: f.allM.slice(0, 4) })} className="min-h-10 rounded-full border border-slate-600 px-3 text-xs font-bold text-slate-200 active:bg-slate-800">Top 4 only</button>
                  <button type="button" onClick={() => set({ checkedM: [] })} className="min-h-10 rounded-full border border-slate-600 px-3 text-xs font-bold text-slate-200 active:bg-slate-800">Clear all</button>
                  <span className="text-xs text-slate-400">{metricKeys.length} of {MAX_METRICS} ticked</span>
                </div>
                <div className="grid gap-1 rounded-xl border border-slate-600 bg-slate-950 p-2 sm:grid-cols-2">
                  {f.allM.length === 0 && <p className="p-2 text-sm text-slate-400">No suggestions for this sport. Add your own below, or add them later.</p>}
                  {f.allM.map((k) => {
                    const on = f.checkedM.includes(k)
                    return (
                      <div key={k} className="flex items-center rounded-lg hover:bg-slate-800">
                        <label className={`flex min-h-12 flex-1 items-center gap-3 px-2 text-sm ${!on && metricKeys.length >= MAX_METRICS ? 'text-slate-500' : 'text-slate-100'}`}>
                          <input type="checkbox" className="h-5 w-5 accent-amber-500" checked={on} disabled={!on && metricKeys.length >= MAX_METRICS} onChange={() => toggleM(k)} />
                          {mshow(k)}
                        </label>
                        {!f.baseM.includes(k) && (
                          <button type="button" onClick={() => removeM(k)} aria-label={`Remove ${mshow(k)} from the list`} title="Remove from the list" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg text-red-300 active:bg-red-500/10">
                            ✕
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
                  <input aria-label="Add your own measurable" className={`${input} mt-0 h-12`} value={customM.label} maxLength={40} placeholder="Add your own, like 100m time" onChange={(e) => setCustomM((p) => ({ ...p, label: e.target.value }))} />
                  <input aria-label="Unit for your measurable" className={`${input} mt-0 h-12`} value={customM.unit} maxLength={10} placeholder="Unit (sec)" onChange={(e) => setCustomM((p) => ({ ...p, unit: e.target.value }))} />
                  <button type="button" onClick={addCustomM} className="min-h-12 rounded-xl border border-slate-600 px-4 text-sm font-bold text-slate-100 active:bg-slate-800">Add</button>
                </div>
              </fieldset>
            </Q>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy || !f.label.trim() || positions.length === 0} className="min-h-12 rounded-xl bg-amber-500 px-6 font-bold text-slate-950 active:bg-amber-400 disabled:opacity-40">
              {busy ? 'Saving…' : editing ? 'Save settings' : 'Add sport'}
            </button>
            {positions.length === 0 && <span className="self-center text-sm text-amber-300">Tick or add at least one {f.positionLabel.toLowerCase()}.</span>}
          </div>
        </>
      )}
      <button type="button" onClick={onCancel} className="min-h-12 rounded-xl border border-slate-600 px-5 text-sm font-bold text-slate-100 active:bg-slate-800">
        Cancel
      </button>
    </form>
  )
}

export default function Sports({ store, setStore }: { store: Store; setStore: (s: Store) => void }) {
  const [mode, setMode] = useState<null | 'add' | string>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [added, setAdded] = useState<SportConfig | null>(null)
  const [showHow, setShowHow] = useState(false)
  const [tip, setTip] = useState(false)
  const tipTimer = useRef<number | undefined>(undefined)
  const openTip = () => {
    window.clearTimeout(tipTimer.current)
    setTip(true)
  }
  const closeTip = () => {
    window.clearTimeout(tipTimer.current)
    tipTimer.current = window.setTimeout(() => setTip(false), 150)
  }
  const existingIds = store.sports.map((s) => s.id)

  const call = async (body: Record<string, unknown>) => {
    setBusy(true)
    setError('')
    try {
      const r = await api<{ sports: SportConfig[] }>('sports.php', body)
      setStore({ ...store, sports: r.sports })
      return r.sports
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server')
      return null
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (c: SportConfig) => {
    if (!c.visible) {
      const left = sportGaps(c, mergeSport(c, (store.content[c.id] as never) ?? null)).gaps.length
      if (left > 0 && !window.confirm(`${c.label} still has ${left} items showing placeholders. Show it on the website anyway?`)) return
    }
    await call({ action: 'visibility', id: c.id, visible: !c.visible })
  }

  const btn = 'inline-flex min-h-12 items-center rounded-xl border px-4 text-sm font-bold active:bg-slate-800'

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-50">Sports</h1>
        <p className="mt-2 text-sm text-slate-400">Every sport has its own page, printed profile, schedule and teams. Add a new sport here, or hide one from the website without deleting anything.</p>
      </div>

      {error && mode === null && (
        <p role="alert" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {added && (
        <section role="status" className="rounded-3xl border border-emerald-500/50 bg-emerald-500/10 p-5 text-sm text-emerald-100">
          <p className="font-bold">✓ {added.label} was added. It is hidden for now.</p>
          <p className="mt-1">Next: open its page to fill in the details.</p>
          <a href={`#${added.id}/bio`} className="mt-3 inline-flex min-h-12 items-center rounded-xl bg-emerald-500 px-5 font-bold text-slate-950">
            Fill in {added.label} →
          </a>
        </section>
      )}

      <ul className="space-y-3">
        {store.sports.map((c, i) => (
          <li key={c.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span aria-hidden className="h-5 w-5 shrink-0 rounded-full" style={{ background: c.accent }} />
              <h2 className="text-lg font-bold text-slate-50">{c.label}</h2>
              <span className="text-sm text-slate-400">/{c.id}/</span>
              <span className={`ml-auto rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${c.visible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-200'}`}>{c.visible ? 'Showing on the website' : 'Hidden'}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void toggle(c)} className={`${btn} ${c.visible ? 'border-slate-600 text-slate-100' : 'border-amber-500 bg-amber-500 text-slate-950'}`}>
                {c.visible ? 'Hide from the website' : 'Show on the website'}
              </button>
              <a href={`#${c.id}/bio`} className={`${btn} border-slate-600 text-slate-100`}>Fill in pages</a>
              <a href={`/${c.id}/`} target="_blank" rel="noopener noreferrer" className={`${btn} border-slate-600 text-slate-100`}>{c.visible ? 'View page' : 'Preview page'}</a>
              <button type="button" onClick={() => { setError(''); setMode(mode === c.id ? null : c.id) }} className={`${btn} border-slate-600 text-slate-100`}>Edit settings</button>
              <button type="button" disabled={busy || i === 0} aria-label={`Move ${c.label} up`} onClick={() => void call({ action: 'move', id: c.id, dir: -1 })} className={`${btn} border-slate-600 text-slate-100 disabled:opacity-40`}>↑</button>
              <button type="button" disabled={busy || i === store.sports.length - 1} aria-label={`Move ${c.label} down`} onClick={() => void call({ action: 'move', id: c.id, dir: 1 })} className={`${btn} border-slate-600 text-slate-100 disabled:opacity-40`}>↓</button>
            </div>
            {mode === c.id && (
              <div className="mt-4">
                <SportForm
                  initial={fromConfig(c)}
                  editing
                  existingIds={existingIds}
                  busy={busy}
                  error={error}
                  onCancel={() => setMode(null)}
                  onSubmit={async (b) => {
                    if (await call({ action: 'update', ...b, id: c.id })) setMode(null)
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      {showHow && <HowTo onClose={() => setShowHow(false)} />}

      {mode === 'add' ? (
        <>
          {!showHow && (
            <button type="button" onClick={() => setShowHow(true)} className="min-h-12 rounded-xl border border-amber-500/60 px-4 text-sm font-bold text-amber-300 active:bg-amber-500/20">
              How to add a sport
            </button>
          )}
          <SportForm
            initial={blankForm}
            editing={false}
            existingIds={existingIds}
            busy={busy}
            error={error}
            onCancel={() => setMode(null)}
            onSubmit={async (b) => {
              const list = await call({ action: 'create', ...b })
              if (list) {
                setAdded(list.find((s) => s.id === b.id) ?? null)
                setMode(null)
              }
            }}
          />
        </>
      ) : (
        <div className="relative inline-block" onPointerEnter={openTip} onPointerLeave={closeTip} onFocus={openTip} onBlur={closeTip}>
          <button type="button" onClick={() => { setTip(false); setError(''); setAdded(null); setMode('add') }} className="min-h-12 rounded-xl bg-amber-500 px-6 font-bold text-slate-950 active:bg-amber-400">
            + Add a sport
          </button>
          {tip && (
            <div className="absolute left-0 top-full z-20 pt-1">
              <button
                type="button"
                onClick={() => { setTip(false); setShowHow(true) }}
                className="w-72 rounded-xl border border-amber-500/60 bg-slate-950 p-3 text-left text-sm font-semibold leading-snug text-amber-200 shadow-lg shadow-black/50"
              >
                How to add a sport (about 5 minutes, no code)
                <span className="mt-1 block text-xs font-normal text-slate-300">Click here to read the steps.</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
