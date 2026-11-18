import { useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, api } from '../lib/api'
import type { SportConfig } from '../data/recruitingData'
import { CATALOG, emojiFor, slugify } from '../data/sportCatalog'
import { mergeSport } from '../lib/recruiting'
import type { Store } from '../lib/recruiting'
import { HelpTip, shrink } from './fields'
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
  navStyle: 'text' | 'emoji' | 'image'
  navImage: 'auto' | 'custom'
  emoji: string
  cardUrl: string
  cardData: string | null
}

const blankForm: FormState = { pick: '', label: '', id: '', idTouched: false, accent: COLORS[0][1], positionLabel: 'Positions', positionStyle: 'multi', all: [], checked: [], handedness: false, allM: [], checkedM: [], baseP: [], baseM: [], navStyle: 'text', navImage: 'auto', emoji: '🏅', cardUrl: '', cardData: null }

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
    navStyle: 'text',
    navImage: 'auto',
    emoji: c.emoji,
    cardUrl: '',
    cardData: null,
    baseM: c.metrics.map(([l, u]) => mkey(l, u)),
    checked: [],
    handedness: c.handedness,
    allM: c.metrics.map(([l, u]) => mkey(l, u)),
    checkedM: [],
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
    navStyle: c.navStyle,
    navImage: c.navImage,
    emoji: c.emoji || emojiFor(c.id),
    cardUrl: c.cardImage,
    cardData: null,
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
        <li><strong>Tick the positions</strong> you want to offer, and the <strong>measurables</strong> coaches ask about. Nothing is ticked for you, and you can add your own.</li>
        <li><strong>Press Add sport.</strong> It starts hidden, so nobody else can see it yet.</li>
        <li><strong>Fill in its pages.</strong> The sport gets its own button at the top of this screen for its photo, measurables, teams, film and schedule, the same as Softball.</li>
        <li><strong>Press “Show on the website”</strong> on this screen when you are ready.</li>
      </ol>
      <p className="mt-2">To take a sport off the website, press <strong>Hide</strong>. Nothing is deleted, and you can show it again any time. To remove a sport for good, press <strong>Delete…</strong> on its row. You will be asked to confirm first.</p>
    </section>
  )
}

