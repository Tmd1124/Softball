import { useState } from 'react'
import type { FormEvent } from 'react'
import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import { ForgotForm, inputClass } from '../site/LoginForm'
import { ApiError, api } from '../lib/api'

const token = new URLSearchParams(window.location.search).get('token') ?? ''
if (token) window.history.replaceState(null, '', window.location.pathname)

function ResetForm() {
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next !== again) return setError('The passwords do not match')
    setBusy(true)
    setError('')
    try {
      await api('auth.php', { action: 'reset', token, password: next })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done)
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          Your password was changed. Every device was signed out.
        </p>
        <a href="/" className="flex min-h-12 items-center justify-center rounded-xl bg-amber-500 font-bold text-slate-950 active:bg-amber-400">
          Go to log in
        </a>
      </div>
    )

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-300">New password (8+ characters)</span>
        <input className={inputClass} type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} autoFocus required />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-300">Repeat new password</span>
        <input className={inputClass} type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" minLength={8} required />
      </label>
      {error && (
        <p role="alert" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
          {error}{' '}
          {error.includes('expired') && (
            <a href="/reset/" className="font-semibold underline">
              Request a new link
            </a>
          )}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-amber-500 text-base font-bold text-slate-950 active:bg-amber-400 disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  )
}

mount(
  <SiteShell page="home" footer={false}>
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-50">{token ? 'Choose a new password' : 'Forgot your password?'}</h1>
      <div className="mt-6">{token ? <ResetForm /> : <ForgotForm />}</div>
    </div>
  </SiteShell>,
)
