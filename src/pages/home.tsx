import type { ReactNode } from 'react'
import { CalendarDays } from 'lucide-react'
import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import { useRecruiting } from '../lib/recruiting'
import { PdfButton } from '../recruit/blocks'

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

function Home() {
  const data = useRecruiting()
  if (!data) return <SiteShell page="home">{null}</SiteShell>
  const { athlete, academics, softball, basketball } = data
  return (
  <SiteShell page="home">
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-slate-800">
      <img src="/img/hero-home.svg" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-16">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">Coach’s snapshot</p>
        <h1 id="hero-title" className="mt-3 text-5xl font-extrabold leading-[0.98] tracking-tight text-slate-50 sm:text-7xl">
          {athlete.name}
          <span className="mt-2 block text-3xl text-amber-400 sm:text-4xl">Class of {athlete.classYear}</span>
        </h1>
        <dl className="mt-8 grid gap-6 rounded-3xl border border-slate-700 bg-slate-950/80 p-6 backdrop-blur sm:grid-cols-2 sm:p-8">
          <Fact label="School & teams">
            {athlete.school} ({athlete.location})
            <br />
            {softball.team}
            <br />
            {basketball.team}
            <br />
            Jersey #{athlete.jersey}
          </Fact>
          <Fact label="Academics">
            GPA: {academics.gpa}
            <br />
            {academics.courses}
          </Fact>
          <Fact label="Softball">
            {softball.positions}
            <br />
            {softball.handedness} | {athlete.height}
          </Fact>
          <Fact label="Basketball">
            {basketball.positions}
            <br />
            {athlete.height}
          </Fact>
        </dl>
        <div className="mt-6">
          <PdfButton href="/profile/?print=1">Download 1-Page Recruiting Profile (PDF)</PdfButton>
        </div>
      </div>
    </section>

    <section aria-label="Quick links" className="mx-auto grid max-w-5xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3">
      <JumpCard href="/softball/" title="Softball" blurb="Metrics, film and references" icon={<img src="/img/softball.svg" alt="" width={56} height={56} />} />
      <JumpCard href="/basketball/" title="Basketball" blurb="Metrics, film and references" icon={<img src="/img/basketball.svg" alt="" width={56} height={56} />} />
      <JumpCard href="/schedule/" title="Schedule" blurb="Upcoming events to watch" icon={<CalendarDays size={56} className="text-amber-400" aria-hidden />} />
    </section>
  </SiteShell>
  )
}

mount(<Home />)
