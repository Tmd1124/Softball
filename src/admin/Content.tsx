import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, api } from '../lib/api'
import { TEAM_TYPES, defaultSite, defaultSports } from '../data/recruitingData'
import type { RecruitingData, SiteData, SportData, SportId } from '../data/recruitingData'
import { mergeSite, mergeSport } from '../lib/recruiting'
import type { StoredContent } from '../lib/recruiting'
import ProfileSheet from '../recruit/ProfileSheet'
import { BASKETBALL_POSITIONS, BATS_THROWS, Card, Collapsible, DraftCtx, F, List, Pick, PositionChecklist, PhotoField, PositionPair, QrCard, SOFTBALL_POSITIONS, TeamsTable } from './fields'
import { SITE_STEPS, SPORT_STEPS, siteGaps, sportGaps } from './gaps'
import type { Result } from './gaps'

export type Section = 'site' | SportId
export type Area = 'overview' | Section

const SPORT_LABEL: Record<SportId, string> = { softball: 'Softball', basketball: 'Basketball' }
export const AREA_LABEL: Record<Area, string> = { overview: 'Overview', site: 'Athlete & contacts', softball: 'Softball', basketball: 'Basketball' }

type Drafts = Partial<Record<Section, unknown>>

function useWide() {
  const q = '(min-width: 1024px)'
  const [wide, setWide] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const m = matchMedia(q)
    const on = () => setWide(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return wide
}

function Preview({ data, id }: { data: RecruitingData; id: SportId }) {
  const box = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.5)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setZoom(Math.min(1, el.clientWidth / 816))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className="overflow-hidden rounded-2xl border border-slate-700 bg-white">
      <div style={{ zoom, width: '8.5in' }} aria-hidden>
        <ProfileSheet data={data} id={id} />
      </div>
    </div>
  )
}

function Chips({ steps, current, gaps, base }: { steps: { id: string; label: string }[]; current: string; gaps: Result['gaps']; base: string }) {
  return (
    <nav aria-label="Steps" className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const n = gaps.filter((g) => g.step === s.id).length
        return (
          <a
            key={s.id}
            href={`#${base}/${s.id}`}
            aria-current={current === s.id ? 'step' : undefined}
            className="flex min-h-12 shrink-0 items-center gap-2 rounded-full border border-slate-700 px-4 text-sm font-bold text-slate-300 aria-[current=step]:border-amber-500 aria-[current=step]:text-amber-400"
          >
            <span className="text-xs text-slate-500">{i + 1}</span>
            {s.label}
            {n > 0 ? (
              <span className="rounded-full bg-amber-500/20 px-2 text-xs text-amber-300" title={`${n} still to fill in`}>{n}</span>
            ) : (
              <span className="text-emerald-400" title="Complete" aria-label="Complete">✓</span>
            )}
          </a>
        )
      })}
    </nav>
  )
}

const hashGo = (h: string) => {
  location.hash = h
  window.scrollTo({ top: 0 })
}

function StepNav({ steps, current, base, label }: { steps: { id: string; label: string }[]; current: string; base: string; label: string }) {
  const i = steps.findIndex((s) => s.id === current)
  const prev = steps[i - 1]
  const next = steps[i + 1]
  const btn = 'min-h-12 rounded-xl border border-slate-600 px-5 text-sm font-bold text-slate-100 active:bg-slate-800'
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {prev ? (
        <button type="button" className={btn} onClick={() => hashGo(`${base}/${prev.id}`)}>← {prev.label}</button>
      ) : (
        <span />
      )}
      {next ? (
        <button type="button" className={`${btn} border-amber-500 text-amber-400`} onClick={() => hashGo(`${base}/${next.id}`)}>{next.label} →</button>
      ) : (
        <a href="#overview" className={`${btn} inline-flex items-center border-amber-500 text-amber-400`}>Done · {label} overview</a>
      )}
    </div>
  )
}

