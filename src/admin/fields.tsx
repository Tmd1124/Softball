import { createContext, useContext, useId, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { ApiError, api } from '../lib/api'
import { formatPhone } from '../lib/format'
import { formatDateInput, hasAddress, mapLink, parseDate, showDate, showTime } from '../lib/schedule'
import QrCode, { qrPngBlob, qrSvgString } from '../recruit/QrCode'
import type { ScheduleEvent, TeamItem, TrainerItem } from '../data/recruitingData'

export type Path = (string | number)[]
type Node = Record<string, unknown>

export const SOFTBALL_POSITIONS = ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field', 'Designated Player', 'Utility']
export const BATS_THROWS = ['Bats: R / Throws: R', 'Bats: L / Throws: L', 'Bats: R / Throws: L', 'Bats: L / Throws: R', 'Bats: S / Throws: R', 'Bats: S / Throws: L']
export const BASKETBALL_POSITIONS = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center', 'Combo Guard', 'Wing', 'Forward']

const field = 'mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50 placeholder:text-slate-500'

export function getAt(o: unknown, path: Path): unknown {
  return path.reduce<unknown>((a, k) => (a as Node | undefined)?.[k as string], o)
}

export function setAt<T>(o: T, path: Path, v: unknown): T {
  const next = structuredClone(o)
  let cur = next as Node
  path.slice(0, -1).forEach((k) => (cur = cur[k as string] as Node))
  cur[path[path.length - 1] as string] = v
  return next
}

type SetDraft = (update: (d: unknown) => unknown) => void
export const DraftCtx = createContext<{ draft: unknown; setDraft: SetDraft; commit?: (update: (d: unknown) => unknown) => Promise<boolean> }>({ draft: null, setDraft: () => undefined })
export const useDraft = () => useContext(DraftCtx)

export function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <legend className="px-2 text-lg font-bold text-slate-50">{title}</legend>
      {hint && <p className="mb-3 text-sm text-slate-400">{hint}</p>}
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export function CollapseHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 text-left">
      <span className="text-lg font-bold text-slate-50">{title}</span>
      <span aria-hidden className="text-2xl">{open ? '➖' : '➕'}</span>
      <span className="sr-only">{open ? 'Minimize' : 'Maximize'}</span>
    </button>
  )
}

export function Collapsible({ title, hint, open, onToggle, children, boxRef }: { title: string; hint?: string; open: boolean; onToggle: () => void; children: ReactNode; boxRef?: RefObject<HTMLElement | null> }) {
  return (
    <section ref={boxRef} aria-label={title} className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <CollapseHeader title={title} open={open} onToggle={onToggle} />
      {open && (
        <>
          {hint && <p className="mb-3 text-sm text-slate-400">{hint}</p>}
          <div className="grid gap-3 sm:grid-cols-2">{children}</div>
        </>
      )}
    </section>
  )
}

export function HelpTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setOpen((o) => !o)
        }}
        aria-expanded={open}
        aria-label={`Why? ${label}`}
        className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/60 align-middle text-sm font-extrabold text-amber-400 active:bg-amber-500/20"
      >
        ?
      </button>
      {open && <span className="mt-2 block rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm font-normal leading-relaxed text-slate-100">{children}</span>}
    </>
  )
}

