import { Dumbbell } from 'lucide-react'
import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import Hero, { CtaLink } from '../site/Hero'
import { HighlightsSection, StatusSection } from '../site/Sections'
import { useSummary } from '../lib/summary'

function Softball() {
  const summary = useSummary()
  return (
    <SiteShell page="softball">
      <Hero
        image="/img/hero-softball.svg"
        kicker="Softball"
        title={
          <>
            Catcher
            <br />
            <span className="text-amber-400">strength.</span>
          </>
        }
        text="Off-season and in-season lifting plus a daily mobility routine, built around the demands of the crouch and the throw-down."
      >
        <CtaLink href="/softball/workouts/" primary>
          <Dumbbell size={18} aria-hidden /> Open workouts
        </CtaLink>
      </Hero>
      <StatusSection state={summary} sport="softball" />
      <HighlightsSection state={summary} sport="softball" />
    </SiteShell>
  )
}

mount(<Softball />)
