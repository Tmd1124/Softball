import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Printer } from 'lucide-react'
import '../index.css'
import { SPORT_IDS } from '../data/recruitingData'
import type { RecruitingData, SportData, SportId } from '../data/recruitingData'
import { useRecruiting } from '../lib/recruiting'
import { telHref } from '../recruit/blocks'
import { summaryText } from '../recruit/SportPage'

const params = new URLSearchParams(location.search)
const only = SPORT_IDS.find((s) => s === params.get('sport')) as SportId | undefined
const sports = only ? [only] : SPORT_IDS

function SportColumn({ id, recruiting }: { id: SportId; recruiting: RecruitingData }) {
  const s: SportData = recruiting[id]
  return (
    <section className="break-inside-avoid">
      <h2 className="border-b-2 border-black pb-1 text-lg font-extrabold uppercase tracking-wide">{s.label}</h2>
      <p className="mt-2 text-sm font-bold">{[s.positions, s.handedness, recruiting.athlete.height].filter(Boolean).join(' | ')}</p>
      <p className="text-sm">{s.team}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        {s.metrics.map((m) => (
          <div key={m.key} className="rounded border border-black/30 p-2">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">{m.label}</dt>
            <dd className="text-xl font-extrabold leading-tight">
              {m.value} {m.unit && <span className="text-xs">{m.unit}</span>}
            </dd>
            <dd className="text-[10px] text-neutral-600">(Verified {m.verified})</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed">
        <strong>Player Profile:</strong> {summaryText(s)}
      </p>
      <h3 className="mt-3 text-xs font-bold uppercase tracking-wider">Upcoming</h3>
      <ul className="text-xs leading-relaxed">
        {s.schedule.slice(0, 3).map((e, i) => (
          <li key={i}>
            {e.date} · {e.event} · {e.location}
          </li>
        ))}
      </ul>
      <h3 className="mt-3 text-xs font-bold uppercase tracking-wider">Coach references</h3>
      <ul className="text-xs leading-relaxed">
        {s.coaches.map((c) => (
          <li key={c.role}>
            {c.role}: {c.name} · <a href={telHref(c.phone)}>{c.phone}</a> · <a href={`mailto:${c.email}`}>{c.email}</a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Profile() {
  const recruiting = useRecruiting()
  useEffect(() => {
    if (recruiting && params.get('print') === '1') {
      const t = setTimeout(() => window.print(), 500)
      return () => clearTimeout(t)
    }
  }, [recruiting])

  if (!recruiting) return null
  const { athlete, academics, contact, siteUrl } = recruiting
  return (
    <main className="mx-auto max-w-[8.5in] px-3 py-4 text-black print:max-w-none print:p-0">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <a href="/" className="font-bold underline">← Back to site</a>
        <p className="w-full text-xs text-neutral-600 sm:w-auto">Tip: in the print window, choose “Save as PDF” as the destination.</p>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-5 font-bold text-white">
          <Printer size={18} aria-hidden /> Print or save as PDF
        </button>
      </div>
      <article className="bg-white p-6 shadow-lg print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b-4 border-black pb-3">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight">{athlete.name}</h1>
            <p className="text-base font-bold">
              Class of {athlete.classYear} · {athlete.school} ({athlete.location}) · Jersey #{athlete.jersey}
            </p>
            <p className="text-sm">
              GPA: {academics.gpa} | {academics.courses}
            </p>
          </div>
          <div className="shrink-0 text-center">
            <div className="flex h-20 w-20 items-center justify-center border-2 border-dashed border-black text-[10px] font-bold uppercase leading-tight">
              QR code
              <br />
              placeholder
            </div>
            <p className="mt-1 text-[10px] font-bold">{siteUrl.replace('https://', '')}</p>
          </div>
        </header>
        <div className={`mt-4 grid gap-6 ${sports.length > 1 ? 'sm:grid-cols-2 print:grid-cols-2' : ''}`}>
          {sports.map((id) => (
            <SportColumn key={id} id={id} recruiting={recruiting} />
          ))}
        </div>
        <footer className="mt-5 border-t-2 border-black pt-2 text-xs leading-relaxed">
          <strong>Recruiting contact:</strong> <a href={`mailto:${contact.email}`}>{contact.email}</a> · <a href={telHref(contact.phone)}>{contact.phone}</a> ·{' '}
          <strong>Parent:</strong> {contact.parent.name} · <a href={telHref(contact.parent.phone)}>{contact.parent.phone}</a> ·{' '}
          <strong>X:</strong> {contact.social.x.handle} · <strong>Instagram:</strong> {contact.social.instagram.handle}
        </footer>
      </article>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Profile />
  </StrictMode>,
)
