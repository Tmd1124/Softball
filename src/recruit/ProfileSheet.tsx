import type { CSSProperties, ReactNode } from 'react'
import type { RecruitingData, SportData, SportId } from '../data/recruitingData'
import { telHref } from './blocks'
import QrCode from './QrCode'
import { academicExtras, bodyLine, hasRealPhoto, summaryText } from './derive'

interface Theme {
  dark: string
  mid: string
  accent: string
  tint: string
  ink: string
}

const THEMES: Record<SportId, Theme> = {
  softball: { dark: '#0d2214', mid: '#153220', accent: '#cde62b', tint: '#f1f7d9', ink: '#1d4a2d' },
  basketball: { dark: '#1e130b', mid: '#2e1d11', accent: '#f97316', tint: '#fff0e3', ink: '#9a3a0a' },
}

function Head({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-1.5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em]" style={{ color: 'var(--ink)' }}>
      <span className="h-3.5 w-1.5 rounded-sm" style={{ background: 'var(--accent)' }} />
      {children}
    </h2>
  )
}

export default function ProfileSheet({ data, id, className = '' }: { data: RecruitingData; id: SportId; className?: string }) {
  const s: SportData = data[id]
  const t = THEMES[id]
  const { athlete, academics, contact, siteUrl } = data
  const pageUrl = `${siteUrl}/${id}/`
  const extras = academicExtras(data)
  const vars = { '--dark': t.dark, '--mid': t.mid, '--accent': t.accent, '--tint': t.tint, '--ink': t.ink } as CSSProperties
  const subline = [s.positions, s.handedness, bodyLine(data)].filter(Boolean).join('  ·  ')
  const facts: [string, string][] = [
    ['Class', String(athlete.classYear)],
    ['GPA', academics.gpa],
    ['Jersey', `#${athlete.jersey}`],
    ['School', athlete.school],
    ['Team', s.team],
  ]
  const link = 'underline decoration-1 underline-offset-2'

  return (
    <article
      style={{ ...vars, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      className={`overflow-hidden bg-white text-[#16181d] shadow-lg print:shadow-none ${className}`}
    >
      <header className="flex items-center justify-between gap-5 px-6 py-5 text-white" style={{ background: 'var(--dark)', borderBottom: '5px solid var(--accent)' }}>
        {hasRealPhoto(s) && (
          <img
            src={s.photo}
            alt={athlete.name}
            className="h-[132px] w-[104px] shrink-0 rounded-lg object-cover"
            style={{ border: '3px solid var(--accent)', objectPosition: '50% 20%' }}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>
            {s.label} recruiting profile
          </p>
          <h1 className="mt-1 text-[34px] font-extrabold uppercase leading-none tracking-tight">{athlete.name}</h1>
          <p className="mt-1.5 text-[15px] font-bold">
            <span style={{ color: 'var(--accent)' }}>Class of {athlete.classYear}</span>
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-white/90">{subline}</p>
          <p className="mt-0.5 text-[12px] text-white/70">
            {athlete.school} · {athlete.location}
          </p>
        </div>
        <div className="shrink-0 text-center">
          <div className="rounded-lg bg-white p-1.5">
            <QrCode text={pageUrl} label={`QR code linking to ${pageUrl}`} className="block h-[84px] w-[84px]" />
          </div>
          <p className="mt-1 text-[9px] font-bold tracking-wide text-white/80">Scan for film & updates</p>
        </div>
      </header>

      <div className="grid grid-cols-5 text-center" style={{ background: 'var(--tint)' }}>
        {facts.map(([k, v], i) => (
          <div key={k} className="px-2 py-2" style={i ? { borderLeft: '1px solid rgba(0,0,0,0.08)' } : undefined}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink)' }}>{k}</p>
            <p className="mt-0.5 text-[11px] font-bold leading-tight">{v}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4 px-6 py-5">
        <section>
          <Head>Verified metrics</Head>
          <dl className="grid grid-cols-4 gap-2.5">
            {s.metrics.map((m) => (
              <div key={m.key} className="rounded-lg px-2.5 py-2" style={{ background: 'var(--dark)' }}>
                <dt className="text-[9px] font-bold uppercase tracking-wider text-white/75">{m.label}</dt>
                <dd className="mt-0.5 text-[26px] font-extrabold leading-none" style={{ color: 'var(--accent)' }}>
                  {m.value}
                  {m.unit && <span className="ml-1 text-[11px] font-bold text-white">{m.unit}</span>}
                </dd>
                <dd className="mt-1 text-[9px] text-white/70">Verified {m.verified}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="grid grid-cols-[1.15fr_1fr] gap-5">
          <div className="space-y-4">
            <section>
              <Head>Player profile</Head>
              <p className="text-[11.5px] leading-[1.55]">{summaryText(s)}</p>
            </section>
            {(s.stats.length > 0 || s.awards.length > 0) && (
              <section className="rounded-lg p-3" style={{ background: 'var(--tint)' }}>
                {s.stats.length > 0 && (
                  <>
                    <Head>Season stats</Head>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                      {s.stats.map((x, i) => (
                        <div key={i} className="flex justify-between gap-2">
                          <dt>{x.label}</dt>
                          <dd className="font-extrabold">{x.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </>
                )}
                {s.awards.length > 0 && (
                  <div className={s.stats.length ? 'mt-3' : ''}>
                    <Head>Awards & honors</Head>
                    <ul className="text-[11px] leading-snug">
                      {s.awards.map((x, i) => (
                        <li key={i}>
                          {x.title}
                          {x.year && <span className="text-neutral-600"> · {x.year}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
            <section>
              <Head>Academics</Head>
              <p className="text-[11.5px] leading-snug">
                GPA {academics.gpa} · {academics.courses}
                {extras && <span className="block text-neutral-600">{extras}</span>}
              </p>
            </section>
            <section>
              <Head>Film</Head>
              <ul className="text-[11px] leading-snug">
                {[s.featured, ...s.clips].map((v) => (
                  <li key={v.title}>{v.title}</li>
                ))}
              </ul>
              <p className="mt-1 text-[11px] font-bold" style={{ color: 'var(--ink)' }}>Watch at {pageUrl.replace('https://', '')}</p>
            </section>
          </div>

          <div className="space-y-4">
            <section>
              <Head>Where to see Ever</Head>
              <ul className="space-y-1.5 text-[11px] leading-snug">
                {s.schedule.slice(0, 5).map((e, i) => (
                  <li key={i} className="rounded-md px-2 py-1" style={{ background: 'var(--tint)' }}>
                    <strong>{e.date}</strong> · {e.event}
                    <br />
                    <span className="text-neutral-600">
                      {e.location} · {e.team}
                      {e.info ? ` · ${e.info}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <Head>Coach references</Head>
              <ul className="space-y-1.5 text-[11px] leading-snug">
                {s.coaches.map((c) => (
                  <li key={c.role}>
                    <strong>{c.name}</strong> <span className="text-neutral-600">· {c.role}</span>
                    <br />
                    <a href={telHref(c.phone)} className={link}>{c.phone}</a> · <a href={`mailto:${c.email}`} className={link}>{c.email}</a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <footer className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3 text-[11px] text-white" style={{ background: 'var(--mid)', borderTop: '3px solid var(--accent)' }}>
        <p className="leading-snug">
          <strong style={{ color: 'var(--accent)' }}>Recruiting contact</strong> · <a href={`mailto:${contact.email}`}>{contact.email}</a> · <a href={telHref(contact.phone)}>{contact.phone}</a>
          <br />
          <strong style={{ color: 'var(--accent)' }}>Parent / guardian</strong> · {contact.parent.name} · <a href={telHref(contact.parent.phone)}>{contact.parent.phone}</a>
        </p>
        <p className="text-right leading-snug">
          {contact.social.x.handle} · {contact.social.instagram.handle}
          <br />
          <strong>{pageUrl.replace('https://', '')}</strong>
        </p>
      </footer>
    </article>
  )
}
