import { useEffect } from 'react'
import { Globe, Mail, Phone, Printer } from 'lucide-react'
import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import type { RecruitingData, SportId } from '../data/recruitingData'
import { useRecruiting } from '../lib/recruiting'
import { telHref, buttonClass } from '../recruit/blocks'
import { rankedTeams } from '../recruit/derive'
import type { RankedTeam } from '../recruit/derive'
import TeamSheet from '../recruit/TeamSheet'

const params = new URLSearchParams(location.search)
const sportParam = params.get('sport')
const teamParam = Number(params.get('n'))
if (sportParam) document.documentElement.className = 'theme-profile'

function TeamCard({ id, r }: { id: SportId; r: RankedTeam }) {
  const { team, current } = r
  const row = 'flex min-h-12 items-center gap-3 text-lg font-semibold text-slate-100 hover:text-amber-400'
  return (
    <article className={`rounded-3xl border p-5 sm:p-6 ${current ? 'border-amber-500 bg-slate-900 ring-1 ring-amber-500/40' : 'border-slate-800 bg-slate-900/60'}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-widest ${current ? 'bg-amber-400 text-slate-950' : 'border border-slate-600 text-slate-300'}`}>{current ? 'Current' : 'Past'}</span>
        <span className="text-2xl font-extrabold text-slate-50">{team.year}</span>
        {team.type && <span className="text-sm font-bold uppercase tracking-widest text-slate-400">{team.type}</span>}
      </div>
      <h3 className="mt-3 text-2xl font-extrabold leading-tight text-slate-50 sm:text-3xl">{team.name}</h3>
      <dl className="mt-3 grid gap-x-8 gap-y-1 text-lg sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Coach</dt>
          <dd className="font-semibold text-slate-50">{team.coach || '—'}</dd>
        </div>
        {team.owner && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">Owner</dt>
            <dd className="font-semibold text-slate-50">{team.owner}</dd>
          </div>
        )}
      </dl>
      <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
        <a href={telHref(team.phone)} className={row}>
          <Phone size={18} aria-hidden /> {team.phone}
        </a>
        <a href={`mailto:${team.email}`} className={`${row} break-all`}>
          <Mail size={18} aria-hidden /> {team.email}
        </a>
        {team.social && (
          <a href={team.social} target="_blank" rel="noopener noreferrer" className={row}>
            <Globe size={18} aria-hidden /> Social
          </a>
        )}
      </div>
      {team.stats.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {team.stats.map((x, i) => (
            <div key={i} className="rounded-xl bg-slate-950 px-3 py-2">
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{x.label}</dt>
              <dd className="text-2xl font-extrabold text-amber-400">{x.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <a href={`/teams/?sport=${id}&n=${r.n}&print=1`} className={`${buttonClass} mt-5`}>
        <Printer size={18} aria-hidden /> Team PDF
      </a>
    </article>
  )
}

function List({ data }: { data: RecruitingData }) {
  return (
    <SiteShell page="teams">
      <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-14">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">Class of {data.athlete.classYear}</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-50 sm:text-5xl">Teams & coaches</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-300">Every team {data.athlete.name} has played for, newest first. The most recent year in each sport is marked Current.</p>
      </div>
      {data.sportList.map(({ id }) => {
        const teams = rankedTeams(data.sports[id])
        return (
          <section key={id} aria-labelledby={`teams-${id}`} className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
            <h2 id={`teams-${id}`} className="text-2xl font-extrabold text-slate-50 sm:text-3xl">{data.sports[id].label}</h2>
            <div className="mt-5 space-y-4">
              {teams.length === 0 && <p className="text-slate-400">No teams listed yet.</p>}
              {teams.map((r) => (
                <TeamCard key={r.n} id={id} r={r} />
              ))}
            </div>
          </section>
        )
      })}
    </SiteShell>
  )
}

function Sheet({ data, id, n }: { data: RecruitingData; id: SportId; n: number }) {
  const r = data.sports[id] ? rankedTeams(data.sports[id]).find((x) => x.n === n) : undefined
  useEffect(() => {
    if (r && params.get('print') === '1') {
      let live = true
      void Promise.all([...document.images].map((i) => i.decode().catch(() => undefined))).then(() => live && setTimeout(() => window.print(), 300))
      return () => {
        live = false
      }
    }
  }, [r])
  if (!r) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10 text-black">
        <a href="/teams/" className="font-bold underline">← All teams & coaches</a>
        <p className="mt-4">That team was not found.</p>
      </main>
    )
  }
  return (
    <main className="mx-auto max-w-[8.5in] px-3 py-4 text-black print:max-w-none print:p-0">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <a href="/teams/" className="font-bold underline">← All teams & coaches</a>
        <p className="w-full text-xs text-neutral-600 sm:w-auto">Tip: in the print window, choose “Save as PDF” as the destination.</p>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-5 font-bold text-white">
          <Printer size={18} aria-hidden /> Print or save as PDF
        </button>
      </div>
      <TeamSheet data={data} id={id} team={r.team} current={r.current} />
    </main>
  )
}

function Teams() {
  const data = useRecruiting()
  if (!data) return <SiteShell page="teams">{null}</SiteShell>
  return sportParam ? <Sheet data={data} id={sportParam} n={teamParam} /> : <List data={data} />
}

mount(<Teams />)
