import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import Hero, { CtaLink } from '../site/Hero'
import { HighlightsSection, StatusSection } from '../site/Sections'
import { useSummary } from '../lib/summary'

function SportCard({ id, name, blurb }: { id: 'softball' | 'basketball'; name: string; blurb: string }) {
  return (
    <a
      href={`/${id}/`}
      className="group flex items-center gap-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-amber-500/60"
    >
      <img src={`/img/${id}.svg`} alt="" width={72} height={72} className="shrink-0 transition-transform group-hover:scale-105" />
      <span>
        <span className="block text-2xl font-extrabold tracking-tight text-slate-50">{name}</span>
        <span className="mt-1 block text-sm leading-relaxed text-slate-300">{blurb}</span>
      </span>
    </a>
  )
}

function Home() {
  const summary = useSummary()
  return (
    <SiteShell page="home">
      <Hero
        image="/img/hero-home.svg"
        kicker="Softball · Basketball"
        title={
          <>
            Built for the
            <br />
            <span className="text-amber-400">next game.</span>
          </>
        }
        text="One home for training, status and highlights across every sport. Pick a sport to get started."
      >
        <CtaLink href="/softball/" primary>
          <img src="/img/softball.svg" alt="" width={22} height={22} /> Softball
        </CtaLink>
        <CtaLink href="/basketball/">
          <img src="/img/basketball.svg" alt="" width={22} height={22} /> Basketball
        </CtaLink>
      </Hero>

      <section aria-label="Sports" className="mx-auto grid max-w-5xl gap-4 px-4 pt-10 sm:grid-cols-2 sm:px-6">
        <SportCard id="softball" name="Softball" blurb="Catcher strength, conditioning and mobility. Log every set and weight." />
        <SportCard id="basketball" name="Basketball" blurb="Court work, conditioning and highlights. Tracking is on the way." />
      </section>

      <StatusSection state={summary} />
      <HighlightsSection state={summary} />
    </SiteShell>
  )
}

mount(<Home />)
