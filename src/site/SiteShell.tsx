import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import LoginForm from './LoginForm'
import Modal from './Modal'
import ProfileDialog from './ProfileDialog'
import ProfileMenu from './ProfileMenu'
import Assistant from './Assistant'
import { useRecruiting } from '../lib/recruiting'
import { builtInSports } from '../data/recruitingData'
import type { SportConfig, SportData } from '../data/recruitingData'
import { emojiFor } from '../data/sportCatalog'
import { hasRealPhoto } from '../recruit/derive'
import ScrollRow from '../admin/ScrollRow'
import { telHref } from '../recruit/blocks'

type Page = string

const ShellCtx = createContext<{ openLogin: () => void; openProfile: () => void }>({
  openLogin: () => undefined,
  openProfile: () => undefined,
})
export const useShell = () => useContext(ShellCtx)

function MenuLabel({ cfg, photo, current }: { cfg: SportConfig; photo?: SportData; current: boolean }) {
  if (cfg.navStyle === 'text') return <>{cfg.label}</>
  const emoji = cfg.emoji || emojiFor(cfg.id)
  if (cfg.navStyle === 'emoji') {
    return (
      <span aria-hidden className={`flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none ${current ? 'bg-slate-800 ring-2 ring-amber-400' : 'hover:bg-slate-800'}`}>
        {emoji}
      </span>
    )
  }
  const src = cfg.navImage === 'custom' && cfg.cardImage ? cfg.cardImage : photo && hasRealPhoto(photo) ? photo.photo : ''
  return (
    <span aria-hidden className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 text-xl leading-none ${current ? 'ring-2 ring-amber-400' : ''}`} style={{ borderColor: cfg.accent, background: `${cfg.accent}33` }}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" style={cfg.navImage === 'custom' ? undefined : { objectPosition: `50% ${photo?.photoFocus ?? 20}%` }} /> : emoji}
    </span>
  )
}

export function SiteHeader({ page, openLogin, openProfile }: { page: Page; openLogin: () => void; openProfile: () => void }) {
  const { user, status } = useAuth()
  const rec = useRecruiting()
  const sports = rec ? rec.sportList : builtInSports
  const nav: { page: string; href: string; label: string; cfg?: SportConfig }[] = [
    { page: 'home', href: '/', label: 'Home' },
    ...sports.map((c) => ({ page: c.id, href: `/${c.id}/`, label: c.label, cfg: c })),
    { page: 'schedule', href: '/schedule/', label: 'Schedule' },
    { page: 'teams', href: '/teams/', label: 'Teams' },
  ]
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-2 py-1.5 sm:px-6">
        <ScrollRow label="Main" className="min-w-0 flex-1">
          {nav.map((n) => (
            <a
              key={n.page}
              href={n.href}
              aria-current={page === n.page ? 'page' : undefined}
              aria-label={n.cfg && n.cfg.navStyle !== 'text' ? n.label : undefined}
              title={n.cfg && n.cfg.navStyle !== 'text' ? n.label : undefined}
              className={`flex min-h-12 shrink-0 items-center rounded-full text-[13px] font-bold text-slate-300 transition-colors hover:text-slate-50 aria-[current=page]:text-amber-400 sm:text-sm ${n.cfg && n.cfg.navStyle !== 'text' ? 'min-w-11 justify-center px-0.5' : 'px-1.5 sm:px-4'}`}
            >
              {n.cfg ? <MenuLabel cfg={n.cfg} photo={rec?.sports[n.cfg.id]} current={page === n.page} /> : n.label}
            </a>
          ))}
        </ScrollRow>
        <div className="shrink-0">
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
      </div>
    </header>
  )
}

export function SiteFooter() {
  const recruiting = useRecruiting()
  if (!recruiting) return null
  const { athlete, contact } = recruiting
  const link = 'block py-1 hover:text-amber-400 sm:py-0.5'
  const head = 'mb-1 text-xs font-bold uppercase tracking-widest text-slate-400'
  return (
    <footer className="border-t border-slate-800 bg-slate-900/60">
      <div className="mx-auto grid max-w-5xl gap-x-8 gap-y-5 px-4 py-6 text-sm leading-snug text-slate-300 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-base font-extrabold uppercase tracking-[0.14em] text-slate-50">
            Ever<span className="text-amber-400">harris</span>
          </p>
          <p className="mt-1 text-slate-400">
            Class of {athlete.classYear} · {athlete.school}, {athlete.location}
          </p>
        </div>
        <div>
          <p className={head}>Recruiting contact</p>
          <a href={`mailto:${contact.email}`} className={`${link} break-all`}>{contact.email}</a>
          <a href={telHref(contact.phone)} className={link}>{contact.phone}</a>
        </div>
        <div>
          <p className={head}>Parent / guardian</p>
          <p className="py-1 sm:py-0.5">{contact.parent.name}</p>
          <a href={`mailto:${contact.parent.email}`} className={`${link} break-all`}>{contact.parent.email}</a>
          <a href={telHref(contact.parent.phone)} className={link}>{contact.parent.phone}</a>
        </div>
        <div>
          <p className={head}>Social</p>
          <a href={contact.social.x.url} target="_blank" rel="noopener noreferrer" className={link}>X {contact.social.x.handle}</a>
          <a href={contact.social.instagram.url} target="_blank" rel="noopener noreferrer" className={link}>Instagram {contact.social.instagram.handle}</a>
        </div>
      </div>
      <p className="border-t border-slate-800 px-4 py-3 text-center text-xs text-slate-500">&copy; {new Date().getFullYear()} Everharris</p>
    </footer>
  )
}

const adminHelp = (seg: string) => (['overview', 'site', 'users', 'sports'].includes(seg) ? `admin-${seg}` : 'admin-sport')

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
        helpKey={help ?? (page === 'admin' ? (user ? adminHelp(hash.slice(1).split('/')[0] || 'overview') : 'admin-login') : ['home', 'schedule', 'teams'].includes(page) ? page : 'sport')}
        lift={lift || page === 'admin'}
        startOn={!help && page !== 'admin' ? 'ask' : 'help'}
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
