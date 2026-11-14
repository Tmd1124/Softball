import { useEffect, useRef, useState } from 'react'
import { LogIn, LogOut, UserCog, Users } from 'lucide-react'
import { useAuth } from '../lib/auth'
import Avatar from './Avatar'

const item =
  'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-slate-100 hover:bg-slate-800 active:bg-slate-800'

export default function ProfileMenu({ openLogin, openProfile }: { openLogin: () => void; openProfile: () => void }) {
  const { user, status, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (status !== 'ready') return <span className="h-12 w-12" aria-hidden />

  const pick = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user ? `Profile menu for ${user.displayName ?? user.email}` : 'Profile menu'}
        className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-slate-800 active:bg-slate-800"
      >
        <Avatar user={user} size={36} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Profile"
          className="sheet-up absolute right-0 top-[calc(100%+0.25rem)] z-40 w-64 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-xl"
        >
          {user ? (
            <>
              <div className="px-3 pb-2 pt-1">
                <p className="truncate text-sm font-bold text-slate-50">{user.displayName ?? user.email}</p>
                {user.displayName && <p className="truncate text-xs text-slate-400">{user.email}</p>}
              </div>
              <div className="my-1 h-px bg-slate-800" />
              <button type="button" role="menuitem" onClick={pick(openProfile)} className={item}>
                <UserCog size={18} aria-hidden /> Profile
              </button>
              {user.role === 'admin' && (
                <a role="menuitem" href="/admin/" className={item}>
                  <Users size={18} aria-hidden /> Manage users
                </a>
              )}
              <button type="button" role="menuitem" onClick={pick(() => void logout())} className={item}>
                <LogOut size={18} aria-hidden /> Log out
              </button>
            </>
          ) : (
            <button type="button" role="menuitem" onClick={pick(openLogin)} className={item}>
              <LogIn size={18} aria-hidden /> Log in
            </button>
          )}
        </div>
      )}
    </div>
  )
}
