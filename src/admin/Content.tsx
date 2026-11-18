import { createContext, useContext, useEffect, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { ApiError, api } from '../lib/api'
import { defaultSite, defaultSports } from '../data/recruitingData'
import type { SiteData, SportData, SportId } from '../data/recruitingData'
import type { StoredContent } from '../lib/recruiting'
import { formatPhone } from '../lib/format'

export type Section = 'site' | SportId

type Path = (string | number)[]
type Node = Record<string, unknown>

const SOFTBALL_POSITIONS = ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field', 'Designated Player', 'Utility']
const BATS_THROWS = ['Bats: R / Throws: R', 'Bats: L / Throws: L', 'Bats: R / Throws: L', 'Bats: L / Throws: R', 'Bats: S / Throws: R', 'Bats: S / Throws: L']
const BASKETBALL_POSITIONS = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center', 'Combo Guard', 'Wing', 'Forward']

const field = 'mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50 placeholder:text-slate-500'

function getAt(o: unknown, path: Path): unknown {
  return path.reduce<unknown>((a, k) => (a as Node | undefined)?.[k as string], o)
}

function setAt<T>(o: T, path: Path, v: unknown): T {
  const next = structuredClone(o)
  let cur = next as Node
  path.slice(0, -1).forEach((k) => (cur = cur[k as string] as Node))
  cur[path[path.length - 1] as string] = v
  return next
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <legend className="px-2 text-lg font-bold text-slate-50">{title}</legend>
      {hint && <p className="mb-3 text-sm text-slate-400">{hint}</p>}
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

const DraftCtx = createContext<{ draft: unknown; setDraft: Dispatch<SetStateAction<unknown>> }>({ draft: null, setDraft: () => undefined })
const useDraft = () => useContext(DraftCtx)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function F({ path, label, area = false, wide = false, type = 'text', kind, placeholder }: { path: Path; label: string; area?: boolean; wide?: boolean; type?: 'text' | 'number'; kind?: 'phone' | 'email'; placeholder?: string }) {
  const { draft, setDraft } = useDraft()
  const value = String(getAt(draft, path) ?? '')
  const change = (v: string) => setDraft((d: unknown) => setAt(d, path, type === 'number' ? Number(v) : kind === 'phone' ? formatPhone(v) : v))
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
      {bad && <span className="mt-1 block text-xs text-red-300">Enter an email like name@example.com</span>}
    </label>
  )
}

function Pick({ path, label, options, blank = 'Select…', wide = false }: { path: Path; label: string; options: string[]; blank?: string; wide?: boolean }) {
  const { draft, setDraft } = useDraft()
  const value = String(getAt(draft, path) ?? '')
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <select className={`${field} h-12`} value={options.includes(value) ? value : ''} onChange={(e) => setDraft((d: unknown) => setAt(d, path, e.target.value))}>
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

function PositionChecklist({ path, label, options }: { path: Path; label: string; options: string[] }) {
  const { draft, setDraft } = useDraft()
  const chosen = String(getAt(draft, path) ?? '').split(' / ').filter((x) => options.includes(x))
  const toggle = (o: string) => {
    const next = options.filter((x) => (x === o ? !chosen.includes(o) : chosen.includes(x)))
    setDraft((d: unknown) => setAt(d, path, next.join(' / ')))
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

function PositionPair({ path, label, options }: { path: Path; label: string; options: string[] }) {
  const { draft, setDraft } = useDraft()
  const [primary = '', secondary = ''] = String(getAt(draft, path) ?? '').split(' / ')
  const set = (p: string, q: string) => setDraft((d: unknown) => setAt(d, path, p ? (q && q !== p ? `${p} / ${q}` : p) : ''))
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

function List({ path, noun, blank, max, children }: { path: Path; noun: string; blank: Node; max: number; children: (i: number) => ReactNode }) {
  const { draft, setDraft } = useDraft()
  const rows = (getAt(draft, path) as Node[]) ?? []
  return (
    <div className="space-y-3 sm:col-span-2">
      {rows.map((_, i) => (
        <div key={i} className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4 sm:grid-cols-2">
          {children(i)}
          <button
            type="button"
            onClick={() => setDraft((d: unknown) => setAt(d, path, rows.filter((_, j) => j !== i)))}
            className="min-h-12 rounded-xl border border-red-500/50 px-4 text-sm font-semibold text-red-200 active:bg-red-500/10 sm:col-span-2 sm:justify-self-end"
          >
            Delete this {noun}
          </button>
        </div>
      ))}
      {rows.length < max && (
        <button type="button" onClick={() => setDraft((d: unknown) => setAt(d, path, [...rows, blank]))} className="min-h-12 rounded-xl border border-slate-600 px-4 text-sm font-semibold text-slate-100 active:bg-slate-800">
          Add {noun}
        </button>
      )}
    </div>
  )
}

function Editor({ section, initial, stored, onSaved }: { section: Section; initial: SiteData | SportData; stored: boolean; onSaved: (c: StoredContent) => void }) {
  const [draft, setDraft] = useState<unknown>(initial)
  const [usingDefaults, setUsingDefaults] = useState(!stored)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const call = async (body: Record<string, unknown>) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      return (await api<{ content: StoredContent }>('recruiting.php', { section, ...body })).content
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server')
      return null
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    const c = await call({ action: 'save', data: draft })
    if (c) {
      onSaved(c)
      setUsingDefaults(false)
      setNotice('Saved. The public pages now show this.')
    }
  }

  const reset = async () => {
    if (!window.confirm('Discard everything saved in this section and go back to the built-in placeholders?')) return
    const c = await call({ action: 'reset' })
    if (c) {
      onSaved(c)
      setDraft(section === 'site' ? defaultSite : defaultSports[section])
      setUsingDefaults(true)
      setNotice('Reset to the built-in placeholders.')
    }
  }

  const sport = section !== 'site'
  const videoFields = (base: Path) => (
    <>
      <F path={[...base, 'title']} label="Title" />
      <F path={[...base, 'blurb']} label="Description" />
      <F path={[...base, 'length']} label="Length note" />
      <F path={[...base, 'embedUrl']} label="Embed URL" placeholder="https://www.youtube.com/embed/VIDEO_ID" />
    </>
  )

  return (
    <DraftCtx.Provider value={{ draft, setDraft }}>
    <div className="space-y-5">
      {usingDefaults && (
        <p className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200">
          Nothing saved here yet. The public site is showing the built-in placeholders. Edit and save to replace them.
        </p>
      )}
      {error && <p role="alert" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}

      {!sport ? (
        <>
          <Card title="Athlete">
            <F path={['athlete', 'name']} label="Name" />
            <F path={['athlete', 'classYear']} label="Class year" type="number" />
            <F path={['athlete', 'school']} label="School" />
            <F path={['athlete', 'location']} label="City, state" />
            <F path={['athlete', 'height']} label="Height" />
            <F path={['athlete', 'jersey']} label="Jersey number" />
            <F path={['siteUrl']} label="Site address" wide />
          </Card>
          <Card title="Academics">
            <F path={['academics', 'gpa']} label="GPA" />
            <F path={['academics', 'courses']} label="Honors / advanced courses" />
          </Card>
          <Card title="Recruiting contact" hint="Shown in the footer on every public page.">
            <F path={['contact', 'email']} label="Email" kind="email" />
            <F path={['contact', 'phone']} label="Phone" kind="phone" />
          </Card>
          <Card title="Parent / guardian">
            <F path={['contact', 'parent', 'name']} label="Name" wide />
            <F path={['contact', 'parent', 'email']} label="Email" kind="email" />
            <F path={['contact', 'parent', 'phone']} label="Phone" kind="phone" />
          </Card>
          <Card title="Coach reference links" hint="Footer links. Use full web addresses.">
            <F path={['contact', 'hsCoach', 'label']} label="High school link text" />
            <F path={['contact', 'hsCoach', 'url']} label="High school link address" />
            <F path={['contact', 'travelCoach', 'label']} label="Travel / AAU link text" />
            <F path={['contact', 'travelCoach', 'url']} label="Travel / AAU link address" />
          </Card>
          <Card title="Social">
            <F path={['contact', 'social', 'x', 'handle']} label="X / Twitter handle" />
            <F path={['contact', 'social', 'x', 'url']} label="X / Twitter address" />
            <F path={['contact', 'social', 'instagram', 'handle']} label="Instagram handle" />
            <F path={['contact', 'social', 'instagram', 'url']} label="Instagram address" />
          </Card>
        </>
      ) : (
        <>
          <Card title="Bio">
            {section === 'softball' ? (
              <>
                <PositionChecklist path={['positions']} label="Positions" options={SOFTBALL_POSITIONS} />
                <Pick path={['handedness']} label="Bats / throws" options={BATS_THROWS} wide />
              </>
            ) : (
              <PositionPair path={['positions']} label="Positions" options={BASKETBALL_POSITIONS} />
            )}
            <F path={['team']} label="Team and division / circuit" wide />
            <F path={['photo']} label="Action photo address" placeholder="/img/photo.jpg or https://…" wide />
          </Card>
          <Card title="Verified metrics" hint="Each box shows “(Verified …)” under the value. Keep the pop time box if the scouting summary uses it.">
            <List path={['metrics']} noun="metric" max={8} blank={{ key: `m${Date.now().toString(36)}`, label: '', value: '', unit: '', verified: 'Month/Year' }}>
              {(i) => (
                <>
                  <F path={['metrics', i, 'label']} label="Label" />
                  <F path={['metrics', i, 'value']} label="Value" />
                  <F path={['metrics', i, 'unit']} label="Unit (sec, mph…)" />
                  <F path={['metrics', i, 'verified']} label="Verified month / year" />
                </>
              )}
            </List>
          </Card>
          <Card title="Featured video" hint="Use the embed address from YouTube, Vimeo or Hudl, starting with https://.">
            {videoFields(['featured'])}
          </Card>
          <Card title="Skill clips">
            <F path={['clipsTitle']} label="Section heading" wide />
            <List path={['clips']} noun="clip" max={6} blank={{ title: '', blurb: '', length: '', embedUrl: '' }}>
              {(i) => videoFields(['clips', i])}
            </List>
          </Card>
          <Card title="Scouting summary" hint="Write {popTime} wherever the pop time metric value should appear.">
            <F path={['summary']} label="Player profile text" area />
          </Card>
          <Card title="Schedule">
            <F path={['scheduleTitle']} label="Section heading" wide />
            <F path={['scheduleColumns', 'event']} label="Event column heading" />
            <F path={['scheduleColumns', 'info']} label="Last column heading" />
            <List path={['schedule']} noun="event" max={40} blank={{ date: '', event: '', location: '', team: '', info: '', infoUrl: '' }}>
              {(i) => (
                <>
                  <F path={['schedule', i, 'date']} label="Date" />
                  <F path={['schedule', i, 'event']} label="Event" />
                  <F path={['schedule', i, 'location']} label="Location" />
                  <F path={['schedule', i, 'team']} label="Team" />
                  <F path={['schedule', i, 'info']} label="Pool / field / court / stream text" />
                  <F path={['schedule', i, 'infoUrl']} label="Link for that text (optional)" />
                </>
              )}
            </List>
          </Card>
          <Card title="Coach references">
            <List path={['coaches']} noun="coach" max={6} blank={{ role: '', name: '', phone: '', email: '' }}>
              {(i) => (
                <>
                  <F path={['coaches', i, 'role']} label="Role" />
                  <F path={['coaches', i, 'name']} label="Name" />
                  <F path={['coaches', i, 'phone']} label="Phone" kind="phone" />
                  <F path={['coaches', i, 'email']} label="Email" kind="email" />
                </>
              )}
            </List>
          </Card>
          <Card title="Recruiting links" hint="Buttons next to the PDF download.">
            <List path={['links']} noun="link" max={8} blank={{ label: '', url: '' }}>
              {(i) => (
                <>
                  <F path={['links', i, 'label']} label="Button text" />
                  <F path={['links', i, 'url']} label="Address" />
                </>
              )}
            </List>
          </Card>
        </>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap gap-3 border-t border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <button type="button" disabled={busy} onClick={() => void save()} className="min-h-12 flex-1 rounded-xl bg-amber-500 px-6 font-bold text-slate-950 active:bg-amber-400 disabled:opacity-50 sm:flex-none">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <a href={sport ? `/${section}/` : '/'} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center rounded-xl border border-slate-600 px-4 text-sm font-semibold text-slate-100 active:bg-slate-800">
          View public page
        </a>
        <button type="button" disabled={busy} onClick={() => void reset()} className="min-h-12 rounded-xl border border-red-500/50 px-4 text-sm font-semibold text-red-200 active:bg-red-500/10 sm:ml-auto">
          Reset to placeholders
        </button>
      </div>
    </div>
    </DraftCtx.Provider>
  )
}

export default function Content({ section }: { section: Section }) {
  const [content, setContent] = useState<StoredContent | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<{ content: StoredContent }>('recruiting.php')
      .then((r) => setContent(r.content))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load content'))
  }, [])

  if (error) return <p role="alert" className="text-sm text-red-200">{error}</p>
  if (!content) return <p className="text-sm text-slate-400">Loading…</p>
  const stored = content[section]
  const initial = stored ?? (section === 'site' ? defaultSite : defaultSports[section])
  return <Editor key={section} section={section} initial={initial} stored={stored !== null} onSaved={setContent} />
}
