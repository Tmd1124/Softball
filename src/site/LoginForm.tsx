import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, api } from '../lib/api'
import { useAuth } from '../lib/auth'

export const inputClass =
  'mt-1 block h-12 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50'

export function ForgotForm({ onBack, initialEmail = '' }: { onBack?: () => void; initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('auth.php', { action: 'forgot', email: email.trim() })
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (sent)
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          If that email has an account, we sent a reset link. It works once and expires in 30 minutes. Check your spam folder too.
        </p>
        <p className="text-sm text-slate-400">No email? Ask an admin to reset your password for you.</p>
        {onBack && (
          <button type="button" onClick={onBack} className="min-h-12 w-full rounded-xl border border-slate-600 font-semibold text-slate-100 active:bg-slate-800">
            Back to log in
          </button>
        )}
      </div>
    )

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-300">Enter your email and we will send you a link to choose a new password.</p>
      <label className="block">
        <span className="text-sm font-semibold text-slate-300">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          required
          className={inputClass}
        />
      </label>
      {error && (
        <p role="alert" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-amber-500 text-base font-bold text-slate-950 active:bg-amber-400 disabled:opacity-60"
      >
        {busy ? 'Sending…' : 'Send reset link'}
      </button>
      {onBack && (
        <button type="button" onClick={onBack} className="min-h-12 w-full rounded-xl text-sm font-semibold text-slate-300 active:bg-slate-800">
          Back to log in
        </button>
      )}
    </form>
  )
}

export default function LoginForm({ onDone, autoFocus = false }: { onDone?: () => void; autoFocus?: boolean }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [forgot, setForgot] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email.trim(), password, remember)
      onDone?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (forgot) return <ForgotForm initialEmail={email} onBack={() => setForgot(false)} />

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-300">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          required
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-300">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </label>
      <div className="flex items-center justify-between gap-3">
        <label className="flex min-h-12 items-center gap-3 text-sm font-semibold text-slate-200">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-5 w-5 accent-amber-500"
          />
          Remember me
        </label>
        <button
          type="button"
          onClick={() => setForgot(true)}
          className="min-h-12 text-sm font-semibold text-amber-400 underline-offset-4 hover:underline"
        >
          Forgot password?
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-amber-500 text-base font-bold text-slate-950 active:bg-amber-400 disabled:opacity-60"
      >
        {busy ? 'Logging in…' : 'Log in'}
      </button>
      <p className="text-center text-xs text-slate-500">
        {remember ? 'Stays signed in on this device for 30 days.' : 'Signed out when you close the browser or after 12 hours.'}
      </p>
    </form>
  )
}