function SiteStep({ step, siteUrl }: { step: string; siteUrl: string }) {
  if (step === 'academics')
    return (
      <Card title="Academics" hint="GPA and courses always show. The extras below show on the profiles only when filled in.">
        <F path={['academics', 'gpa']} label="GPA" />
        <F path={['academics', 'courses']} label="Honors / advanced courses" />
        <F path={['academics', 'classRank']} label="Class rank (optional)" placeholder="12 of 340" />
        <F path={['academics', 'ncaaId']} label="NCAA Eligibility Center ID (optional)" />
        <F path={['academics', 'sat']} label="SAT (optional)" />
        <F path={['academics', 'act']} label="ACT (optional)" />
      </Card>
    )
  if (step === 'contact')
    return (
      <>
        <Card title="Recruiting contact" hint="Shown in the footer on every public page and on the profiles.">
          <F path={['contact', 'email']} label="Email" kind="email" />
          <F path={['contact', 'phone']} label="Phone" kind="phone" />
        </Card>
        <Card title="Parent / guardian">
          <F path={['contact', 'parent', 'name']} label="Name" wide />
          <F path={['contact', 'parent', 'email']} label="Email" kind="email" />
          <F path={['contact', 'parent', 'phone']} label="Phone" kind="phone" />
        </Card>
        <Card title="Social">
          <F path={['contact', 'social', 'x', 'handle']} label="X / Twitter handle" />
          <F path={['contact', 'social', 'x', 'url']} label="X / Twitter address" />
          <F path={['contact', 'social', 'instagram', 'handle']} label="Instagram handle" />
          <F path={['contact', 'social', 'instagram', 'url']} label="Instagram address" />
        </Card>
      </>
    )
  return (
    <>
      <Card title="Athlete">
        <F path={['athlete', 'name']} label="Name" />
        <F path={['athlete', 'classYear']} label="Class year" type="number" />
        <F path={['athlete', 'school']} label="School" />
        <F path={['athlete', 'location']} label="City, state" />
        <F path={['athlete', 'height']} label="Height" />
        <F path={['athlete', 'weight']} label="Weight (optional)" placeholder="140 lb" />
        <F path={['athlete', 'jersey']} label="Jersey number" />
        <F path={['siteUrl']} label="Site address" />
      </Card>
      <QrCard url={siteUrl} hint="Links to the site address above. Use it on flyers and business cards." file="everharris-qr" />
    </>
  )
}