export function toYoutubeEmbed(v: string): string {
  const m = v.trim().match(/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : v
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function F({ path, label, area = false, wide = false, type = 'text', kind, placeholder, hint, id, help, normalize }: { help?: ReactNode; normalize?: (v: string) => string; id?: string; path: Path; label: string; area?: boolean; wide?: boolean; type?: 'text' | 'number'; kind?: 'phone' | 'email' | 'date' | 'time'; placeholder?: string; hint?: string }) {
  const { draft, setDraft } = useDraft()
  const value = String(getAt(draft, path) ?? '')
  const change = (v: string) => setDraft((d) => setAt(d, path, type === 'number' ? Number(v) : kind === 'phone' ? formatPhone(v) : kind === 'date' ? formatDateInput(v) : normalize ? normalize(v) : v))
  const badDate = kind === 'date' && value.length === 10 && parseDate(value) === null
  const bad = (kind === 'email' && value !== '' && !EMAIL_RE.test(value)) || badDate
  const uid = useId()
  const inputId = id ?? uid
  const wrapCls = `block ${wide || area ? 'sm:col-span-2' : ''}`
  const body = (
    <>
      {help ? (
        <>
          <label htmlFor={inputId} className="text-sm font-semibold text-slate-300">{label}</label>
          <HelpTip label={label}>{help}</HelpTip>
        </>
      ) : (
        <span className="text-sm font-semibold text-slate-300">{label}</span>
      )}
      {area ? (
        <textarea id={inputId} className={`${field} min-h-32 py-2`} value={value} onChange={(e) => change(e.target.value)} />
      ) : (
        <input
          id={inputId}
          className={`${field} h-12 ${bad ? 'border-red-500' : ''}`}
          type={kind === 'email' ? 'email' : kind === 'phone' ? 'tel' : kind === 'time' ? 'time' : type}
          inputMode={kind === 'phone' ? 'tel' : kind === 'email' ? 'email' : kind === 'date' ? 'numeric' : undefined}
          autoCapitalize={kind === 'email' ? 'none' : undefined}
          maxLength={kind === 'phone' ? 14 : undefined}
          aria-invalid={bad || undefined}
          value={value}
          placeholder={kind === 'phone' ? '(999) 999-9999' : kind === 'email' ? 'name@example.com' : kind === 'date' ? 'MM/DD/YYYY' : placeholder}
          onChange={(e) => change(e.target.value)}
        />
      )}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {bad && <span className="mt-1 block text-xs text-red-300">{kind === 'date' ? 'Enter a real date like 12/05/2026' : 'Enter an email like name@example.com'}</span>}
    </>
  )
  return help ? <div className={wrapCls}>{body}</div> : <label className={wrapCls}>{body}</label>
}

export function Pick({ path, label, options, blank = 'Select…', wide = false, help }: { path: Path; label: string; options: string[]; blank?: string; wide?: boolean; help?: ReactNode }) {
  const { draft, setDraft } = useDraft()
  const value = String(getAt(draft, path) ?? '')
  const uid = useId()
  const body = (
    <>
      {help ? (
        <>
          <label htmlFor={uid} className="text-sm font-semibold text-slate-300">{label}</label>
          <HelpTip label={label}>{help}</HelpTip>
        </>
      ) : (
        <span className="text-sm font-semibold text-slate-300">{label}</span>
      )}
      <select id={uid} className={`${field} h-12`} value={options.includes(value) ? value : ''} onChange={(e) => setDraft((d) => setAt(d, path, e.target.value))}>
        <option value="">{blank}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </>
  )
  const cls = `block ${wide ? 'sm:col-span-2' : ''}`
  return help ? <div className={cls}>{body}</div> : <label className={cls}>{body}</label>
}

export function PositionChecklist({ path, label, options }: { path: Path; label: string; options: string[] }) {
  const { draft, setDraft } = useDraft()
  const chosen = String(getAt(draft, path) ?? '').split(' / ').filter((x) => options.includes(x))
  const toggle = (o: string) => {
    const next = options.filter((x) => (x === o ? !chosen.includes(o) : chosen.includes(x)))
    setDraft((d) => setAt(d, path, next.join(' / ')))
  }
  return (
    <div className="sm:col-span-2">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <details className="group relative mt-1">
        <summary className={`${field} flex h-12 cursor-pointer list-none items-center justify-between`}>
          <span className={chosen.length ? '' : 'text-slate-500'}>{chosen.length ? chosen.join(' / ') : 'Select positions…'}</span>
          <span aria-hidden className="text-slate-400 group-open:rotate-180">▾</span>
        </summary>
        <div className="mt-1 grid gap-1 rounded-xl border border-slate-600 bg-slate-950 p-2 sm:grid-cols-2">
          {options.map((o) => (
            <label key={o} className="flex min-h-12 items-center gap-3 rounded-lg px-2 text-sm text-slate-100 hover:bg-slate-800">
              <input type="checkbox" className="h-5 w-5 accent-amber-500" checked={chosen.includes(o)} onChange={() => toggle(o)} />
              {o}
            </label>
          ))}
        </div>
      </details>
    </div>
  )
}

export function PositionPair({ path, label, options }: { path: Path; label: string; options: string[] }) {
  const { draft, setDraft } = useDraft()
  const [primary = '', secondary = ''] = String(getAt(draft, path) ?? '').split(' / ')
  const set = (p: string, q: string) => setDraft((d) => setAt(d, path, p ? (q && q !== p ? `${p} / ${q}` : p) : ''))
  const sel = (title: string, value: string, onChange: (v: string) => void, blank: string) => (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{title}</span>
      <select className={`${field} h-12`} value={options.includes(value) ? value : ''} onChange={(e) => onChange(e.target.value)} aria-label={`${label}: ${title}`}>
        <option value="">{blank}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
  return (
    <>
      {sel('Primary position', primary, (v) => set(v, secondary), 'Select…')}
      {sel('Secondary position', secondary, (v) => set(primary, v), 'None')}
    </>
  )
}

export function List({ path, noun, blank, max, children }: { path: Path; noun: string; blank: Node; max: number; children: (i: number) => ReactNode }) {
  const { draft, setDraft } = useDraft()
  const rows = (getAt(draft, path) as Node[]) ?? []
  return (
    <div className="space-y-3 sm:col-span-2">
      {rows.map((_, i) => (
        <div key={i} className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4 sm:grid-cols-2">
          {children(i)}
          <button
            type="button"
            onClick={() => setDraft((d) => setAt(d, path, rows.filter((_, j) => j !== i)))}
            className="min-h-12 rounded-xl border border-red-500/50 px-4 text-sm font-semibold text-red-200 active:bg-red-500/10 sm:col-span-2 sm:justify-self-end"
          >
            Delete this {noun}
          </button>
        </div>
      ))}
      {rows.length < max && (
        <button type="button" onClick={() => setDraft((d) => setAt(d, path, [...rows, blank]))} className="min-h-12 rounded-xl border border-slate-600 px-4 text-sm font-semibold text-slate-100 active:bg-slate-800">
          Add {noun}
        </button>
      )}
    </div>
  )
}

export function QrCard({ url, hint, file, open, onToggle }: { url: string; hint: string; file: string; open: boolean; onToggle: () => void }) {
  const valid = /^https:\/\/\S+$/i.test(url)
  const save = (blob: Blob, name: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const btn = 'inline-flex min-h-12 items-center rounded-xl border border-slate-600 px-4 text-sm font-semibold text-slate-100 active:bg-slate-800'
  return (
    <Collapsible title="QR code" hint={hint} open={open} onToggle={onToggle}>
      <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
        {valid ? <QrCode text={url} label={`QR code linking to ${url}`} className="h-40 w-40 rounded-lg" /> : <p className="text-sm text-slate-400">Enter a site address starting with https:// to see the QR code.</p>}
        {valid && (
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btn} onClick={() => void qrPngBlob(url).then((b) => save(b, `${file}.png`))}>Download PNG</button>
            <button type="button" className={btn} onClick={() => save(new Blob([qrSvgString(url)], { type: 'image/svg+xml' }), `${file}.svg`)}>Download SVG</button>
          </div>
        )}
      </div>
    </Collapsible>
  )
}

export async function shrink(file: File, max = 1400): Promise<string> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * k)
  canvas.height = Math.round(bmp.height * k)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export function PhotoField({ sport }: { sport: string }) {
  const { draft, setDraft } = useDraft()
  const url = String(getAt(draft, ['photo']) ?? '')
  const focus = Number(getAt(draft, ['photoFocus']) ?? 20)
  const real = url !== '' && !url.startsWith('/img/hero-')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [address, setAddress] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const run = async (work: () => Promise<string>, failure: string) => {
    setBusy(true)
    setError('')
    try {
      const next = await work()
      setDraft((d) => setAt(d, ['photo'], next))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : failure)
    } finally {
      setBusy(false)
    }
  }

  const pick = (file: File | undefined) => {
    if (!file) return
    void run(async () => {
      let image: string
      try {
        image = await shrink(file)
      } catch {
        throw new Error('This browser cannot read that picture type. Save it as a JPEG or PNG and try again.')
      }
      return (await api<{ url: string }>('photo.php', { action: 'upload', sport, image })).url
    }, 'This browser cannot read that picture type. Save it as a JPEG or PNG and try again.')
  }

  const fromAddress = () =>
    run(async () => {
      const r = await api<{ url: string }>('photo.php', { action: 'fetch', sport, url: address.trim() })
      setAddress('')
      return r.url
    }, 'Could not reach the server')

  const remove = () =>
    run(async () => {
      await api('photo.php', { action: 'delete', sport })
      return ''
    }, 'Could not reach the server')

  const btn = 'min-h-12 rounded-xl px-5 text-sm font-bold disabled:opacity-50'
  return (
    <div className="sm:col-span-2">
      <span className="text-sm font-semibold text-slate-300">Photo of Ever</span>
      <div className="mt-1 flex flex-wrap items-start gap-4">
        <div className="h-32 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-600 bg-slate-950">
          {real ? <img src={url} alt="Current photo of Ever" className="h-full w-full object-cover" style={{ objectPosition: `50% ${focus}%` }} /> : <div className="flex h-full items-center justify-center p-2 text-center text-xs text-slate-500">No photo yet</div>}
        </div>
        <div className="min-w-0 flex-1 space-y-3" style={{ minWidth: '14rem' }}>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className={`${btn} bg-amber-500 text-slate-950 active:bg-amber-400`}>
              {busy ? 'Working…' : real ? 'Replace from my computer' : 'Choose from my computer'}
            </button>
            {real && (
              <button type="button" disabled={busy} onClick={() => void remove()} className={`${btn} border border-red-500/50 font-semibold text-red-200 active:bg-red-500/10`}>
                Remove
              </button>
            )}
            <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
          </div>
          {real && (
            <div className="block">
              <span className="text-xs font-semibold text-slate-300">Crop focus: move up or down so Ever’s face is in frame</span>
              <HelpTip label="crop focus">The photo is shown in a tall frame, so part of it is cropped. This slider moves the picture up or down inside that frame. Slide it until Ever’s face is fully visible. It affects the sport page, the home page and the printed profile.</HelpTip>
              <input type="range" min={0} max={100} value={focus} onChange={(e) => setDraft((d) => setAt(d, ['photoFocus'], Number(e.target.value)))} className="mt-1 w-full accent-amber-500" aria-label="Photo focus" />
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="url"
              inputMode="url"
              autoCapitalize="none"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="…or paste an image address (https://…)"
              aria-label="Image address"
              className="h-12 min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50 placeholder:text-slate-500"
            />
            <button type="button" disabled={busy || !address.trim()} onClick={() => void fromAddress()} className={`${btn} border border-slate-600 font-semibold text-slate-100 active:bg-slate-800`}>
              Use
            </button>
          </div>
          <p className="text-xs text-slate-500">The address must point straight to a JPEG, PNG or WebP file. A portrait or action shot with Ever’s face near the top works best. Press Save changes to publish.</p>
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export function TeamsTable({ onPick }: { onPick: (n: number) => void }) {
  const { draft } = useDraft()
  const [open, setOpen] = useState(true)
  const teams = ((getAt(draft, ['teams']) as TeamItem[] | undefined) ?? []).map((t, n) => ({ t, n })).filter((x) => x.t.name || x.t.coach)
  const sorted = [...teams].sort((a, b) => (parseInt(b.t.year, 10) || 0) - (parseInt(a.t.year, 10) || 0))
  const th = 'sticky top-0 bg-slate-800 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-300'
  const td = 'whitespace-nowrap px-3 py-2 text-slate-100'
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5" aria-label="All teams and coaches">
      <CollapseHeader title="All teams & coaches" open={open} onToggle={() => setOpen((o) => !o)} />
      {open && <p className="mb-3 text-sm text-slate-400">Newest year first. Click a team to edit it. Scroll to see more than five.</p>}
      {!open ? null : sorted.length === 0 ? (
        <p className="text-sm text-slate-400">No teams yet. Add one above.</p>
      ) : (
        <div className="max-h-[17.5rem] overflow-auto rounded-xl border border-slate-700" tabIndex={0}>
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr>
                {['Year', 'Team', 'Type', 'Coach', 'Owner', 'Phone', 'Email'].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sorted.map(({ t, n }) => (
                <tr
                  key={n}
                  tabIndex={0}
                  onClick={() => onPick(n)}
                  onKeyDown={(e) => e.key === 'Enter' && onPick(n)}
                  aria-label={`Edit ${t.name}`}
                  className="h-[3.1rem] cursor-pointer hover:bg-slate-800 focus-visible:bg-slate-800"
                >
                  <td className={td}>{t.year}</td>
                  <td className={`${td} font-semibold`}>{t.name}</td>
                  <td className={td}>{t.type}</td>
                  <td className={td}>{t.coach}</td>
                  <td className={td}>{t.owner}</td>
                  <td className={td}>{t.phone}</td>
                  <td className={td}>{t.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function TrainersTable({ onPick }: { onPick: (n: number) => void }) {
  const { draft } = useDraft()
  const [open, setOpen] = useState(true)
  const rows = ((getAt(draft, ['trainers']) as TrainerItem[] | undefined) ?? []).map((t, n) => ({ t, n })).filter((x) => x.t.name)
  const th = 'sticky top-0 bg-slate-800 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-300'
  const td = 'whitespace-nowrap px-3 py-2 text-slate-100'
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5" aria-label="All personal training instructors">
      <CollapseHeader title="All personal training instructors" open={open} onToggle={() => setOpen((o) => !o)} />
      {open && <p className="mb-3 text-sm text-slate-400">Click an instructor to edit. Scroll to see more than five.</p>}
      {!open ? null : rows.length === 0 ? (
        <p className="text-sm text-slate-400">No instructors yet. Add one above.</p>
      ) : (
        <div className="max-h-[17.5rem] overflow-auto rounded-xl border border-slate-700" tabIndex={0}>
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr>
                {['Name', 'Phone', 'Email'].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map(({ t, n }) => (
                <tr
                  key={n}
                  tabIndex={0}
                  onClick={() => onPick(n)}
                  onKeyDown={(e) => e.key === 'Enter' && onPick(n)}
                  aria-label={`Edit ${t.name}`}
                  className="h-[3.1rem] cursor-pointer hover:bg-slate-800 focus-visible:bg-slate-800"
                >
                  <td className={`${td} font-semibold`}>{t.name}</td>
                  <td className={td}>{t.phone}</td>
                  <td className={td}>{t.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function EventsTable({ onPick }: { onPick: (n: number) => void }) {
  const { draft } = useDraft()
  const [open, setOpen] = useState(true)
  const rows = ((getAt(draft, ['schedule']) as ScheduleEvent[] | undefined) ?? []).map((e, n) => ({ e, n })).filter((x) => x.e.date || x.e.event)
  const th = 'sticky top-0 bg-slate-800 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-300'
  const td = 'whitespace-nowrap px-3 py-2 text-slate-100'
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5" aria-label="All schedule events">
      <CollapseHeader title="All schedule events" open={open} onToggle={() => setOpen((o) => !o)} />
      {open && <p className="mb-3 text-sm text-slate-400">In the order entered. Click an event to edit it. Scroll to see more than five.</p>}
      {!open ? null : rows.length === 0 ? (
        <p className="text-sm text-slate-400">No events yet. Add one above.</p>
      ) : (
        <div className="max-h-[17.5rem] overflow-auto rounded-xl border border-slate-700" tabIndex={0}>
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr>
                {['Date', 'Time', 'Event', 'Location', 'Map', 'Team', 'Info'].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map(({ e, n }) => (
                <tr
                  key={n}
                  tabIndex={0}
                  onClick={() => onPick(n)}
                  onKeyDown={(ev) => ev.key === 'Enter' && onPick(n)}
                  aria-label={`Edit ${e.event || e.date}`}
                  className="h-[3.1rem] cursor-pointer hover:bg-slate-800 focus-visible:bg-slate-800"
                >
                  <td className={td}>{showDate(e.date)}</td>
                  <td className={td}>{showTime(e.time)}</td>
                  <td className={`${td} font-semibold`}>{e.event}</td>
                  <td className={td}>{e.location}</td>
                  <td className={td}>{e.mapUrl ? 'Yes' : hasAddress(e.location) ? 'Auto' : ''}</td>
                  <td className={td}>{e.team}</td>
                  <td className={td}>{e.info}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function VideoUpload({ base, sport }: { base: Path; sport: string }) {
  const { draft, setDraft } = useDraft()
  const url = String(getAt(draft, [...base, 'videoUrl']) ?? '')
  const [pct, setPct] = useState<number | null>(null)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const send = (file: File) => {
    setError('')
    setPct(0)
    const form = new FormData()
    form.append('video', file)
    form.append('sport', sport)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/video.php')
    xhr.setRequestHeader('X-Requested-With', 'fetch')
    xhr.upload.onprogress = (e) => e.lengthComputable && setPct(Math.round((e.loaded / e.total) * 100))
    xhr.onerror = () => {
      setPct(null)
      setError('The upload failed. Check your connection and try again.')
    }
    xhr.onload = () => {
      setPct(null)
      let body: { url?: string; error?: string } = {}
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        body = { error: 'The server could not accept that video. Try a smaller file.' }
      }
      if (xhr.status === 200 && body.url) setDraft((d) => setAt(d, [...base, 'videoUrl'], body.url))
      else setError(body.error ?? 'The upload failed.')
    }
    xhr.send(form)
  }
  return (
    <div className="sm:col-span-2">
      <p className="text-sm font-semibold text-slate-300">
        Or upload a short clip from your computer (MP4, WebM or MOV)
        <HelpTip label="upload a clip">
          <strong>Best for short clips only.</strong> An uploaded file uses your own website's storage and bandwidth, can't be larger than your host's upload limit, and starts slower on a weak connection. Some phone formats (like iPhone .mov) won't play on every device. If you fill in both this and a YouTube link, the uploaded file is the one that plays. For anything long, use YouTube above.
        </HelpTip>
      </p>
      <input
        ref={input}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) send(f)
        }}
      />
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <button type="button" disabled={pct !== null} onClick={() => input.current?.click()} className="min-h-12 rounded-xl border border-slate-600 px-4 text-sm font-semibold text-slate-100 active:bg-slate-800 disabled:opacity-60">
          {pct !== null ? `Uploading… ${pct}%` : url ? 'Replace video file' : 'Upload from my computer'}
        </button>
        {url && pct === null && (
          <>
            <span className="text-sm text-emerald-300">Video file uploaded. It plays on the page instead of the embed link.</span>
            <button type="button" onClick={() => setDraft((d) => setAt(d, [...base, 'videoUrl'], ''))} className="min-h-12 rounded-xl border border-red-500/50 px-4 text-sm font-semibold text-red-200 active:bg-red-500/10">
              Remove video file
            </button>
          </>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  )
}

export function AddressFields({ base }: { base: Path }) {
  const { draft, setDraft } = useDraft()
  const location = String(getAt(draft, [...base, 'location']) ?? '')
  const mapUrl = String(getAt(draft, [...base, 'mapUrl']) ?? '')
  const uid = useId()
  const auto = hasAddress(location) ? mapLink(location) : ''
  const setAddress = (v: string) =>
    setDraft((d) => {
      const prevAuto = hasAddress(location) ? mapLink(location) : ''
      let next = setAt(d, [...base, 'location'], v)
      if (mapUrl === '' || mapUrl === prevAuto) next = setAt(next, [...base, 'mapUrl'], hasAddress(v) ? mapLink(v) : '')
      return next
    })
  const field = 'mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50 placeholder:text-slate-500 h-12'
  return (
    <>
      <div className="sm:col-span-2">
        <label htmlFor={`${uid}-addr`} className="text-sm font-semibold text-slate-300">Full address</label>
        <HelpTip label="Full address">
          Type the complete street address, including city, state and ZIP, like <strong>123 Main St, Atlanta, GA 30301</strong>. A complete address is what lets Google Maps find the exact place. A venue name alone, like “Field 3”, may open the wrong spot. Add the field or court number in the “Pool / field / court” box instead.
        </HelpTip>
        <input id={`${uid}-addr`} className={field} value={location} maxLength={200} placeholder="123 Main St, Atlanta, GA 30301" autoComplete="off" onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${uid}-map`} className="text-sm font-semibold text-slate-300">Google Maps link</label>
        <HelpTip label="Google Maps link">
          This fills in by itself from the address above, so coaches can tap it to get directions. You can paste a different Google Maps link here if you prefer. If you change the address later, the link updates too, unless you have pasted your own.
        </HelpTip>
        <div className="flex gap-2">
          <input id={`${uid}-map`} className={`${field} min-w-0 flex-1`} value={mapUrl} maxLength={500} placeholder="Fills in after you type the address" onChange={(e) => setDraft((d) => setAt(d, [...base, 'mapUrl'], e.target.value))} />
          {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex h-12 shrink-0 items-center rounded-xl border border-slate-600 px-4 text-sm font-bold text-slate-100 active:bg-slate-800">
              Test link
            </a>
          )}
          {auto && mapUrl !== auto && (
            <button type="button" onClick={() => setDraft((d) => setAt(d, [...base, 'mapUrl'], auto))} className="mt-1 h-12 shrink-0 rounded-xl border border-slate-600 px-4 text-sm font-bold text-slate-100 active:bg-slate-800">
              Use address link
            </button>
          )}
        </div>
      </div>
    </>
  )
}
