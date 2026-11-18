import ScrollRow from '../admin/ScrollRow'
import { useEffect, useState } from 'react'
import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import LoginForm from '../site/LoginForm'
import { useAuth } from '../lib/auth'
import Content from '../admin/Content'
import Users from '../admin/Users'
import Sports from '../admin/Sports'
import { api } from '../lib/api'
import type { Store } from '../lib/recruiting'

function Admin() {
  const { status, user } = useAuth()
  if (status === 'loading') return <p className="p-6 text-sm text-slate-400">Loading…</p>
  if (!user)
    return (
      <div className="mx-auto max-w-sm px-4 py-10">
        <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-50">Admin log in</h1>
        <LoginForm autoFocus />
      </div>
    )
  if (user.role !== 'admin')
    return (
      <div className="mx-auto max-w-sm px-4 py-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-50">Admins only</h1>
        <p className="mt-2 text-sm text-slate-300">Your account does not have access to site administration.</p>
      </div>
    )
  return <Panels meId={user.id} />
}

function route() {
  const [first, step = ''] = location.hash.slice(1).split('/')
  return { tab: first || 'overview', step }
}

function Panels({ meId }: { meId: number }) {
  const [{ tab, step }, setRoute] = useState(route)
  const [store, setStore] = useState<Store | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const on = () => setRoute(route())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  useEffect(() => {
    api<Store>('recruiting.php?all=1')
      .then(setStore)
      .catch(() => setError('Could not load the site content'))
  }, [])

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'site', label: 'Athlete & contacts' },
    ...(store?.sports ?? []).map((c) => ({ id: c.id, label: c.visible ? c.label : `${c.label} (hidden)` })),
    { id: 'sports', label: 'Sports' },
    { id: 'users', label: 'Users' },
  ]
  const active = tabs.some((t) => t.id === tab) ? tab : 'overview'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">Admin</p>
      <ScrollRow label="Admin sections" className="mt-3">
        {tabs.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            aria-current={active === t.id ? 'page' : undefined}
            className="flex min-h-12 shrink-0 items-center rounded-full border border-slate-700 px-4 text-sm font-bold text-slate-300 aria-[current=page]:border-amber-500 aria-[current=page]:bg-amber-500 aria-[current=page]:text-slate-950"
          >
            {t.label}
          </a>
        ))}
      </ScrollRow>
      <div className="mt-6" hidden={active === 'users' || active === 'sports'}>
        {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
        {!error && !store && <p className="text-sm text-slate-400">Loading…</p>}
        {store && <Content area={active === 'users' || active === 'sports' ? 'overview' : active} step={step} store={store} setStore={setStore} />}
      </div>
      {active === 'sports' && store && (
        <div className="mt-6">
          <Sports store={store} setStore={setStore} />
        </div>
      )}
      {active === 'users' && (
        <div className="mx-auto mt-6 max-w-3xl">
          <Users meId={meId} />
        </div>
      )}
    </div>
  )
}

mount(
  <SiteShell page="admin">
    <Admin />
  </SiteShell>,
)