function SportStep({ id, step, siteUrl }: { id: SportId; step: string; siteUrl: string }) {
  const [teamsOpen, setTeamsOpen] = useState(false)
  const [pick, setPick] = useState<{ n: number } | null>(null)
  const teamsBox = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!pick || !teamsOpen) return
    teamsBox.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    document.getElementById(`team-name-${pick.n}`)?.focus({ preventScroll: true })
    setPick(null)
  }, [pick, teamsOpen])
  const videoFields = (base: (string | number)[]) => (
    <>
      <F path={[...base, 'title']} label="Title" />
      <F path={[...base, 'blurb']} label="Description" />
      <F path={[...base, 'length']} label="Length note" />
      <F path={[...base, 'embedUrl']} label="Embed URL" placeholder="https://www.youtube.com/embed/VIDEO_ID" />
    </>
  )
  if (step === 'film')
    return (
      <>
        <Card title="Featured video" hint="Use the embed address from YouTube, Vimeo or Hudl, starting with https://.">
          {videoFields(['featured'])}
        </Card>
        <Card title="Skill clips">
          <F path={['clipsTitle']} label="Section heading" wide />
          <List path={['clips']} noun="clip" max={6} blank={{ title: '', blurb: '', length: '', embedUrl: '' }}>
            {(i) => videoFields(['clips', i])}
          </List>
        </Card>
      </>
    )
  if (step === 'summary')
    return (
      <>
        <Card title="Scouting summary" hint="Write {popTime} wherever the pop time metric value should appear.">
          <F path={['summary']} label="Player profile text" area />
        </Card>
        <Card title="Awards & honors" hint="Optional.">
          <List path={['awards']} noun="award" max={16} blank={{ title: '', year: '' }}>
            {(i) => (
              <>
                <F path={['awards', i, 'title']} label="Award" />
                <F path={['awards', i, 'year']} label="Year" />
              </>
            )}
          </List>
        </Card>
      </>
    )
  if (step === 'schedule')
    return (
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
    )
  if (step === 'teams')
    return (
      <>
        <Collapsible title="Teams & coaches" hint="One row per team and year, for this sport only. The newest year shows first everywhere on the site." open={teamsOpen} onToggle={() => setTeamsOpen((o) => !o)} boxRef={teamsBox}>
          <List path={['teams']} noun="team" max={20} blank={{ year: '', name: '', type: '', coach: '', owner: '', phone: '', email: '', social: '', stats: [] }}>
            {(i) => (
              <>
                <F id={`team-name-${i}`} path={['teams', i, 'name']} label="Team name" />
                <F path={['teams', i, 'year']} label="Year" placeholder="2026" />
                <Pick path={['teams', i, 'type']} label="Team type" options={[...TEAM_TYPES]} />
                <F path={['teams', i, 'coach']} label="Coach" />
                <F path={['teams', i, 'owner']} label="Owner (travel / AAU teams)" />
                <F path={['teams', i, 'phone']} label="Phone" kind="phone" />
                <F path={['teams', i, 'email']} label="Email" kind="email" />
                <F path={['teams', i, 'social']} label="Social link (optional)" placeholder="https://instagram.com/..." wide />
                <p className="text-sm font-semibold text-slate-300 sm:col-span-2">Stats for this team (shown on its PDF)</p>
                <List path={['teams', i, 'stats']} noun="stat" max={12} blank={{ label: '', value: '', note: '' }}>
                  {(j) => (
                    <>
                      <F path={['teams', i, 'stats', j, 'label']} label="Stat" placeholder="Batting average" />
                      <F path={['teams', i, 'stats', j, 'value']} label="Value" placeholder=".412" />
                      <F path={['teams', i, 'stats', j, 'note']} label="Note (optional)" wide />
                    </>
                  )}
                </List>
              </>
            )}
          </List>
        </Collapsible>
        <TeamsTable onPick={(n) => { setTeamsOpen(true); setPick({ n }) }} />
        <Card title="Personal training instructor" hint="Ever’s trainer for this sport.">
          <List path={['trainers']} noun="trainer" max={10} blank={{ name: '', phone: '', email: '' }}>
            {(i) => (
              <>
                <F path={['trainers', i, 'name']} label="Name" />
                <F path={['trainers', i, 'phone']} label="Phone" kind="phone" />
                <F path={['trainers', i, 'email']} label="Email" kind="email" wide />
              </>
            )}
          </List>
        </Card>
      </>
    )
  if (step === 'contacts')
    return (
      <>
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
        <QrCard url={`${siteUrl}/${id}/`} hint={`Links to the ${id} page. It is also printed on the ${id} recruiting profile.`} file={`everharris-${id}-qr`} />
      </>
    )
  return (
    <>
      <Card title="Bio">
        {id === 'softball' ? (
          <>
            <PositionChecklist path={['positions']} label="Positions" options={SOFTBALL_POSITIONS} />
            <Pick path={['handedness']} label="Bats / throws" options={BATS_THROWS} wide />
          </>
        ) : (
          <PositionPair path={['positions']} label="Positions" options={BASKETBALL_POSITIONS} />
        )}
        <PhotoField sport={id} />
      </Card>
      <Card title="Verified metrics" hint="Each box shows “(Verified …)” under the value. Keep the Pop Time box if the summary uses {popTime}.">
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
    </>
  )
}

