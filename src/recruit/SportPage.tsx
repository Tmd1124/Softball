import { useRecruiting } from '../lib/recruiting'
import type { SportData, SportId } from '../data/recruitingData'
import SiteShell from '../site/SiteShell'
import { CoachCard, MetricStrip, PdfButton, ScheduleTable, Section, VideoEmbed, buttonClass } from './blocks'

export function summaryText(sport: SportData) {
  const pop = sport.metrics.find((m) => m.key === 'popTime')?.value ?? ''
  return sport.summary.replace('{popTime}', pop)
}

export default function SportPage({ id }: { id: SportId }) {
  const data = useRecruiting()
  if (!data) return <SiteShell page={id}>{null}</SiteShell>
  const sport: SportData = data[id]
  const { athlete, academics } = data
  const pdf = `/profile/?sport=${id}&print=1`
  const sub = [sport.positions, sport.handedness, athlete.height].filter(Boolean).join(' | ')

  return (
    <SiteShell page={id}>
      <section aria-labelledby="hero-title" className="mx-auto max-w-5xl px-4 pb-4 pt-6 sm:px-6 sm:pt-10">
        <div className="grid gap-5 md:grid-cols-2 md:items-stretch">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 md:aspect-auto md:min-h-80">
            <img src={sport.photo} alt={`${athlete.name} playing ${sport.label.toLowerCase()}`} className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">{sport.label}</p>
            <h1 id="hero-title" className="mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight text-slate-50 sm:text-4xl">
              {athlete.name} <span className="text-slate-500">|</span> Class of {athlete.classYear}
            </h1>
            <p className="mt-3 text-base font-bold text-slate-100 sm:text-lg">{sub}</p>
            <dl className="mt-5 space-y-3 text-sm leading-relaxed">
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Team Affiliation</dt>
                <dd className="mt-1 text-slate-200">
                  {athlete.school} ({athlete.location}) | {sport.team} | Jersey #{athlete.jersey}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Academics</dt>
                <dd className="mt-1 text-slate-200">
                  GPA: {academics.gpa} | {academics.courses}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="mt-5">
          <MetricStrip metrics={sport.metrics} />
        </div>
      </section>

      <Section id="video" kicker="Film" title={sport.featured.title}>
        <VideoEmbed video={sport.featured} large />
        <h3 className="mt-10 text-sm font-bold uppercase tracking-widest text-slate-400">{sport.clipsTitle}</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {sport.clips.map((c) => (
            <VideoEmbed key={c.title} video={c} />
          ))}
        </div>
      </Section>

      <Section id="summary" kicker="Scouting summary" title="Player profile">
        <blockquote className="rounded-2xl border-l-4 border-amber-500 bg-slate-900 p-5 text-base leading-relaxed text-slate-200 sm:p-6 sm:text-lg">
          <strong className="text-slate-50">Player Profile:</strong> {summaryText(sport)}
        </blockquote>
      </Section>

      <Section id="schedule" kicker="Where to see Ever" title={sport.scheduleTitle}>
        <ScheduleTable sport={sport} events={sport.schedule} />
      </Section>

      <Section id="contacts" kicker="Recruiting" title="Coach references & links">
        <div className="grid gap-4 sm:grid-cols-2">
          {sport.coaches.map((c) => (
            <CoachCard key={c.role} coach={c} />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <PdfButton href={pdf}>Download 1-Page {sport.label} PDF</PdfButton>
          {sport.links.map((l) => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className={buttonClass}>
              {l.label}
            </a>
          ))}
        </div>
      </Section>
    </SiteShell>
  )
}
