import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import { useRecruiting } from '../lib/recruiting'
import { ScheduleTable, Section } from '../recruit/blocks'

function Schedule() {
  const recruiting = useRecruiting()
  return (
  <SiteShell page="schedule">
    {recruiting && <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-14">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">Class of {recruiting.athlete.classYear}</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-50 sm:text-5xl">Where to see Ever play</h1>
    </div>}
    {recruiting && recruiting.sportList.map(({ id }) => (
      <Section key={id} id={`schedule-${id}`} kicker={recruiting.sports[id].label} title={recruiting.sports[id].scheduleTitle}>
        <ScheduleTable sport={recruiting.sports[id]} events={recruiting.sports[id].schedule} />
      </Section>
    ))}
  </SiteShell>
  )
}

mount(<Schedule />)
