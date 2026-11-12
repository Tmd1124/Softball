import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { LogIn, LogOut, Users, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import LoginForm from './LoginForm'

type Page = 'home' | 'softball' | 'basketball' | 'admin'

const ShellCtx = createContext<{ openLogin: () => void }>({ openLogin: () => undefined })
export const useShell = () => useContext(ShellCtx)

function LoginDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="sheet-backdrop absolute inset-0 bg-black/70" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
        className="sheet-up relative w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-50">Sign in</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-12 w-12 items-center justify-center rounded-full text-slate-300 active:bg-slate-800"
          >
            <X size={22} aria-hidden />
          </button>
        </div>
        <LoginForm autoFocus onDone={onClose} />
      </div>
    </div>
  )
}

export function SiteHeader({ page, openLogin }: { page: Page; openLogin: () => void }) {
  const { user, status, logout } = useAuth()

  const sport = (id: 'softball' | 'basketball', label: string) => (
    <a
      href={`/${id}/`}
      title={label}
      aria-label={`${label} home`}
      aria-current={page === id ? 'page' : undefined}
      className="flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-transparent transition aria-[current=page]:ring-amber-500 hover:bg-slate-800 active:bg-slate-800"
    >
      <img src={`/img/${id}.svg`} alt="" width={34} height={34} />
    </a>
  )

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-3 py-1.5 sm:px-6">
        <a
          href="/"
          aria-current={page === 'home' ? 'page' : undefined}
          className="mr-auto flex min-h-12 items-center px-2 text-lg font-extrabold uppercase tracking-[0.14em] text-slate-50"
        >
          Ever<span className="text-amber-400">harris</span>
        </a>
        {sport('softball', 'Softball')}
        {sport('basketball', 'Basketball')}
        <span className="mx-1 h-6 w-px bg-slate-700" aria-hidden />
        {status === 'ready' && user && (
          <>
            {user.role === 'admin' && (
              <a
                href="/admin/"
                aria-label="Manage users"
                title="Manage users"
                className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                <Users size={20} aria-hidden />
                <span className="hidden sm:inline">Users</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              aria-label={`Sign out ${user.email}`}
              title={`Signed in as ${user.email}`}
              className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              <LogOut size={20} aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </>
        )}
        {status === 'ready' && !user && (
          <button
            type="button"
            onClick={openLogin}
            aria-label="Sign in"
            className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-amber-500 px-3 text-sm font-bold text-slate-950 active:bg-amber-400"
          >
            <LogIn size={20} aria-hidden />
            <span className="hidden sm:inline">Sign in</span>
          </button>
        )}
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-base font-extrabold uppercase tracking-[0.14em] text-slate-50">
            Ever<span className="text-amber-400">harris</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">Train. Track. Repeat.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-slate-300">
          <a href="/" className="flex min-h-12 items-center hover:text-amber-400">Home</a>
          <a href="/softball/" className="flex min-h-12 items-center hover:text-amber-400">Softball</a>
          <a href="/basketball/" className="flex min-h-12 items-center hover:text-amber-400">Basketball</a>
        </nav>
        <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Everharris</p>
      </div>
    </footer>
  )
}

export default function SiteShell({ page, children, footer = true }: { page: Page; children: ReactNode; footer?: boolean }) {
  const [login, setLogin] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) setLogin(false)
  }, [user])

  return (
    <ShellCtx.Provider value={{ openLogin: () => setLogin(true) }}>
      <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
        <SiteHeader page={page} openLogin={() => setLogin(true)} />
        <div className="flex-1">{children}</div>
        {footer && <SiteFooter />}
      </div>
      {login && <LoginDialog onClose={() => setLogin(false)} />}
    </ShellCtx.Provider>
  )
}
