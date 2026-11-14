import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import LoginForm from './LoginForm'
import Modal from './Modal'
import ProfileDialog from './ProfileDialog'
import ProfileMenu from './ProfileMenu'

type Page = 'home' | 'softball' | 'basketball' | 'admin'

const ShellCtx = createContext<{ openLogin: () => void; openProfile: () => void }>({
  openLogin: () => undefined,
  openProfile: () => undefined,
})
export const useShell = () => useContext(ShellCtx)

export function SiteHeader({ page, openLogin, openProfile }: { page: Page; openLogin: () => void; openProfile: () => void }) {
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
        <ProfileMenu openLogin={openLogin} openProfile={openProfile} />
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
  const [profile, setProfile] = useState(false)
  const { user } = useAuth()
  const mustChange = user?.mustChangePassword === true

  useEffect(() => {
    if (user) setLogin(false)
  }, [user])

  useEffect(() => {
    if (mustChange) setProfile(true)
  }, [mustChange])

  return (
    <ShellCtx.Provider value={{ openLogin: () => setLogin(true), openProfile: () => setProfile(true) }}>
      <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
        <SiteHeader page={page} openLogin={() => setLogin(true)} openProfile={() => setProfile(true)} />
        <div className="flex-1">{children}</div>
        {footer && <SiteFooter />}
      </div>
      {login && (
        <Modal title="Log in" onClose={() => setLogin(false)}>
          <LoginForm autoFocus onDone={() => setLogin(false)} />
        </Modal>
      )}
      {profile && user && <ProfileDialog onClose={() => setProfile(false)} />}
    </ShellCtx.Provider>
  )
}
