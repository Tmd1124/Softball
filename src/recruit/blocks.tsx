import type { ReactNode } from 'react'
import { Download, Globe, Mail, Phone, Play } from 'lucide-react'
import type { Metric, ScheduleEvent, SportData, TeamItem, TrainerItem, VideoItem } from '../data/recruitingData'

export const telHref = (phone: string) => `tel:+1${phone.replace(/\D/g, '')}`

export function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">{kicker}</p>
      <h2 id={id} className="mt-2 text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export const buttonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-600 px-5 text-sm font-bold text-slate-100 transition-colors hover:bg-slate-800 active:bg-slate-800'
export const primaryButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-amber-500 px-5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400 active:bg-amber-400'

export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {metrics.map((m) => (
        <div key={m.key} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">{m.label}</dt>
          <dd className="mt-2 text-3xl font-extrabold tabular-nums leading-none tracking-tight text-slate-50">
            {m.value}
            {m.unit && <span className="ml-1 text-base font-bold text-amber-400">{m.unit}</span>}
          </dd>
          <dd className="mt-2 text-xs text-slate-400">(Verified {m.verified})</dd>
        </div>
      ))}
    </dl>
  )
}

export function VideoEmbed({ video, large = false }: { video: VideoItem; large?: boolean }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="aspect-video bg-slate-950">
        {video.embedUrl ? (
          <iframe
            src={video.embedUrl}
            title={video.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
            <Play size={large ? 44 : 28} aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-widest">Video link to be added</span>
          </div>
        )}
      </div>
      <figcaption className="p-4">
        <p className={`font-extrabold text-slate-50 ${large ? 'text-lg sm:text-xl' : 'text-base'}`}>{video.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{video.blurb}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-amber-400">{video.length}</p>
      </figcaption>
    </figure>
  )
}

export function ScheduleTable({ sport, events }: { sport: SportData; events: ScheduleEvent[] }) {
  const th = 'px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-400'
  const td =
    'max-md:flex max-md:gap-3 max-md:py-1 before:max-md:w-20 before:max-md:shrink-0 before:max-md:text-xs before:max-md:font-bold before:max-md:uppercase before:max-md:tracking-widest before:max-md:text-slate-400 before:max-md:content-[attr(data-label)] md:px-4 md:py-3'
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <table className="w-full text-sm text-slate-200 max-md:block">
        <thead className="max-md:sr-only">
          <tr className="border-b border-slate-800">
            <th scope="col" className={th}>Date</th>
            <th scope="col" className={th}>{sport.scheduleColumns.event}</th>
            <th scope="col" className={th}>Location</th>
            <th scope="col" className={th}>Team</th>
            <th scope="col" className={th}>{sport.scheduleColumns.info}</th>
          </tr>
        </thead>
        <tbody className="max-md:block">
          {events.map((e, i) => (
            <tr key={i} className="border-b border-slate-800 last:border-0 max-md:block max-md:p-4">
              <td data-label="Date" className={`${td} font-bold text-slate-50`}>{e.date}</td>
              <td data-label="Event" className={td}>{e.event}</td>
              <td data-label="Location" className={td}>{e.location}</td>
              <td data-label="Team" className={td}>{e.team}</td>
              <td data-label="Info" className={td}>
                {e.infoUrl ? (
                  <a href={e.infoUrl} className="font-semibold text-amber-400 underline underline-offset-2">
                    {e.info}
                  </a>
                ) : (
                  e.info
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const contactLink = 'flex min-h-12 items-center gap-2 font-semibold text-slate-100 hover:text-amber-400'

export function TeamCard({ team }: { team: TeamItem }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-amber-400">{[team.year, team.type].filter(Boolean).join(' · ')}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-50">{team.name}</p>
      {team.coach && <p className="text-sm text-slate-300">Coach: {team.coach}</p>}
      {team.owner && <p className="text-sm text-slate-300">Owner: {team.owner}</p>}
      <a href={telHref(team.phone)} className={contactLink}>
        <Phone size={16} aria-hidden /> {team.phone}
      </a>
      <a href={`mailto:${team.email}`} className={`${contactLink} break-all`}>
        <Mail size={16} aria-hidden /> {team.email}
      </a>
      {team.social && (
        <a href={team.social} target="_blank" rel="noopener noreferrer" className={contactLink}>
          <Globe size={16} aria-hidden /> Social
        </a>
      )}
    </div>
  )
}

export function TrainerCard({ trainer }: { trainer: TrainerItem }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Personal training instructor</p>
      <p className="mt-1 text-lg font-extrabold text-slate-50">{trainer.name}</p>
      <a href={telHref(trainer.phone)} className={contactLink}>
        <Phone size={16} aria-hidden /> {trainer.phone}
      </a>
      <a href={`mailto:${trainer.email}`} className={`${contactLink} break-all`}>
        <Mail size={16} aria-hidden /> {trainer.email}
      </a>
    </div>
  )
}

export function PdfButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className={primaryButtonClass}>
      <Download size={18} aria-hidden /> {children}
    </a>
  )
}
