import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import LoginForm from './LoginForm'
import Modal from './Modal'
import ProfileDialog from './ProfileDialog'
import ProfileMenu from './ProfileMenu'
import Assistant from './Assistant'
import { useRecruiting } from '../lib/recruiting'
import { telHref } from '../recruit/blocks'

type Page = 'home' | 'softball' | 'basketball' | 'schedule' | 'admin'

const ShellCtx = createContext<{ openLogin: () => void; openProfile: () => void }>({
  openLogin: () => undefined,
  openProfile: () => undefined,
})
export const useShell = () => useContext(ShellCtx)

const NAV: { page: Page; href: string; label: string }[] = [
  { page: 'home', href: '/', label: 'Home' },
  { page: 'softball', href: '/softball/', label: 'Softball' },
  { page: 'basketball', href: '/basketball/', label: 'Basketball' },
  { page: 'schedule', href: '/schedule/', label: 'Schedule' },
]

export function SiteHeader({ page, openLogin, openProfile }: { page: Page; openLogin: () => void; openProfile: () => void }) {
  const { user, status } = useAuth()
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center gap-0.5 px-2 py-1.5 sm:gap-1 sm:px-6">
        {NAV.map((n) => (
          <a
            key={n.page}
            href={n.href}
            aria-current={page === n.page ? 'page' : undefined}
            className="flex min-h-12 items-center rounded-full px-2 text-[13px] font-bold text-slate-300 transition-colors hover:text-slate-50 aria-[current=page]:text-amber-400 sm:px-4 sm:text-sm"
          >
            {n.label}
          </a>
        ))}
        <div className="ml-auto">
          {status !== 'ready' ? (
            <span className="block h-10 w-20" aria-hidden />
          ) : user ? (
            <ProfileMenu openLogin={openLogin} openProfile={openProfile} />
          ) : (
            <button
              type="button"
              onClick={openLogin}
              className="min-h-10 rounded-full border border-slate-600 px-3 text-[13px] font-bold text-slate-100 transition-colors hover:bg-slate-800 active:bg-slate-800 sm:px-4 sm:text-sm"
            >
              <span className="max-[400px]:hidden">Athlete </span>Login
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}

export function SiteFooter() {
  const recruiting = useRecruiting()
  if (!recruiting) return null
  const { athlete, contact } = recruiting
  const link = 'inline-flex min-h-12 items-center hover:text-amber-400'
  return (
    <footer className="border-t border-slate-800 bg-slate-900/60">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 text-sm text-slate-300 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-base font-extrabold uppercase tracking-[0.14em] text-slate-50">
            Ever<span className="text-amber-400">harris</span>
          </p>
          <p className="mt-1 text-slate-400">
            Class of {athlete.classYear} · {athlete.school}, {athlete.location}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Recruiting contact</p>
          <a href={`mailto:${contact.email}`} className={`${link} break-all`}>{contact.email}</a>
          <br />
          <a href={telHref(contact.phone)} className={link}>{contact.phone}</a>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Parent / guardian</p>
          <p className="mt-1">{contact.parent.name}</p>
          <a href={`mailto:${contact.parent.email}`} className={`${link} break-all`}>{contact.parent.email}</a>
          <br />
          <a href={telHref(contact.parent.phone)} className={link}>{contact.parent.phone}</a>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Coaches & social</p>
          <a href={contact.hsCoach.url} target="_blank" rel="noopener noreferrer" className={link}>{contact.hsCoach.label}</a>
          <br />
          <a href={contact.travelCoach.url} target="_blank" rel="noopener noreferrer" className={link}>{contact.travelCoach.label}</a>
          <br />
          <a href={contact.social.x.url} target="_blank" rel="noopener noreferrer" className={link}>X {contact.social.x.handle}</a>
          <br />
          <a href={contact.social.instagram.url} target="_blank" rel="noopener noreferrer" className={link}>Instagram {contact.social.instagram.handle}</a>
        </div>
      </div>
      <p className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">&copy; {new Date().getFullYear()} Everharris</p>
    </footer>
  )
}

const PUBLIC_PAGES: Page[] = ['home', 'softball', 'basketball', 'schedule']

export default function SiteShell({ page, children, footer = true, help, lift = false }: { page: Page; children: ReactNode; footer?: boolean; help?: string; lift?: boolean }) {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => setHash(location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
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
      <Assistant
        helpKey={help ?? (page === 'admin' ? (user ? `admin-${hash.slice(1).split('/')[0] || 'site'}` : 'admin-login') : page === 'softball' || page === 'basketball' ? 'sport' : page)}
        lift={lift}
        startOn={!help && PUBLIC_PAGES.includes(page) ? 'ask' : 'help'}
      />
      {login && (
        <Modal title="Log in" onClose={() => setLogin(false)}>
          <LoginForm autoFocus onDone={() => setLogin(false)} />
        </Modal>
      )}
      {profile && user && <ProfileDialog onClose={() => setProfile(false)} />}
    </ShellCtx.Provider>
  )
}
