import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, api } from '../lib/api'
import { TEAM_TYPES, defaultSite, defaultSport } from '../data/recruitingData'
import type { RecruitingData, SiteData, SportConfig, SportData } from '../data/recruitingData'
import { mergeSite, mergeSport } from '../lib/recruiting'
import type { Store } from '../lib/recruiting'
import ScrollRow from './ScrollRow'
import RecordCard from './RecordCard'
import MetricsGrid from './MetricsGrid'
import { measurableSuggestions } from '../data/sportCatalog'
import { FieldsTable, ListTable, SingleCard, useCards } from './cards'
import type { FieldDef } from './cards'
import ProfileSheet from '../recruit/ProfileSheet'
import { showDate, showTime } from '../lib/schedule'
import { AddressFields, BATS_THROWS, Collapsible, DraftCtx, F, List, Pick, PositionChecklist, PhotoField, PositionPair, VideoUpload, toYoutubeEmbed, QrCard, EventsTable, TeamsTable, TrainersTable } from './fields'
import { SITE_STEPS, SPORT_STEPS, siteGaps, sportGaps } from './gaps'
import type { Result } from './gaps'

export type Section = string
export type Area = string

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

function Preview({ data, id }: { data: RecruitingData; id: string }) {
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
    <ScrollRow label="Steps">
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
    </ScrollRow>
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

const photoState = (v: string) => (v && !v.startsWith('/img/hero-') ? 'Uploaded' : 'Not set')

function SiteStep({ step, siteUrl }: { step: string; siteUrl: string }) {
  const cards = useCards(step, step === 'academics' ? ['academics'] : step === 'contact' ? ['recruiting', 'parent'] : ['athlete', 'qr'])
  const one = (k: string, title: string, hint: string | undefined, fields: FieldDef[], edit: ReactNode, table = true) => (
    <>
      <SingleCard title={title} hint={hint} {...cards.card(k)} rec={cards.rec(k)} setRec={cards.setRec(k)} fields={fields}>
        {edit}
      </SingleCard>
      {table && <FieldsTable title={`All ${title.toLowerCase()} details`} fields={fields} onPick={() => cards.pick(k)} />}
    </>
  )
  if (step === 'academics')
    return one(
      'academics',
      'Academics',
      'GPA and courses always show. The extras below show on the profiles only when filled in.',
      [
        ['GPA', ['academics', 'gpa']],
        ['Honors / advanced courses', ['academics', 'courses']],
        ['Class rank', ['academics', 'classRank']],
        ['NCAA Eligibility Center ID', ['academics', 'ncaaId']],
        ['SAT', ['academics', 'sat']],
        ['ACT', ['academics', 'act']],
      ],
      <>
        <F path={['academics', 'gpa']} label="GPA" />
        <F path={['academics', 'courses']} label="Honors / advanced courses" />
        <F path={['academics', 'classRank']} label="Class rank (optional)" placeholder="12 of 340" help="Ever’s rank in her class, written as position of class size, like 12 of 340. Leave it blank if the school doesn’t rank. It appears on the profiles only when filled in." />
        <F path={['academics', 'ncaaId']} label="NCAA Eligibility Center ID (optional)" help="The ID from Ever’s free account at the NCAA Eligibility Center. College coaches look for it when they check eligibility. It appears on the profiles only when filled in." />
        <F path={['academics', 'sat']} label="SAT (optional)" help="Her best SAT score, if she has taken it. Leave it blank for now. It appears only when filled in." />
        <F path={['academics', 'act']} label="ACT (optional)" help="Her best ACT score, if she has taken it. Leave it blank for now. It appears only when filled in." />
      </>,
      false,
    )
  if (step === 'contact')
    return (
      <>
        {one(
          'recruiting',
          'Recruiting contact',
          'Shown in the footer on every public page and on the profiles.',
          [
            ['Email', ['contact', 'email']],
            ['Phone', ['contact', 'phone']],
          ],
          <>
            <F path={['contact', 'email']} label="Email" kind="email" />
            <F path={['contact', 'phone']} label="Phone" kind="phone" />
          </>,
          false,
        )}
        {one(
          'parent',
          'Parent / guardian',
          undefined,
          [
            ['Name', ['contact', 'parent', 'name']],
            ['Email', ['contact', 'parent', 'email']],
            ['Phone', ['contact', 'parent', 'phone']],
          ],
          <>
            <F path={['contact', 'parent', 'name']} label="Name" wide />
            <F path={['contact', 'parent', 'email']} label="Email" kind="email" />
            <F path={['contact', 'parent', 'phone']} label="Phone" kind="phone" />
          </>,
          false,
        )}
        {one(
          'social',
          'Social',
          undefined,
          [
            ['X / Twitter handle', ['contact', 'social', 'x', 'handle']],
            ['X / Twitter address', ['contact', 'social', 'x', 'url']],
            ['Instagram handle', ['contact', 'social', 'instagram', 'handle']],
            ['Instagram address', ['contact', 'social', 'instagram', 'url']],
          ],
          <>
            <F path={['contact', 'social', 'x', 'handle']} label="X / Twitter handle" />
            <F path={['contact', 'social', 'x', 'url']} label="X / Twitter address" help="The full web address of her X profile, starting with https://. The footer link on every page goes here." />
            <F path={['contact', 'social', 'instagram', 'handle']} label="Instagram handle" />
            <F path={['contact', 'social', 'instagram', 'url']} label="Instagram address" help="The full web address of her Instagram profile, starting with https://. The footer link on every page goes here." />
          </>,
        )}
      </>
    )
  return (
    <>
      {one(
        'athlete',
        'Athlete',
        undefined,
        [
          ['Name', ['athlete', 'name']],
          ['Class year', ['athlete', 'classYear']],
          ['School', ['athlete', 'school']],
          ['City, state', ['athlete', 'location']],
          ['Height', ['athlete', 'height']],
          ['Weight', ['athlete', 'weight']],
          ['Jersey number', ['athlete', 'jersey']],
          ['Site address', ['siteUrl']],
        ],
        <>
          <F path={['athlete', 'name']} label="Name" />
          <F path={['athlete', 'classYear']} label="Class year" type="number" />
          <F path={['athlete', 'school']} label="School" />
          <F path={['athlete', 'location']} label="City, state" />
          <F path={['athlete', 'height']} label="Height" />
          <F path={['athlete', 'weight']} label="Weight (optional)" placeholder="140 lb" />
          <F path={['athlete', 'jersey']} label="Jersey number" />
          <F path={['siteUrl']} label="Site address" help="The main web address of this site, starting with https://. The QR codes on the printed profiles and the Teams page link to it, so only change it if the site moves." />
        </>,
        false,
      )}
      <QrCard url={siteUrl} hint="Links to the site address above. Use it on flyers and business cards." file="everharris-qr" {...cards.card('qr')} />
    </>
  )
}

function SportStep({ id, cfg, step, siteUrl }: { id: string; cfg: SportConfig; step: string; siteUrl: string }) {
  const cards = useCards(id + step, step === 'contacts' ? ['qr'] : step === 'bio' ? ['bio', 'metrics'] : step === 'summary' ? ['summary'] : [])
  const teamsBox = useRef<HTMLElement>(null)
  const trainerBox = useRef<HTMLElement>(null)
  const scheduleBox = useRef<HTMLElement>(null)
  const clipsBox = useRef<HTMLElement>(null)
  const awardsBox = useRef<HTMLElement>(null)
  const linksBox = useRef<HTMLElement>(null)
  const one = (k: string, title: string, hint: string | undefined, fields: FieldDef[], edit: ReactNode, table = true) => (
    <>
      <SingleCard title={title} hint={hint} {...cards.card(k)} rec={cards.rec(k)} setRec={cards.setRec(k)} fields={fields}>
        {edit}
      </SingleCard>
      {table && <FieldsTable title={`All ${title.toLowerCase()} details`} fields={fields} onPick={() => cards.pick(k)} />}
    </>
  )
  const videoFields = (base: (string | number)[], first?: string) => (
    <>
      <F id={first} path={[...base, 'title']} label="Title" />
      <F path={[...base, 'blurb']} label="Description" />
      <F path={[...base, 'length']} label="Length note" />
      <F
        path={[...base, 'embedUrl']}
        label="YouTube link (recommended)"
        placeholder="Paste the YouTube address, e.g. https://youtu.be/VIDEO_ID"
        normalize={toYoutubeEmbed}
        wide
        hint="Paste the normal YouTube address. It is converted for you. Vimeo and Hudl embed addresses also work."
        help={
          <>
            <strong>Why YouTube is better than uploading:</strong>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>It plays fast on any phone or connection, and YouTube adjusts the quality automatically.</li>
              <li>Any length. Full games and long highlight reels work. Uploads are limited to short clips.</li>
              <li>It costs your website nothing, so your site stays quick when many coaches watch at once.</li>
              <li>It plays on every device. Uploaded phone formats sometimes don't.</li>
              <li>Coaches already know and trust it. Set the video to Unlisted on YouTube if you don't want it searchable.</li>
            </ul>
          </>
        }
      />
      <VideoUpload base={base} sport={id} />
    </>
  )
  const videoView = (base: string[]): FieldDef[] => [
    ['Title', [...base, 'title']],
    ['Description', [...base, 'blurb']],
    ['Length note', [...base, 'length']],
    ['Embed URL', [...base, 'embedUrl']],
    ['Uploaded video file', [...base, 'videoUrl'], (v) => (v ? 'Uploaded' : '')],
  ]
  if (step === 'film')
    return (
      <>
        {one('featured', 'Featured video', 'Use the embed address from YouTube, Vimeo or Hudl, starting with https://.', videoView(['featured']), videoFields(['featured']))}
        <RecordCard
          title="Skill clips"
          {...cards.card('clips')}
          boxRef={clipsBox}
          listPath={['clips']}
          noun="clip"
          max={6}
          blank={{ title: '', blurb: '', length: '', embedUrl: '' }}
          rec={cards.rec('clips')}
          setRec={cards.setRec('clips')}
          focusPrefix="clip-title"
          settings={<F path={['clipsTitle']} label="Section heading" wide help="The heading shown above the skill clips on the public sport page." />}
          edit={(i) => videoFields(['clips', i], `clip-title-${i}`)}
          view={(r) => [
            ['Title', String(r.title ?? '')],
            ['Description', String(r.blurb ?? '')],
            ['Length note', String(r.length ?? '')],
            ['Embed URL', String(r.embedUrl ?? '')],
            ['Uploaded video file', r.videoUrl ? 'Uploaded' : ''],
          ]}
        />
        <ListTable title="All skill clips" listPath={['clips']} noun="clip" columns={[['Title', 'title'], ['Description', 'blurb'], ['Length', 'length']]} onPick={(n) => cards.pick('clips', n)} />
      </>
    )
  if (step === 'summary')
    return (
      <>
        {one('summary', 'Scouting summary', 'Write {popTime} wherever the pop time metric value should appear.', [['Player profile text', ['summary']]], <F path={['summary']} label="Player profile text" area help="A short paragraph about Ever as a player. It shows on the sport page and the printed profile. Type {popTime} wherever her pop time should appear, and it fills in the number from her metrics automatically." />, false)}
        <RecordCard
          title="Awards & honors"
          hint="Optional."
          {...cards.card('awards')}
          boxRef={awardsBox}
          listPath={['awards']}
          noun="award"
          max={16}
          blank={{ title: '', year: '' }}
          rec={cards.rec('awards')}
          setRec={cards.setRec('awards')}
          focusPrefix="award-title"
          edit={(i) => (
            <>
              <F id={`award-title-${i}`} path={['awards', i, 'title']} label="Award" />
              <F path={['awards', i, 'year']} label="Year" />
            </>
          )}
          view={(r) => [
            ['Award', String(r.title ?? '')],
            ['Year', String(r.year ?? '')],
          ]}
        />
        <ListTable title="All awards & honors" listPath={['awards']} noun="award" columns={[['Award', 'title'], ['Year', 'year']]} onPick={(n) => cards.pick('awards', n)} />
      </>
    )
  if (step === 'schedule')
    return (
      <>
        <RecordCard
          title="Schedule"
          {...cards.card('schedule')}
          boxRef={scheduleBox}
          listPath={['schedule']}
          noun="event"
          max={40}
          blank={{ date: '', time: '', event: '', location: '', mapUrl: '', team: '', info: '', infoUrl: '' }}
          rec={cards.rec('schedule')}
          setRec={cards.setRec('schedule')}
          focusPrefix="event-date"
          settings={
            <>
              <F path={['scheduleTitle']} label="Section heading" wide help="The heading shown above the schedule table on the public sport page and the Schedule page." />
              <F path={['scheduleColumns', 'event']} label="Event column heading" help="The title of the second column in the schedule table, for example Event / Showcase." />
              <F path={['scheduleColumns', 'info']} label="Last column heading" help="The title of the last column in the schedule table, for example Pool / Field Info or Court / Live Stream Link." />
            </>
          }
          edit={(i) => (
            <>
              <F id={`event-date-${i}`} path={['schedule', i, 'date']} label="Date" kind="date" help="Type the numbers only, like 12052026, and it fills in as MM/DD/YYYY for you. Pasted dates like Dec 5, 2026 are converted too." />
              <F path={['schedule', i, 'time']} label="Start time" kind="time" help="The time the team plays, shown as 10:30 AM on the website and the profile. Leave it blank if the time is not set yet." />
              <F path={['schedule', i, 'event']} label="Event" />
              <F path={['schedule', i, 'team']} label="Team" />
              <AddressFields base={['schedule', i]} />
              <F path={['schedule', i, 'info']} label="Pool / field / court / stream text" />
              <F path={['schedule', i, 'infoUrl']} label="Link for that text (optional)" />
            </>
          )}
          view={(r) => [
            ['Date', showDate(String(r.date ?? ''))],
            ['Time', showTime(String(r.time ?? ''))],
            ['Event', String(r.event ?? '')],
            ['Team', String(r.team ?? '')],
            ['Full address', String(r.location ?? '')],
            ['Google Maps link', String(r.mapUrl ?? '')],
            ['Pool / field / court / stream', String(r.info ?? '')],
            ['Link', String(r.infoUrl ?? '')],
          ]}
        />
        <EventsTable onPick={(n) => cards.pick('schedule', n)} />
      </>
    )
  if (step === 'teams')
    return (
      <>
        <RecordCard
          title="Teams & coaches"
          hint="One team per year, for this sport only. The newest year shows first everywhere on the site."
          {...cards.card('teams')}
          boxRef={teamsBox}
          listPath={['teams']}
          noun="team"
          max={20}
          blank={{ year: '', name: '', type: '', coach: '', owner: '', phone: '', email: '', social: '', stats: [] }}
          rec={cards.rec('teams')}
          setRec={cards.setRec('teams')}
          focusPrefix="team-name"
          edit={(i) => (
            <>
              <F id={`team-name-${i}`} path={['teams', i, 'name']} label="Team name" />
              <F path={['teams', i, 'year']} label="Year" placeholder="2026" help="The season or year Ever played for this team. Teams are listed newest year first, and the newest year in each sport is marked Current on the Teams page." />
              <Pick path={['teams', i, 'type']} label="Team type" options={[...TEAM_TYPES]} help="High School is a team run by her school. Travel / AAU is a club team outside of school. Coaches use this to understand the level and who to contact." />
              <F path={['teams', i, 'coach']} label="Coach" />
              <F path={['teams', i, 'owner']} label="Owner (travel / AAU teams)" help="The person who owns or runs the travel or club organization. Coaches often contact the owner about rosters and tournaments. Leave it blank for school teams." />
              <F path={['teams', i, 'phone']} label="Phone" kind="phone" />
              <F path={['teams', i, 'email']} label="Email" kind="email" />
              <F path={['teams', i, 'social']} label="Social link (optional)" placeholder="https://instagram.com/..." wide help="The full web address of the team’s page on Instagram, Facebook or X, starting with https://. It shows as a Social link on the team card." />
              <p className="text-sm font-semibold text-slate-300 sm:col-span-2">Stats for this team (shown on its PDF)</p>
              <List path={['teams', i, 'stats']} noun="stat" max={12} blank={{ label: '', value: '', note: '' }}>
                {(j) => (
                  <>
                    <F path={['teams', i, 'stats', j, 'label']} label="Stat" placeholder="Batting average" />
                    <F path={['teams', i, 'stats', j, 'value']} label="Value" placeholder=".412" help="The number for this stat, typed the way it should print, like .412 or 18. Team stats show on that team’s PDF." />
                    <F path={['teams', i, 'stats', j, 'note']} label="Note (optional)" wide />
                  </>
                )}
              </List>
            </>
          )}
          view={(r) => [
            ['Team name', String(r.name ?? '')],
            ['Year', String(r.year ?? '')],
            ['Type', String(r.type ?? '')],
            ['Coach', String(r.coach ?? '')],
            ['Owner', String(r.owner ?? '')],
            ['Phone', String(r.phone ?? '')],
            ['Email', String(r.email ?? '')],
            ['Social link', String(r.social ?? '')],
            ['Stats', ((r.stats as { label: string; value: string }[] | undefined) ?? []).map((x) => `${x.label} ${x.value}`).join(' · ')],
          ]}
        />
        <TeamsTable onPick={(n) => cards.pick('teams', n)} />
        <RecordCard
          title="Personal training instructor"
          hint="Ever’s trainer for this sport."
          {...cards.card('trainers')}
          boxRef={trainerBox}
          listPath={['trainers']}
          noun="trainer"
          max={10}
          blank={{ name: '', phone: '', email: '' }}
          rec={cards.rec('trainers')}
          setRec={cards.setRec('trainers')}
          focusPrefix="trainer-name"
          edit={(i) => (
            <>
              <F id={`trainer-name-${i}`} path={['trainers', i, 'name']} label="Name" />
              <F path={['trainers', i, 'phone']} label="Phone" kind="phone" />
              <F path={['trainers', i, 'email']} label="Email" kind="email" wide />
            </>
          )}
          view={(r) => [
            ['Name', String(r.name ?? '')],
            ['Phone', String(r.phone ?? '')],
            ['Email', String(r.email ?? '')],
          ]}
        />
        <TrainersTable onPick={(n) => cards.pick('trainers', n)} />
      </>
    )
  if (step === 'contacts')
    return (
      <>
        <RecordCard
          title="Recruiting links"
          hint="Buttons next to the PDF download."
          {...cards.card('links')}
          boxRef={linksBox}
          listPath={['links']}
          noun="link"
          max={8}
          blank={{ label: '', url: '' }}
          rec={cards.rec('links')}
          setRec={cards.setRec('links')}
          focusPrefix="link-label"
          edit={(i) => (
            <>
              <F id={`link-label-${i}`} path={['links', i, 'label']} label="Button text" />
              <F path={['links', i, 'url']} label="Address" help="The full web address the button opens, starting with https://, such as her FieldLevel or Hudl profile." />
            </>
          )}
          view={(r) => [
            ['Button text', String(r.label ?? '')],
            ['Address', String(r.url ?? '')],
          ]}
        />
        <ListTable title="All recruiting links" listPath={['links']} noun="link" columns={[['Button text', 'label'], ['Address', 'url']]} onPick={(n) => cards.pick('links', n)} />
        <QrCard url={`${siteUrl}/${id}/`} hint={`Links to the ${id} page. It is also printed on the ${id} recruiting profile.`} file={`everharris-${id}-qr`} {...cards.card('qr')} />
      </>
    )
  const bioFields: FieldDef[] = [[cfg.positionLabel, ['positions']], ...(cfg.handedness ? [['Bats / throws', ['handedness']] as FieldDef] : []), ['Photo', ['photo'], photoState]]
  return (
    <>
      {one(
        'bio',
        'Bio',
        undefined,
        bioFields,
        <>
          {cfg.positionStyle === 'multi' ? <PositionChecklist path={['positions']} label={cfg.positionLabel} options={cfg.positions} /> : <PositionPair path={['positions']} label={cfg.positionLabel} options={cfg.positions} />}
          {cfg.handedness && <Pick path={['handedness']} label="Bats / throws" options={BATS_THROWS} wide />}
          <PhotoField sport={id} />
        </>,
        false,
      )}
      <Collapsible title="Verified metrics" {...cards.card('metrics')} hint="Type the number and date for each measurable. Each row has its own Edit and Remove, and saving publishes right away. Keep the Pop Time box if the summary uses {popTime}.">
        <MetricsGrid suggestions={measurableSuggestions(id, cfg.metrics)} />
      </Collapsible>
    </>
  )
}

function Overview({ data }: { data: RecruitingData }) {
  const results: { area: Section; title: string; r: Result; steps: typeof SITE_STEPS }[] = [
    { area: 'site', title: 'Athlete & contacts', r: siteGaps(data), steps: SITE_STEPS },
    ...data.sportList.map((c) => ({ area: c.id, title: `${c.label} profile${c.visible ? '' : ' (hidden)'}`, r: sportGaps(c, data.sports[c.id]), steps: SPORT_STEPS })),
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
  onSaved: (c: Store) => void
  onReset: () => void
}) {
  const wide = useWide()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [previewSport, setPreviewSport] = useState(data.sportList[0]?.id ?? '')
  const sport = section !== 'site'
  const cfg = data.sportList.find((c) => c.id === section)
  const steps = sport ? SPORT_STEPS : SITE_STEPS
  const current = steps.some((s) => s.id === step) ? step : steps[0].id
  const result = sport && cfg ? sportGaps(cfg, data.sports[section]) : siteGaps(data)
  const previewId = sport ? section : previewSport

  useEffect(() => {
    setNotice('')
  }, [section, current])

  const call = async (body: Record<string, unknown>) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      return await api<Store>('recruiting.php', { section, ...body })
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

  const commit = async (update: (d: unknown) => unknown) => {
    const c = await call({ action: 'save', data: update(draft) })
    if (c) {
      onSaved(c)
      setNotice('Saved. The public pages and printable profile now show this.')
    }
    return c !== null
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
            {data.sportList.map((c) => c.id).map((s) => (
              <button key={s} type="button" aria-pressed={previewSport === s} onClick={() => setPreviewSport(s)} className="min-h-10 rounded-full border border-slate-700 px-3 text-xs font-bold text-slate-300 aria-pressed:border-amber-500 aria-pressed:text-amber-400">
                {data.sports[s].label}
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
    <DraftCtx.Provider value={{ draft, setDraft, commit }}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-8">
        <div className="min-w-0 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">{sport ? cfg?.label : 'Athlete & contacts'}</p>
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

          {sport && cfg ? <SportStep id={section} cfg={cfg} step={current} siteUrl={data.siteUrl} /> : <SiteStep step={current} siteUrl={data.siteUrl} />}
          <StepNav steps={steps} current={current} base={section} label={sport ? (cfg?.label ?? '') : 'Athlete & contacts'} />

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

export default function Content({ area, step, store, setStore }: { area: Area; step: string; store: Store; setStore: (s: Store) => void }) {
  const [drafts, setDrafts] = useState<Drafts>({})

  const saved = useMemo(() => {
    const out: Record<string, unknown> = { site: mergeSite((store.content.site as SiteData | null) ?? null) }
    for (const c of store.sports) out[c.id] = mergeSport(c, (store.content[c.id] as SportData | null) ?? null)
    return out
  }, [store])

  const dirtyKeys = useMemo(() => Object.keys(drafts).filter((k) => k in saved && JSON.stringify(drafts[k]) !== JSON.stringify(saved[k])), [drafts, saved])

  useEffect(() => {
    if (!dirtyKeys.length) return
    const on = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', on)
    return () => window.removeEventListener('beforeunload', on)
  }, [dirtyKeys.length])

  const current = (k: Section) => (k in drafts ? drafts[k] : saved[k])
  const sports: Record<string, SportData> = {}
  for (const c of store.sports) sports[c.id] = current(c.id) as SportData
  const data: RecruitingData = { ...(current('site') as SiteData), sportList: store.sports, sports }

  if (area === 'overview') return <Overview data={data} />
  if (area !== 'site' && !store.sports.some((c) => c.id === area)) return <Overview data={data} />

  const setDraft = (u: (d: unknown) => unknown) => setDrafts((d) => ({ ...d, [area]: u(area in d ? d[area] : saved[area]) }))
  const resetDraft = () => {
    const cfg = store.sports.find((c) => c.id === area)
    setDrafts((d) => ({ ...d, [area]: area === 'site' || !cfg ? defaultSite : defaultSport(cfg) }))
  }

  return (
    <Editor
      key={area}
      section={area}
      step={step}
      draft={current(area)}
      setDraft={setDraft}
      dirty={dirtyKeys.includes(area)}
      stored={store.content[area] != null}
      data={data}
      onSaved={(c) => {
        setStore(c)
        setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([k]) => k !== area)))
      }}
      onReset={resetDraft}
    />
  )
}