function SportForm({ initial, editing, existingIds, photoUrl, busy, error, onSubmit, onCancel }: { initial: FormState; editing: boolean; existingIds: string[]; photoUrl: string; busy: boolean; error: string; onSubmit: (body: Record<string, unknown>, cardData: string | null) => void; onCancel: () => void }) {
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
      navStyle: f.navStyle,
      navImage: f.navImage,
      emoji: f.emoji,
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
    }, f.navStyle === 'image' && f.navImage === 'custom' ? f.cardData : null)

  const [uploadError, setUploadError] = useState('')
  const pickFile = async (file: File | undefined) => {
    if (!file) return
    setUploadError('')
    try {
      set({ cardData: await shrink(file, 1200), navImage: 'custom' })
    } catch {
      setUploadError('This browser cannot read that picture type. Save it as a JPEG or PNG and try again.')
    }
  }
  const realPhoto = photoUrl !== '' && !photoUrl.startsWith('/img/hero-')
  const tileImage = f.navImage === 'custom' ? f.cardData ?? f.cardUrl : realPhoto ? photoUrl : ''
  const needsImage = f.navStyle === 'image' && f.navImage === 'custom' && !f.cardData && !f.cardUrl

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

          <Q n={3} label="Menu button" help={<>This is the button for the sport in the menu at the top of every page, the one people click to go to that sport. <strong>Text</strong> shows the sport’s name, like Softball today. <strong>Emoji</strong> shows a small emoji, like 🥎. <strong>Image</strong> shows a small round picture. Visitors can hover to see the name, and screen readers still read it. You can switch any time, using the Text / Emoji / Image switch on the sport’s row or Edit settings.</>}>
            <div className="mt-1 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Menu button">
              {([
                ['text', 'Text', 'The sport name in words, like today.', <span key="t" className="rounded-full px-3 py-2 text-sm font-bold text-slate-200">{f.label || 'Sport name'}</span>],
                ['emoji', 'Emoji', 'A small emoji you click.', <span key="e" aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-2xl">{f.emoji || '🏅'}</span>],
                ['image', 'Image', 'A small round picture you click.', <span key="i" aria-hidden className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 text-xl" style={{ borderColor: f.accent, background: `${f.accent}33` }}>{tileImage ? <img src={tileImage} alt="" className="h-full w-full object-cover" /> : f.emoji || '🏅'}</span>],
              ] as const).map(([v, name, desc, preview]) => (
                <button key={v} type="button" role="radio" aria-checked={f.navStyle === v} onClick={() => set({ navStyle: v })} className={`rounded-2xl border-2 p-3 text-left ${f.navStyle === v ? 'border-amber-500' : 'border-slate-700'}`}>
                  <span className="flex h-14 items-center justify-center rounded-xl border border-slate-700 bg-slate-950">{preview}</span>
                  <span className="mt-2 block text-sm font-bold text-slate-100">{name}</span>
                  <span className="block text-xs text-slate-400">{desc}</span>
                </button>
              ))}
            </div>

            {f.navStyle !== 'text' && (
              <div className="mt-3 space-y-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                <label className="block text-sm font-semibold text-slate-200">
                  Emoji
                  <span className="block text-xs font-normal text-slate-400">{f.navStyle === 'emoji' ? 'This is the button. Paste or type any emoji you like.' : 'Used when there is no picture yet. Paste or type any emoji.'}</span>
                  <input className={`${input} h-12 text-2xl`} style={{ width: '7rem' }} value={f.emoji} maxLength={8} aria-label="Menu emoji" onChange={(e) => set({ emoji: e.target.value })} />
                </label>
              </div>
            )}

            {f.navStyle === 'image' && (
              <div className="mt-3 space-y-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                <p className="text-sm font-bold text-slate-100">Which picture?</p>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${f.navImage === 'auto' ? 'border-amber-500' : 'border-slate-700'}`}>
                  <input type="radio" name={`${uid}-img`} checked={f.navImage === 'auto'} onChange={() => set({ navImage: 'auto' })} className="mt-0.5 h-5 w-5 accent-amber-500" />
                  <span>
                    <span className="block font-bold text-slate-100">Recommended picture</span>
                    <span className="block text-slate-300">Uses Ever’s photo for this sport (add it on the sport’s Bio step). Until then it shows the emoji on a colored circle, so the button is never blank.</span>
                  </span>
                </label>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${f.navImage === 'custom' ? 'border-amber-500' : 'border-slate-700'}`}>
                  <input type="radio" name={`${uid}-img`} checked={f.navImage === 'custom'} onChange={() => set({ navImage: 'custom' })} className="mt-0.5 h-5 w-5 accent-amber-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-100">Use my own picture</span>
                    <span className="block text-slate-300">Choose any JPEG, PNG or WebP from your computer. It is shown as a small circle, so a simple, centered picture works best.</span>
                    {f.navImage === 'custom' && (
                      <span className="mt-2 flex flex-wrap items-center gap-3">
                        <label className="inline-flex min-h-12 cursor-pointer items-center rounded-xl border border-slate-600 px-4 text-sm font-bold text-slate-100 active:bg-slate-800">
                          {f.cardData || f.cardUrl ? 'Choose a different picture' : 'Choose a picture'}
                          <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = '' }} />
                        </label>
                        {(f.cardData || f.cardUrl) && <img src={f.cardData ?? f.cardUrl} alt="Your chosen picture" className="h-16 w-16 rounded-full border border-slate-600 object-cover" />}
                      </span>
                    )}
                    {uploadError && <span role="alert" className="mt-2 block text-red-300">{uploadError}</span>}
                  </span>
                </label>
              </div>
            )}
          </Q>

          <Q n={4} label={`${f.positionLabel || 'Positions'} to offer`} help={<>This is the checklist you will choose from when you fill in Ever’s bio. Tick the ones that apply to her. Add your own below if something is missing. You can change this list later.</>}>
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
            <Q n={5} label="Starter measurables" help={<>The numbers coaches ask about. Nothing is ticked for you. Tick up to {MAX_METRICS} that matter for Ever, or add your own. They become the boxes on the sport page. You type the actual numbers, and the date they were measured, later in Bio &amp; metrics. You can add or remove boxes there at any time.</>}>
              <fieldset className="mt-1">
                <legend className="sr-only">Starter measurables</legend>
                <div className="mb-2 flex items-center gap-2">
                  <button type="button" onClick={() => set({ checkedM: f.allM.slice(0, 4) })} className="min-h-10 rounded-full border border-slate-600 px-3 text-xs font-bold text-slate-200 active:bg-slate-800">Pick the top 4</button>
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
            <button type="submit" disabled={busy || !f.label.trim() || positions.length === 0 || needsImage} className="min-h-12 rounded-xl bg-amber-500 px-6 font-bold text-slate-950 active:bg-amber-400 disabled:opacity-40">
              {busy ? 'Saving…' : editing ? 'Save settings' : 'Add sport'}
            </button>
            {positions.length === 0 && <span className="self-center text-sm text-amber-300">Tick or add at least one {f.positionLabel.toLowerCase()}.</span>}
            {needsImage && <span className="self-center text-sm text-amber-300">Choose your image, or switch to the recommended one.</span>}
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
  const [erasing, setErasing] = useState<{ id: string; videos: number; workoutEntries: number } | null>(null)
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
  const photoOf = (id: string) => ((store.content[id] as { photo?: string } | null | undefined)?.photo ?? '')

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

  const uploadCard = async (id: string, image: string) => {
    setBusy(true)
    setError('')
    try {
      await api('photo.php', { action: 'upload', kind: 'card', sport: id, image })
      return true
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not upload the picture')
      return false
    } finally {
      setBusy(false)
    }
  }

  const askErase = async (c: SportConfig) => {
    setBusy(true)
    setError('')
    setMode(null)
    try {
      const r = await api<{ impact: { videos: number; workoutEntries: number } }>('sports.php', { action: 'impact', id: c.id })
      setErasing({ id: c.id, ...r.impact })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server')
    } finally {
      setBusy(false)
    }
  }

  const erase = async (c: SportConfig) => {
    setBusy(true)
    setError('')
    try {
      const r = await api<{ sports: SportConfig[] }>('sports.php', { action: 'delete', id: c.id, confirm: true })
      const content = { ...store.content }
      delete content[c.id]
      setStore({ sports: r.sports, content })
      setErasing(null)
      setAdded(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server')
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

      {error && mode === null && !erasing && (
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div role="group" aria-label={`Menu button for ${c.label}`} className="inline-flex overflow-hidden rounded-xl border border-slate-600">
                <span className="flex items-center bg-slate-800 px-3 text-xs font-bold uppercase tracking-wider text-slate-300">Menu button</span>
                {(['text', 'emoji', 'image'] as const).map((v) => (
                  <button key={v} type="button" disabled={busy} aria-pressed={c.navStyle === v} onClick={() => c.navStyle !== v && void call({ action: 'navStyle', id: c.id, navStyle: v })} className={`min-h-12 px-4 text-sm font-bold ${c.navStyle === v ? 'bg-amber-500 text-slate-950' : 'text-slate-100 active:bg-slate-800'}`}>
                    {v === 'text' ? 'Text' : v === 'emoji' ? 'Emoji' : 'Image'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void toggle(c)} className={`${btn} ${c.visible ? 'border-slate-600 text-slate-100' : 'border-amber-500 bg-amber-500 text-slate-950'}`}>
                {c.visible ? 'Hide from the website' : 'Show on the website'}
              </button>
              <a href={`#${c.id}/bio`} className={`${btn} border-slate-600 text-slate-100`}>Fill in pages</a>
              <a href={`/${c.id}/`} target="_blank" rel="noopener noreferrer" className={`${btn} border-slate-600 text-slate-100`}>{c.visible ? 'View page' : 'Preview page'}</a>
              <button type="button" onClick={() => { setError(''); setMode(mode === c.id ? null : c.id) }} className={`${btn} border-slate-600 text-slate-100`}>Edit settings</button>
              <button type="button" disabled={busy || i === 0} aria-label={`Move ${c.label} up`} onClick={() => void call({ action: 'move', id: c.id, dir: -1 })} className={`${btn} border-slate-600 text-slate-100 disabled:opacity-40`}>↑</button>
              <button type="button" disabled={busy} onClick={() => void askErase(c)} className={`${btn} border-red-500/60 text-red-200`}>Delete…</button>
              <button type="button" disabled={busy || i === store.sports.length - 1} aria-label={`Move ${c.label} down`} onClick={() => void call({ action: 'move', id: c.id, dir: 1 })} className={`${btn} border-slate-600 text-slate-100 disabled:opacity-40`}>↓</button>
            </div>
            {erasing?.id === c.id && (
              <section role="alertdialog" aria-label={`Erase ${c.label}`} className="mt-4 rounded-2xl border border-red-500/60 bg-red-500/10 p-4 text-sm leading-relaxed text-red-50">
                <p className="text-base font-extrabold text-red-100">Are you sure? All the data will be erased for good.</p>
                <p className="mt-2">
                  This removes {c.label} everywhere: its page and printed profile, photo, teams and coaches, schedule, measurables, film and awards, its menu button, and its entries in the sitemap and chat. It is deleted from the website and the database
                  {erasing.videos > 0 && <>, along with {erasing.videos} uploaded video file{erasing.videos === 1 ? '' : 's'}</>}
                  {erasing.workoutEntries > 0 && <>, and {erasing.workoutEntries} workout log {erasing.workoutEntries === 1 ? 'entry' : 'entries'}</>}. <strong>This cannot be undone.</strong> To keep the data and only take it off the website, press Cancel and use Hide instead.
                </p>
                {error && (
                  <p role="alert" className="mt-3 rounded-xl border border-red-400/60 bg-red-950/60 p-3 text-red-100">
                    {error}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => void erase(c)} className="min-h-12 rounded-xl bg-red-600 px-5 text-sm font-extrabold text-white active:bg-red-500 disabled:opacity-50">
                    {busy ? 'Erasing…' : 'Yes, erase it for good'}
                  </button>
                  <button type="button" autoFocus disabled={busy} onClick={() => { setErasing(null); setError('') }} className="min-h-12 rounded-xl border-2 border-slate-300 px-5 text-sm font-bold text-slate-50 active:bg-slate-800">
                    Cancel
                  </button>
                </div>
              </section>
            )}
            {mode === c.id && (
              <div className="mt-4">
                <SportForm
                  initial={fromConfig(c)}
                  editing
                  existingIds={existingIds}
                  photoUrl={photoOf(c.id)}
                  busy={busy}
                  error={error}
                  onCancel={() => setMode(null)}
                  onSubmit={async (b, cardData) => {
                    if (cardData && !(await uploadCard(c.id, cardData))) return
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
            photoUrl=""
            busy={busy}
            error={error}
            onCancel={() => setMode(null)}
            onSubmit={async (b, cardData) => {
              let list = await call({ action: 'create', ...b })
              if (list && cardData && (await uploadCard(String(b.id), cardData))) list = await call({ action: 'list' })
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
