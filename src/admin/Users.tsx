import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, api } from '../lib/api'
import type { Role } from '../lib/auth'
import { formatPhone } from '../lib/format'
import { utcToDate } from '../lib/summary'

interface Row {
  id: number
  email: string
  role: Role
  active: boolean
  createdAt: string
  lastLoginAt: string | null
  displayName: string | null
  phone: string | null
}

const when = (utc: string | null) =>
  utc ? utcToDate(utc).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never'

const field = 'mt-1 h-12 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50 placeholder:text-slate-500'
const card = 'rounded-3xl border border-slate-800 bg-slate-900 p-5'

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${role === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-200'}`}>
      {role === 'admin' ? 'Admin' : 'Sports'}
    </span>
  )
}

function subRoute() {
  const [, rest = ''] = location.hash.slice(1).split('/')
  return rest
}

export default function Users({ meId }: { meId: number }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [route, setRoute] = useState(subRoute)

  useEffect(() => {
    api<{ users: Row[] }>('users.php')
      .then((r) => setRows(r.users))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load users'))
    const on = () => {
      setRoute(subRoute())
      setError('')
      setNotice('')
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const run = async (body: unknown, done: string) => {
    setError('')
    setNotice('')
    try {
      const r = await api<{ users: Row[] }>('users.php', body)
      setRows(r.users)
      setNotice(done)
      return true
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server')
      return false
    }
  }

  const banner = (
    <>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
    </>
  )

  if (rows === null) return error ? banner : <p className="text-sm text-slate-400">Loading…</p>

  if (route === 'new') return <AddUser run={run} banner={banner} />
  const selected = route ? rows.find((u) => String(u.id) === route) : undefined
  if (route && !selected) {
    return (
      <div>
        <BackLink />
        <p className="mt-4 text-slate-300">That user no longer exists.</p>
      </div>
    )
  }
  if (selected) return <UserDetail key={selected.id} user={selected} self={selected.id === meId} run={run} banner={banner} />

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-50">Users</h1>
        <a href="#users/new" className="inline-flex min-h-12 items-center rounded-full bg-amber-500 px-5 text-sm font-bold text-slate-950 active:bg-amber-400">
          Add user
        </a>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        {rows.length} {rows.length === 1 ? 'user' : 'users'}. Select a user to change their details or remove them.
      </p>
      {banner}
      <ul className="mt-5 space-y-2">
        {rows.map((u) => (
          <li key={u.id}>
            <a
              href={`#users/${u.id}`}
              className={`flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-amber-500/60 ${u.active ? '' : 'opacity-70'}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-slate-50">{u.displayName ?? u.email}</span>
                {u.displayName && <span className="block truncate text-sm text-slate-400">{u.email}</span>}
                <span className="mt-1 block text-xs text-slate-400">
                  {u.id === meId ? 'You · ' : ''}Last sign-in {when(u.lastLoginAt)}
                </span>
              </span>
              {!u.active && <span className="text-xs font-semibold text-amber-400">Deactivated</span>}
              <RoleBadge role={u.role} />
              <span aria-hidden className="text-slate-500">→</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BackLink() {
  return (
    <a href="#users" className="inline-flex min-h-12 items-center text-sm font-bold text-amber-400">
      ← All users
    </a>
  )
}

type Run = (body: unknown, done: string) => Promise<boolean>

function AddUser({ run, banner }: { run: Run; banner: React.ReactNode }) {
  const [form, setForm] = useState({ email: '', password: '', role: 'sports' as Role })
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (await run({ action: 'create', ...form }, `Created ${form.email}`)) location.hash = 'users'
  }
  return (
    <div>
      <BackLink />
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-50">Add a user</h1>
      <p className="mt-2 text-sm text-slate-400">They will be asked to choose their own password the first time they sign in.</p>
      {banner}
      <form onSubmit={submit} className={`${card} mt-5 grid gap-3 sm:grid-cols-2`}>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-300">Email</span>
          <input className={field} type="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoCapitalize="none" autoComplete="off" placeholder="name@example.com" required />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Role</span>
          <select className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="sports">Sports (log workouts)</option>
            <option value="admin">Admin (edit site and manage users)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Starting password (8+ characters)</span>
          <input className={field} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" minLength={8} required />
        </label>
        <button type="submit" className="min-h-12 rounded-xl bg-amber-500 font-bold text-slate-950 active:bg-amber-400 sm:col-span-2">
          Create user
        </button>
      </form>
    </div>
  )
}

function UserDetail({ user, self, run, banner }: { user: Row; self: boolean; run: Run; banner: React.ReactNode }) {
  const [form, setForm] = useState({ email: user.email, displayName: user.displayName ?? '', phone: formatPhone(user.phone ?? ''), role: user.role })
  const [password, setPassword] = useState('')

  const saveDetails = (e: FormEvent) => {
    e.preventDefault()
    void run({ action: 'update', id: user.id, ...form }, `Saved changes to ${form.email}`)
  }

  const remove = async () => {
    if (!window.confirm(`Remove ${user.email} and all of their logged workouts? This cannot be undone.`)) return
    if (await run({ action: 'delete', id: user.id }, `Removed ${user.email}`)) location.hash = 'users'
  }

  return (
    <div>
      <BackLink />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-50">{user.displayName ?? user.email}</h1>
        <RoleBadge role={user.role} />
        {!user.active && <span className="text-sm font-semibold text-amber-400">Deactivated</span>}
        {self && <span className="text-sm font-semibold text-slate-400">(you)</span>}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Created {when(user.createdAt)} · Last sign-in {when(user.lastLoginAt)}
      </p>
      {banner}

      <form onSubmit={saveDetails} className={`${card} mt-5 grid gap-3 sm:grid-cols-2`}>
        <h2 className="text-lg font-bold text-slate-50 sm:col-span-2">Details</h2>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Name</span>
          <input className={field} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} maxLength={60} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Phone</span>
          <input className={field} type="tel" inputMode="tel" placeholder="(999) 999-9999" maxLength={14} value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Email</span>
          <input className={field} type="email" inputMode="email" autoCapitalize="none" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Role</span>
          <select className={field} value={form.role} disabled={self} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="sports">Sports (log workouts)</option>
            <option value="admin">Admin (edit site and manage users)</option>
          </select>
        </label>
        <button type="submit" className="min-h-12 rounded-xl bg-amber-500 font-bold text-slate-950 active:bg-amber-400 sm:col-span-2">
          Save changes
        </button>
      </form>

      <form
        className={`${card} mt-4`}
        onSubmit={async (e) => {
          e.preventDefault()
          if (await run({ action: 'update', id: user.id, password }, `Password reset for ${user.email}`)) setPassword('')
        }}
      >
        <h2 className="text-lg font-bold text-slate-50">Reset password</h2>
        <p className="mt-1 text-sm text-slate-400">{self ? 'Change your own password from the profile menu instead.' : 'They must choose a new password at their next sign-in, and any open sign-ins end.'}</p>
        <div className="mt-3 flex gap-2">
          <input className={`${field} mt-0 min-w-0 flex-1`} type="password" placeholder="New password (8+)" aria-label="New password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} disabled={self} required />
          <button type="submit" disabled={self} className="min-h-12 rounded-xl bg-slate-800 px-5 text-sm font-semibold text-slate-100 active:bg-slate-700 disabled:opacity-40">
            Reset
          </button>
        </div>
      </form>

      <div className={`${card} mt-4`}>
        <h2 className="text-lg font-bold text-slate-50">Access</h2>
        <p className="mt-1 text-sm text-slate-400">Deactivating blocks sign-in but keeps their history. You can reactivate any time.</p>
        <button
          type="button"
          disabled={self}
          onClick={() => void run({ action: 'update', id: user.id, active: !user.active }, `${user.active ? 'Deactivated' : 'Reactivated'} ${user.email}`)}
          className="mt-3 min-h-12 rounded-xl border border-slate-600 px-5 text-sm font-semibold text-slate-100 active:bg-slate-800 disabled:opacity-40"
        >
          {user.active ? 'Deactivate user' : 'Reactivate user'}
        </button>
      </div>

      <div className="mt-4 rounded-3xl border border-red-500/40 bg-red-500/5 p-5">
        <h2 className="text-lg font-bold text-red-200">Remove user</h2>
        <p className="mt-1 text-sm text-slate-300">Permanently deletes this account, profile and logged workouts. This cannot be undone.</p>
        {self && <p className="mt-1 text-sm text-slate-400">You cannot remove, demote or deactivate your own account.</p>}
        <button type="button" disabled={self} onClick={() => void remove()} className="mt-3 min-h-12 rounded-xl border border-red-500/60 px-5 text-sm font-semibold text-red-200 active:bg-red-500/10 disabled:opacity-40">
          Remove user
        </button>
      </div>
    </div>
  )
}
