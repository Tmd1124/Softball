import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, api } from '../lib/api'
import { formatPhone } from '../lib/format'
import QrCode, { qrPngBlob, qrSvgString } from '../recruit/QrCode'

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
export const DraftCtx = createContext<{ draft: unknown; setDraft: SetDraft }>({ draft: null, setDraft: () => undefined })
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function F({ path, label, area = false, wide = false, type = 'text', kind, placeholder, hint }: { path: Path; label: string; area?: boolean; wide?: boolean; type?: 'text' | 'number'; kind?: 'phone' | 'email'; placeholder?: string; hint?: string }) {
  const { draft, setDraft } = useDraft()
  const value = String(getAt(draft, path) ?? '')
  const change = (v: string) => setDraft((d) => setAt(d, path, type === 'number' ? Number(v) : kind === 'phone' ? formatPhone(v) : v))
  const bad = kind === 'email' && value !== '' && !EMAIL_RE.test(value)
  return (
    <label className={`block ${wide || area ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      {area ? (
        <textarea className={`${field} min-h-32 py-2`} value={value} onChange={(e) => change(e.target.value)} />
      ) : (
        <input
          className={`${field} h-12 ${bad ? 'border-red-500' : ''}`}
          type={kind === 'email' ? 'email' : kind === 'phone' ? 'tel' : type}
          inputMode={kind === 'phone' ? 'tel' : kind === 'email' ? 'email' : undefined}
          autoCapitalize={kind === 'email' ? 'none' : undefined}
          maxLength={kind === 'phone' ? 14 : undefined}
          aria-invalid={bad || undefined}
          value={value}
          placeholder={kind === 'phone' ? '(999) 999-9999' : kind === 'email' ? 'name@example.com' : placeholder}
          onChange={(e) => change(e.target.value)}
        />
      )}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {bad && <span className="mt-1 block text-xs text-red-300">Enter an email like name@example.com</span>}
    </label>
  )
}

export function Pick({ path, label, options, blank = 'Select…', wide = false }: { path: Path; label: string; options: string[]; blank?: string; wide?: boolean }) {
  const { draft, setDraft } = useDraft()
  const value = String(getAt(draft, path) ?? '')
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <select className={`${field} h-12`} value={options.includes(value) ? value : ''} onChange={(e) => setDraft((d) => setAt(d, path, e.target.value))}>
        <option value="">{blank}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
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

export function QrCard({ url, hint, file }: { url: string; hint: string; file: string }) {
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
    <Card title="QR code" hint={hint}>
      <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
        {valid ? <QrCode text={url} label={`QR code linking to ${url}`} className="h-40 w-40 rounded-lg" /> : <p className="text-sm text-slate-400">Enter a site address starting with https:// to see the QR code.</p>}
        {valid && (
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btn} onClick={() => void qrPngBlob(url).then((b) => save(b, `${file}.png`))}>Download PNG</button>
            <button type="button" className={btn} onClick={() => save(new Blob([qrSvgString(url)], { type: 'image/svg+xml' }), `${file}.svg`)}>Download SVG</button>
          </div>
        )}
      </div>
    </Card>
  )
}

async function shrink(file: File, max = 1400): Promise<string> {
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
  const real = url !== '' && !url.startsWith('/img/hero-')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const r = await api<{ url: string }>('photo.php', { action: 'upload', sport, image: await shrink(file) })
      setDraft((d) => setAt(d, ['photo'], r.url))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not read that picture. Try a JPEG or PNG.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setError('')
    try {
      await api('photo.php', { action: 'delete', sport })
      setDraft((d) => setAt(d, ['photo'], ''))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sm:col-span-2">
      <span className="text-sm font-semibold text-slate-300">Photo of Ever</span>
      <div className="mt-1 flex flex-wrap items-center gap-4">
        <div className="h-32 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-600 bg-slate-950">
          {real ? <img src={url} alt="Current photo of Ever" className="h-full w-full object-cover" style={{ objectPosition: '50% 20%' }} /> : <div className="flex h-full items-center justify-center p-2 text-center text-xs text-slate-500">No photo yet</div>}
        </div>
        <div className="space-y-2">
          <label className="inline-flex min-h-12 cursor-pointer items-center rounded-xl bg-amber-500 px-5 text-sm font-bold text-slate-950 active:bg-amber-400">
            {busy ? 'Working…' : real ? 'Replace photo' : 'Upload photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} />
          </label>
          {real && (
            <button type="button" disabled={busy} onClick={() => void remove()} className="ml-2 min-h-12 rounded-xl border border-red-500/50 px-4 text-sm font-semibold text-red-200 active:bg-red-500/10">
              Remove
            </button>
          )}
          <p className="text-xs text-slate-500">A portrait or action shot with Ever’s face near the top works best. Press Save changes to publish it.</p>
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  )
}
