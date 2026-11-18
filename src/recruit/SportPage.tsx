import { useEffect } from 'react'
import { useRecruiting } from '../lib/recruiting'
import { applySportTheme } from '../lib/sportTheme'
import type { RecruitingData, SportData, SportId } from '../data/recruitingData'
import SiteShell from '../site/SiteShell'
import { academicExtras, bodyLine, currentStats, currentTeam, summaryText, teamsNewestFirst } from './derive'
import { MetricStrip, TeamCard, TrainerCard, PdfButton, ScheduleTable, Section, VideoEmbed, buttonClass } from './blocks'

export default function SportPage({ id, data: given, hiddenNotice = false }: { id: SportId; data?: RecruitingData; hiddenNotice?: boolean }) {
  const fetched = useRecruiting()
  const data = given ?? fetched
  const cfg = data?.sportList.find((c) => c.id === id)
  useEffect(() => {
    if (!cfg) return
    applySportTheme(cfg)
    document.title = `${cfg.label} | Everharris`
    if (hiddenNotice) document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex">')
  }, [cfg, hiddenNotice])
  if (!data || !cfg) return <SiteShell page={id}>{null}</SiteShell>
  const sport: SportData = data.sports[id]
  const stats = currentStats(sport)
  const { athlete, academics } = data
  const pdf = `/profile/${id}/?print=1`
  const sub = [sport.positions, sport.handedness, bodyLine(data)].filter(Boolean).join(' | ')
  const extras = academicExtras(data)

  return (
    <SiteShell page={id}>
      {hiddenNotice && (
        <p role="status" className="bg-amber-500 px-4 py-2 text-center text-sm font-bold text-slate-950">
          Preview: this sport is hidden. Only you can see this page. Turn on Show on the website in Admin → Sports to publish it.
        </p>
      )}
      <section aria-labelledby="hero-title" className="mx-auto max-w-5xl px-4 pb-4 pt-6 sm:px-6 sm:pt-10">
        <div className="grid gap-5 md:grid-cols-2 md:items-stretch">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 md:aspect-auto md:min-h-80">
            <img src={sport.photo || (id === "softball" || id === "basketball" ? `/img/hero-${id}.svg` : "/img/hero-home.svg")} alt={`${athlete.name} playing ${sport.label.toLowerCase()}`} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `50% ${sport.photoFocus}%` }} />
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
                  {athlete.school} ({athlete.location}) | {currentTeam(sport)} | Jersey #{athlete.jersey}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Academics</dt>
                <dd className="mt-1 text-slate-200">
                  GPA: {academics.gpa} | {academics.courses}
                  {extras && <span className="mt-1 block text-slate-300">{extras}</span>}
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
        {(stats.length > 0 || sport.awards.length > 0) && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {stats.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Season stats</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  {stats.map((x, i) => (
                    <div key={i} className="flex justify-between gap-4">
                      <dt className="text-slate-300">{x.label}{x.note && <span className="text-slate-500"> ({x.note})</span>}</dt>
                      <dd className="font-extrabold tabular-nums text-slate-50">{x.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {sport.awards.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Awards & honors</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-100">
                  {sport.awards.map((x, i) => (
                    <li key={i}>
                      {x.title}
                      {x.year && <span className="text-slate-400"> · {x.year}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section id="schedule" kicker="Where to see Ever" title={sport.scheduleTitle}>
        <ScheduleTable sport={sport} events={sport.schedule} />
      </Section>

      <Section id="contacts" kicker="Recruiting" title="Teams, coaches & trainer">
        <div className="grid gap-4 sm:grid-cols-2">
          {teamsNewestFirst(sport).map((t, i) => (
            <TeamCard key={i} team={t} />
          ))}
          {sport.trainers.map((t, i) => (
            <TrainerCard key={i} trainer={t} />
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
