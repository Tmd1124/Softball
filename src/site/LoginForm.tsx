import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function LoginForm({ onDone, autoFocus = false }: { onDone?: () => void; autoFocus?: boolean }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email.trim(), password)
      onDone?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Try again.')
    } finally {
      setBusy(false)
    }
  }

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
          className="mt-1 block h-12 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50"
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
          className="mt-1 block h-12 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50"
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
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
