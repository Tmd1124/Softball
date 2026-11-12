import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import Hero from '../site/Hero'
import { HighlightsSection, StatusSection } from '../site/Sections'
import { useSummary } from '../lib/summary'

function Basketball() {
  const summary = useSummary()
  return (
    <SiteShell page="basketball">
      <Hero
        image="/img/hero-basketball.svg"
        kicker="Basketball"
        title={
          <>
            On the
            <br />
            <span className="text-amber-400">court.</span>
          </>
        }
        text="Court work, conditioning and game highlights. Workout tracking for basketball is coming soon."
      />
      <StatusSection state={summary} sport="basketball" />
      <HighlightsSection state={summary} sport="basketball" />
    </SiteShell>
  )
}

mount(<Basketball />)
