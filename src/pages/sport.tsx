import { useEffect, useState } from 'react'
import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import SportPage from '../recruit/SportPage'
import { api } from '../lib/api'
import { merge, useRecruiting } from '../lib/recruiting'
import type { Store } from '../lib/recruiting'
import type { RecruitingData } from '../data/recruitingData'

const slug = location.pathname.split('/').filter(Boolean)[0] ?? ''

function NotFound() {
  return (
    <SiteShell page="">
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-50">Page not found</h1>
        <p className="mt-3 text-slate-300">That page is not on this site. Use the menu above to find what you are looking for.</p>
        <a href="/" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-amber-500 px-6 font-bold text-slate-950">Back to home</a>
      </div>
    </SiteShell>
  )
}

function Route() {
  const data = useRecruiting()
  const [hidden, setHidden] = useState<RecruitingData | null | undefined>(undefined)
  const shown = data?.sportList.some((c) => c.id === slug)

  useEffect(() => {
    if (!data || shown) return
    api<Store>('recruiting.php?all=1')
      .then((r) => {
        const all = merge(r)
        setHidden(all.sportList.some((c) => c.id === slug) ? all : null)
      })
      .catch(() => setHidden(null))
  }, [data, shown])

  if (!data) return <SiteShell page={slug}>{null}</SiteShell>
  if (shown) return <SportPage id={slug} />
  if (hidden === undefined) return <SiteShell page={slug}>{null}</SiteShell>
  if (hidden) return <SportPage id={slug} data={hidden} hiddenNotice />
  return <NotFound />
}

mount(<Route />)
