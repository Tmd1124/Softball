import type { CSSProperties } from 'react'
import type { RecruitingData, SportId, TeamItem } from '../data/recruitingData'
import { telHref } from './blocks'
import { bodyLine, hasRealPhoto } from './derive'
import { THEMES } from './ProfileSheet'
import QrCode from './QrCode'

export default function TeamSheet({ data, id, team, current }: { data: RecruitingData; id: SportId; team: TeamItem; current: boolean }) {
  const s = data[id]
  const t = THEMES[id]
  const { athlete, academics, contact, siteUrl } = data
  const vars = { '--dark': t.dark, '--mid': t.mid, '--accent': t.accent, '--tint': t.tint, '--ink': t.ink } as CSSProperties
  const link = 'underline decoration-1 underline-offset-2'
  const facts: [string, string][] = [
    ['Year', team.year],
    ['Type', team.type],
    ['Coach', team.coach],
    ['Owner', team.owner],
    ['Status', current ? 'Current' : 'Past'],
  ]
  const head = 'mb-2 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.16em]'

  return (
    <article style={{ ...vars, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="overflow-hidden bg-white text-[#16181d] shadow-lg print:shadow-none">
      <header className="flex items-center justify-between gap-5 px-6 py-5 text-white" style={{ background: 'var(--dark)', borderBottom: '5px solid var(--accent)' }}>
        {hasRealPhoto(s) && (
          <img src={s.photo} alt={athlete.name} className="h-[132px] w-[104px] shrink-0 rounded-lg object-cover" style={{ border: '3px solid var(--accent)', objectPosition: `50% ${s.photoFocus}%` }} />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>
            {s.label} team profile
          </p>
          <h1 className="mt-1 text-[30px] font-extrabold uppercase leading-tight tracking-tight">{team.name}</h1>
          <p className="mt-1.5 text-[15px] font-bold">
            {[team.year, team.type].filter(Boolean).join(' · ')}
            <span className="ml-3 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase" style={current ? { background: 'var(--accent)', color: 'var(--dark)' } : { border: '1px solid rgba(255,255,255,0.5)' }}>
              {current ? 'Current' : 'Past'}
            </span>
          </p>
          <p className="mt-1.5 text-[13px] text-white/80">
            {athlete.name} · Class of {athlete.classYear}
          </p>
        </div>
        <div className="shrink-0 text-center">
          <div className="rounded-lg bg-white p-1.5">
            <QrCode text={`${siteUrl}/teams/`} label={`QR code linking to ${siteUrl}/teams/`} className="block h-[84px] w-[84px]" />
          </div>
          <p className="mt-1 text-[9px] font-bold tracking-wide text-white/80">Scan for all teams</p>
        </div>
      </header>

      <div className="grid grid-cols-5 text-center" style={{ background: 'var(--tint)' }}>
        {facts.map(([k, v], i) => (
          <div key={k} className="px-2 py-2.5" style={i ? { borderLeft: '1px solid rgba(0,0,0,0.08)' } : undefined}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink)' }}>{k}</p>
            <p className="mt-0.5 text-[12px] font-bold leading-tight">{v || '—'}</p>
          </div>
        ))}
      </div>

      <div className="space-y-5 px-6 py-5">
        <section>
          <h2 className={head} style={{ color: 'var(--ink)' }}>
            <span className="h-3.5 w-1.5 rounded-sm" style={{ background: 'var(--accent)' }} />
            Team stats
          </h2>
          {team.stats.length > 0 ? (
            <dl className="grid grid-cols-4 gap-2.5">
              {team.stats.map((x, i) => (
                <div key={i} className="rounded-lg px-2.5 py-2" style={{ background: 'var(--dark)' }}>
                  <dt className="text-[9px] font-bold uppercase tracking-wider text-white/75">{x.label}</dt>
                  <dd className="mt-0.5 text-[26px] font-extrabold leading-none" style={{ color: 'var(--accent)' }}>{x.value}</dd>
                  {x.note && <dd className="mt-1 text-[9px] text-white/70">{x.note}</dd>}
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[12px] text-neutral-600">No stats have been entered for this team yet.</p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-6">
          <section>
            <h2 className={head} style={{ color: 'var(--ink)' }}>
              <span className="h-3.5 w-1.5 rounded-sm" style={{ background: 'var(--accent)' }} />
              Team contact
            </h2>
            <p className="text-[13px] leading-relaxed">
              <strong>{team.coach}</strong> <span className="text-neutral-600">· Coach</span>
              {team.owner && (
                <>
                  <br />
                  <strong>{team.owner}</strong> <span className="text-neutral-600">· Owner</span>
                </>
              )}
              <br />
              <a href={telHref(team.phone)} className={link}>{team.phone}</a>
              <br />
              <a href={`mailto:${team.email}`} className={link}>{team.email}</a>
              {team.social && (
                <>
                  <br />
                  <a href={team.social} className={link}>{team.social.replace('https://', '')}</a>
                </>
              )}
            </p>
          </section>
          <section>
            <h2 className={head} style={{ color: 'var(--ink)' }}>
              <span className="h-3.5 w-1.5 rounded-sm" style={{ background: 'var(--accent)' }} />
              Player
            </h2>
            <p className="text-[13px] leading-relaxed">
              <strong>{athlete.name}</strong> · Class of {athlete.classYear}
              <br />
              {[s.positions, s.handedness].filter(Boolean).join(' · ')}
              <br />
              {bodyLine(data)} · Jersey #{athlete.jersey}
              <br />
              {athlete.school} · GPA {academics.gpa}
            </p>
          </section>
        </div>
      </div>

      <footer className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3 text-[11px] text-white" style={{ background: 'var(--mid)', borderTop: '3px solid var(--accent)' }}>
        <p className="leading-snug">
          <strong style={{ color: 'var(--accent)' }}>Recruiting contact</strong> · <a href={`mailto:${contact.email}`}>{contact.email}</a> · <a href={telHref(contact.phone)}>{contact.phone}</a>
        </p>
        <p className="text-right font-bold">{siteUrl.replace('https://', '')}/{id}/</p>
      </footer>
    </article>
  )
}
