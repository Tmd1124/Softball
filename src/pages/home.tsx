import type { ReactNode } from 'react'
import { CalendarDays } from 'lucide-react'
import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import { useRecruiting } from '../lib/recruiting'
import { PdfButton } from '../recruit/blocks'
import type { SportData } from '../data/recruitingData'
import { hasRealPhoto, rankedTeams } from '../recruit/derive'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</dt>
      <dd className="mt-1 text-base leading-relaxed text-slate-100">{children}</dd>
    </div>
  )
}

function JumpCard({ href, title, blurb, icon }: { href: string; title: string; blurb: string; icon: ReactNode }) {
  return (
    <a
      href={href}
      className="group flex min-h-24 items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-amber-500/60"
    >
      <span className="shrink-0 transition-transform group-hover:scale-105">{icon}</span>
      <span className="flex-1">
        <span className="block text-xl font-extrabold tracking-tight text-slate-50">{title}</span>
        <span className="mt-1 block text-sm text-slate-300">{blurb}</span>
      </span>
      <span aria-hidden className="text-slate-500">→</span>
    </a>
  )
}

function Latest({ sport }: { sport: SportData }) {
  const t = rankedTeams(sport)[0]?.team
  if (!t) return null
  return (
    <span className="mt-2 block">
      <span className="text-slate-400">{sport.label}:</span> <strong>{t.name}</strong>
      {t.year && ` (${t.year})`}
      {t.coach && ` · Coach ${t.coach}`}
      {t.social && (
        <>
          {' · '}
          <a href={t.social} target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-400">Social</a>
        </>
      )}
    </span>
  )
}

function Home() {
  const data = useRecruiting()
  if (!data) return <SiteShell page="home">{null}</SiteShell>
  const { athlete, academics, sportList, sports } = data
  const photoSports = sportList.filter((c) => hasRealPhoto(sports[c.id]))
  const small = photoSports.length > 2
  return (
  <SiteShell page="home">
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-slate-800">
      <img src="/img/hero-home.svg" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-16">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">Coach’s snapshot</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h1 id="hero-title" className="text-5xl font-extrabold leading-[0.98] tracking-tight text-slate-50 sm:text-7xl">
            {athlete.name}
            <span className="mt-2 block text-3xl text-amber-400 sm:text-4xl">Class of {athlete.classYear}</span>
          </h1>
          <div className="flex shrink-0 gap-2 sm:gap-3">
            {photoSports.map((c) => (
              <a key={c.id} href={`/${c.id}/`} className="block text-center">
                <img
                  src={sports[c.id].photo}
                  alt={`${athlete.name}, ${c.label}`}
                  className={`rounded-xl border-2 border-amber-400 object-cover ${small ? 'h-20 w-14 sm:h-32 sm:w-24' : 'h-24 w-[4.75rem] sm:h-40 sm:w-32'}`}
                  style={{ objectPosition: `50% ${sports[c.id].photoFocus}%` }}
                />
                <span className="mt-1 block text-xs font-bold uppercase tracking-widest text-slate-300">{c.label}</span>
              </a>
            ))}
          </div>
        </div>
        <dl className="mt-8 grid gap-6 rounded-3xl border border-slate-700 bg-slate-950/80 p-6 backdrop-blur sm:grid-cols-2 sm:p-8">
          <Fact label="School & teams">
            {athlete.school} ({athlete.location})
            <br />
            Jersey #{athlete.jersey}
            {sportList.map((c) => (
              <Latest key={c.id} sport={sports[c.id]} />
            ))}
            <a href="/teams/" className="mt-2 inline-block font-bold text-amber-400 underline">All teams &amp; coaches →</a>
          </Fact>
          <Fact label="Academics">
            GPA: {academics.gpa}
            <br />
            {academics.courses}
          </Fact>
          {sportList.map((c) => (
            <Fact key={c.id} label={c.label}>
              {sports[c.id].positions}
              <br />
              {c.handedness && sports[c.id].handedness ? `${sports[c.id].handedness} | ` : ''}
              {athlete.height}
            </Fact>
          ))}
        </dl>
        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            {sportList.map((c) => (
              <PdfButton key={c.id} href={`/profile/${c.id}/?print=1`}>{c.label} Recruiting Profile (PDF)</PdfButton>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section aria-label="Quick links" className="mx-auto grid max-w-5xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3">
      {sportList.map((c) => (
        <JumpCard
          key={c.id}
          href={`/${c.id}/`}
          title={c.label}
          blurb="Metrics, film and references"
          icon={
            c.id === 'softball' || c.id === 'basketball' ? (
              <img src={`/img/${c.id}.svg`} alt="" width={56} height={56} />
            ) : (
              <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-2xl font-extrabold text-slate-950">
                {c.label.charAt(0).toUpperCase()}
              </span>
            )
          }
        />
      ))}
      <JumpCard href="/schedule/" title="Schedule" blurb="Upcoming events to watch" icon={<CalendarDays size={56} className="text-amber-400" aria-hidden />} />
    </section>
  </SiteShell>
  )
}

mount(<Home />)
