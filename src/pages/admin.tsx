import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import LoginForm from '../site/LoginForm'
import { ApiError, api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Role } from '../lib/auth'
import { utcToDate } from '../lib/summary'

interface Row {
  id: number
  email: string
  role: Role
  active: boolean
  createdAt: string
  lastLoginAt: string | null
}

const when = (utc: string | null) =>
  utc ? utcToDate(utc).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never'

const field =
  'h-12 rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50 placeholder:text-slate-500'

function Users({ meId }: { meId: number }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ email: '', password: '', role: 'sports' as Role })
  const [resets, setResets] = useState<Record<number, string>>({})

  useEffect(() => {
    api<{ users: Row[] }>('users.php')
      .then((r) => setRows(r.users))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load users'))
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

  const create = async (e: FormEvent) => {
    e.preventDefault()
    if (await run({ action: 'create', ...form }, `Created ${form.email}`)) setForm({ email: '', password: '', role: 'sports' })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">Admin</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-50">Users</h1>
      <p className="mt-2 text-sm text-slate-400">
        <strong className="text-slate-200">admin</strong> accounts can do everything, including managing users.{' '}
        <strong className="text-slate-200">sports</strong> accounts can do everything except manage users. Accounts are deactivated, not deleted.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {notice}
        </p>
      )}

      <form onSubmit={create} className="mt-6 grid gap-3 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:grid-cols-2">
        <h2 className="text-lg font-bold text-slate-50 sm:col-span-2">Add a user</h2>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Email</span>
          <input
            className={`${field} mt-1 w-full`}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoCapitalize="none"
            autoComplete="off"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Role</span>
          <select
            className={`${field} mt-1 w-full`}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            <option value="sports">sports</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-300">Password (8+ characters)</span>
          <input
            className={`${field} mt-1 w-full`}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <button type="submit" className="min-h-12 rounded-xl bg-amber-500 font-bold text-slate-950 active:bg-amber-400 sm:col-span-2">
          Create user
        </button>
      </form>

      <ul className="mt-6 space-y-3">
        {rows === null && !error && <li className="text-sm text-slate-400">Loading…</li>}
        {rows?.map((u) => {
          const self = u.id === meId
          return (
            <li key={u.id} className={`rounded-3xl border bg-slate-900 p-5 ${u.active ? 'border-slate-800' : 'border-slate-800 opacity-70'}`}>
              <div className="flex flex-wrap items-center gap-3">
                <p className="mr-auto text-lg font-bold text-slate-50">
                  {u.email}
                  {self && <span className="ml-2 text-xs font-semibold text-slate-400">(you)</span>}
                  {!u.active && <span className="ml-2 text-xs font-semibold text-amber-400">deactivated</span>}
                </p>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="sr-only">Role for {u.email}</span>
                  <select
                    className={`${field} w-28`}
                    value={u.role}
                    disabled={self}
                    onChange={(e) => void run({ action: 'update', id: u.id, role: e.target.value }, `Updated ${u.email}`)}
                  >
                    <option value="sports">sports</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <button
                  type="button"
                  disabled={self}
                  onClick={() => void run({ action: 'update', id: u.id, active: !u.active }, `${u.active ? 'Deactivated' : 'Reactivated'} ${u.email}`)}
                  className="min-h-12 rounded-xl border border-slate-600 px-4 text-sm font-semibold text-slate-100 active:bg-slate-800 disabled:opacity-40"
                >
                  {u.active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Created {when(u.createdAt)} · Last sign-in {when(u.lastLoginAt)}
              </p>
              <form
                className="mt-3 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (await run({ action: 'update', id: u.id, password: resets[u.id] }, `Password reset for ${u.email}`))
                    setResets({ ...resets, [u.id]: '' })
                }}
              >
                <input
                  className={`${field} min-w-0 flex-1`}
                  type="password"
                  placeholder="New password (8+)"
                  aria-label={`New password for ${u.email}`}
                  autoComplete="new-password"
                  minLength={8}
                  value={resets[u.id] ?? ''}
                  onChange={(e) => setResets({ ...resets, [u.id]: e.target.value })}
                  required
                />
                <button type="submit" className="min-h-12 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-slate-100 active:bg-slate-700">
                  Reset
                </button>
              </form>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Admin() {
  const { status, user } = useAuth()
  if (status === 'loading') return <p className="p-6 text-sm text-slate-400">Loading…</p>
  if (!user)
    return (
      <div className="mx-auto max-w-sm px-4 py-10">
        <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-50">Admin sign in</h1>
        <LoginForm autoFocus />
      </div>
    )
  if (user.role !== 'admin')
    return (
      <div className="mx-auto max-w-sm px-4 py-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-50">Admins only</h1>
        <p className="mt-2 text-sm text-slate-300">Your account does not have access to user management.</p>
      </div>
    )
  return <Users meId={user.id} />
}

mount(
  <SiteShell page="admin">
    <Admin />
  </SiteShell>,
)
