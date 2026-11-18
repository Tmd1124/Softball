import { useEffect, useState } from 'react'
import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import LoginForm from '../site/LoginForm'
import { useAuth } from '../lib/auth'
import Content from '../admin/Content'
import Users from '../admin/Users'
import type { Section } from '../admin/Content'

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

const TABS: { id: Section | 'users'; label: string }[] = [
  { id: 'site', label: 'Site & contacts' },
  { id: 'softball', label: 'Softball' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'users', label: 'Users' },
]

function Panels({ meId }: { meId: number }) {
  const fromHash = () => TABS.find((t) => t.id === location.hash.slice(1).split('/')[0])?.id ?? 'site'
  const [tab, setTab] = useState<Section | 'users'>(fromHash)
  useEffect(() => {
    const on = () => setTab(fromHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">Admin</p>
      <nav aria-label="Admin sections" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            aria-current={tab === t.id ? 'page' : undefined}
            className="flex min-h-12 shrink-0 items-center rounded-full border border-slate-700 px-4 text-sm font-bold text-slate-300 aria-[current=page]:border-amber-500 aria-[current=page]:bg-amber-500 aria-[current=page]:text-slate-950"
          >
            {t.label}
          </a>
        ))}
      </nav>
      <div className="mt-6">{tab === 'users' ? <Users meId={meId} /> : <Content section={tab} />}</div>
    </div>
  )
}

mount(
  <SiteShell page="admin">
    <Admin />
  </SiteShell>,
)
