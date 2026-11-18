import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Printer } from 'lucide-react'
import '../index.css'
import { SPORT_IDS } from '../data/recruitingData'
import type { RecruitingData, SportId } from '../data/recruitingData'
import { useRecruiting } from '../lib/recruiting'
import ProfileSheet from '../recruit/ProfileSheet'

const params = new URLSearchParams(location.search)
const only = SPORT_IDS.find((s) => s === location.pathname.split('/').filter(Boolean)[1])

function Chooser({ data }: { data: RecruitingData }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-10 text-black">
      <a href="/" className="text-sm font-bold underline">← Back to site</a>
      <h1 className="mt-4 text-3xl font-extrabold">Recruiting profiles</h1>
      <p className="mt-1 text-neutral-700">One printable page per sport for {data.athlete.name}, Class of {data.athlete.classYear}.</p>
      <div className="mt-6 grid gap-3">
        {SPORT_IDS.map((id) => (
          <a key={id} href={`/profile/${id}/`} className="flex min-h-16 items-center justify-between rounded-2xl border-2 border-black bg-white px-5 font-extrabold">
            {data[id].label} profile <span aria-hidden>→</span>
          </a>
        ))}
      </div>
    </main>
  )
}

function SportProfile({ data, id }: { data: RecruitingData; id: SportId }) {
  const other = SPORT_IDS.find((x) => x !== id)!

  useEffect(() => {
    if (params.get('print') === '1') {
      let live = true
      void Promise.all([...document.images].map((i) => i.decode().catch(() => undefined))).then(() => live && setTimeout(() => window.print(), 300))
      return () => {
        live = false
      }
    }
  }, [])

  return (
    <main className="mx-auto max-w-[8.5in] px-3 py-4 text-black print:max-w-none print:p-0">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="flex gap-4 font-bold underline">
          <a href="/">← Back to site</a>
          <a href={`/profile/${other}/`}>{data[other].label} profile</a>
        </span>
        <p className="w-full text-xs text-neutral-600 sm:w-auto">Tip: in the print window, choose “Save as PDF” as the destination.</p>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-5 font-bold text-white">
          <Printer size={18} aria-hidden /> Print or save as PDF
        </button>
      </div>
      <ProfileSheet data={data} id={id} />
    </main>
  )
}

function Profile() {
  const data = useRecruiting()
  if (!data) return null
  return only ? <SportProfile data={data} id={only} /> : <Chooser data={data} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Profile />
  </StrictMode>,
)