function Overview({ data }: { data: RecruitingData }) {
  const results: { area: Section; title: string; r: Result; steps: typeof SITE_STEPS }[] = [
    { area: 'site', title: 'Athlete & contacts', r: siteGaps(data), steps: SITE_STEPS },
    { area: 'softball', title: 'Softball profile', r: sportGaps('softball', data.softball), steps: SPORT_STEPS },
    { area: 'basketball', title: 'Basketball profile', r: sportGaps('basketball', data.basketball), steps: SPORT_STEPS },
  ]
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-50">Recruiting profiles</h1>
      <p className="mt-2 text-sm text-slate-400">Fill in each area step by step. Anything still showing a placeholder is listed here, and each item links to the exact step.</p>
      <div className="mt-5 grid gap-4">
        {results.map(({ area, title, r, steps }) => {
          const done = r.total - r.gaps.length
          const pct = r.total ? Math.round((done / r.total) * 100) : 100
          return (
            <section key={area} className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="mr-auto text-xl font-extrabold text-slate-50">{title}</h2>
                <a href={`#${area}/${steps[0].id}`} className="inline-flex min-h-12 items-center rounded-full bg-amber-500 px-5 text-sm font-bold text-slate-950 active:bg-amber-400">
                  {r.gaps.length ? 'Continue' : 'Review'}
                </a>
                {area !== 'site' && (
                  <a href={`/profile/${area}/`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center rounded-full border border-slate-600 px-4 text-sm font-semibold text-slate-100 active:bg-slate-800">
                    Printable profile
                  </a>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${title} complete`}>
                  <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-bold tabular-nums text-slate-200">{pct}%</span>
              </div>
              {r.gaps.length === 0 ? (
                <p className="mt-3 text-sm text-emerald-300">✓ Nothing left to fill in.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {steps.map((s) => {
                    const list = r.gaps.filter((g) => g.step === s.id)
                    if (!list.length) return null
                    return (
                      <div key={s.id}>
                        <a href={`#${area}/${s.id}`} className="text-sm font-bold text-amber-400 underline-offset-2 hover:underline">
                          {s.label} ({list.length})
                        </a>
                        <p className="mt-1 text-sm leading-relaxed text-slate-400">{list.map((g) => g.label).join(' · ')}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function Editor({
  section, step, draft, setDraft, dirty, stored, data, onSaved, onReset,
}: {
  section: Section
  step: string
  draft: unknown
  setDraft: (u: (d: unknown) => unknown) => void
  dirty: boolean
  stored: boolean
  data: RecruitingData
  onSaved: (c: StoredContent) => void
  onReset: () => void
}) {
  const wide = useWide()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [previewSport, setPreviewSport] = useState<SportId>('softball')
  const sport = section !== 'site'
  const steps = sport ? SPORT_STEPS : SITE_STEPS
  const current = steps.some((s) => s.id === step) ? step : steps[0].id
  const result = sport ? sportGaps(section, data[section]) : siteGaps(data)
  const previewId: SportId = sport ? section : previewSport

  useEffect(() => {
    setNotice('')
  }, [section, current])

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
      setNotice('Saved. The public pages and printable profile now show this.')
    }
  }

  const reset = async () => {
    if (!window.confirm('Discard everything saved in this area and go back to the built-in placeholders?')) return
    const c = await call({ action: 'reset' })
    if (c) {
      onSaved(c)
      onReset()
      setNotice('Reset to the built-in placeholders.')
    }
  }

  const preview = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-200">Live preview</p>
        {!sport && (
          <div className="flex gap-1" role="group" aria-label="Preview sport">
            {(['softball', 'basketball'] as SportId[]).map((s) => (
              <button key={s} type="button" aria-pressed={previewSport === s} onClick={() => setPreviewSport(s)} className="min-h-10 rounded-full border border-slate-700 px-3 text-xs font-bold text-slate-300 aria-pressed:border-amber-500 aria-pressed:text-amber-400">
                {SPORT_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>
      <Preview data={data} id={previewId} />
      <p className="text-xs text-slate-500">Includes your unsaved edits. {result.gaps.length ? `${result.gaps.length} fields still show placeholders.` : 'Nothing left to fill in.'}</p>
    </div>
  )

  return (
    <DraftCtx.Provider value={{ draft, setDraft }}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-8">
        <div className="min-w-0 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">{AREA_LABEL[section]}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-50">{steps.find((s) => s.id === current)?.label}</h1>
          </div>
          <Chips steps={steps} current={current} gaps={result.gaps} base={section} />
          {!wide && (
            <details className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
              <summary className="min-h-10 cursor-pointer text-sm font-bold text-slate-200">Preview the printed profile</summary>
              <div className="mt-3">{preview}</div>
            </details>
          )}
          {!stored && (
            <p className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200">
              Nothing saved here yet. The public site is showing the built-in placeholders. Edit and save to replace them.
            </p>
          )}
          {error && <p role="alert" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}

          {sport ? <SportStep id={section} step={current} siteUrl={data.siteUrl} /> : <SiteStep step={current} siteUrl={data.siteUrl} />}
          <StepNav steps={steps} current={current} base={section} label={AREA_LABEL[section]} />

          <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
            <button type="button" disabled={busy || !dirty} onClick={() => void save()} className="min-h-12 flex-1 rounded-xl bg-amber-500 px-6 font-bold text-slate-950 active:bg-amber-400 disabled:opacity-40 sm:flex-none">
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <span className={`text-sm ${dirty ? 'font-semibold text-amber-300' : 'text-slate-500'}`}>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          </div>
          <div className="pb-16">
            <button type="button" disabled={busy} onClick={() => void reset()} className="min-h-12 rounded-xl border border-red-500/50 px-4 text-sm font-semibold text-red-200 active:bg-red-500/10">
              Reset this area to placeholders
            </button>
          </div>
        </div>
        {wide && <aside className="sticky top-20 self-start">{preview}</aside>}
      </div>
    </DraftCtx.Provider>
  )
}

export default function Content({ area, step }: { area: Area; step: string }) {
  const [content, setContent] = useState<StoredContent | null>(null)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Drafts>({})

  useEffect(() => {
    api<{ content: StoredContent }>('recruiting.php')
      .then((r) => setContent(r.content))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load content'))
  }, [])

  const saved = useMemo(
    () =>
      content && {
        site: mergeSite(content.site),
        softball: mergeSport('softball', content.softball),
        basketball: mergeSport('basketball', content.basketball),
      },
    [content],
  )

  const dirtyKeys = useMemo(
    () => (saved ? (['site', 'softball', 'basketball'] as Section[]).filter((k) => k in drafts && JSON.stringify(drafts[k]) !== JSON.stringify(saved[k])) : []),
    [drafts, saved],
  )

  useEffect(() => {
    if (!dirtyKeys.length) return
    const on = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', on)
    return () => window.removeEventListener('beforeunload', on)
  }, [dirtyKeys.length])

  if (error) return <p role="alert" className="text-sm text-red-200">{error}</p>
  if (!content || !saved) return <p className="text-sm text-slate-400">Loading…</p>

  const current = (k: Section) => (k in drafts ? drafts[k] : saved[k])
  const data: RecruitingData = { ...(current('site') as SiteData), softball: current('softball') as SportData, basketball: current('basketball') as SportData }

  if (area === 'overview') return <Overview data={data} />

  const setDraft = (u: (d: unknown) => unknown) => setDrafts((d) => ({ ...d, [area]: u(area in d ? d[area] : saved[area]) }))
  const resetDraft = () => setDrafts((d) => ({ ...d, [area]: area === 'site' ? defaultSite : defaultSports[area] }))

  return (
    <Editor
      key={area}
      section={area}
      step={step}
      draft={current(area)}
      setDraft={setDraft}
      dirty={dirtyKeys.includes(area)}
      stored={content[area] !== null}
      data={data}
      onSaved={(c) => {
        setContent(c)
        setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([k]) => k !== area)))
      }}
      onReset={resetDraft}
    />
  )
}
