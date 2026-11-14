import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { ApiError, api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { User } from '../lib/auth'
import { utcToDate } from '../lib/summary'
import Avatar from './Avatar'
import Modal from './Modal'
import { inputClass } from './LoginForm'

interface Profile extends User {
  phone: string | null
  createdAt: string
  lastLoginAt: string | null
}

const when = (utc: string | null) =>
  utc ? utcToDate(utc).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never'

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Could not reach the server. Try again.')

async function toAvatarDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file).catch(() => {
    throw new Error('Use a JPEG, PNG or WebP picture')
  })
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const side = Math.min(bmp.width, bmp.height)
  canvas.getContext('2d')!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size)
  bmp.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}

function Notice({ error, ok }: { error?: string; ok?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
        {error}
      </p>
    )
  if (ok)
    return (
      <p role="status" className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-200">
        {ok}
      </p>
    )
  return null
}

export default function ProfileDialog({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [details, setDetails] = useState<{ error?: string; ok?: string }>({})
  const [photo, setPhoto] = useState<{ error?: string; busy?: boolean }>({})
  const [pw, setPw] = useState({ current: '', next: '', again: '' })
  const [pwState, setPwState] = useState<{ error?: string; ok?: string; busy?: boolean }>({})
  const file = useRef<HTMLInputElement>(null)
  const pwSection = useRef<HTMLFormElement>(null)

  const apply = (p: Profile) => {
    setProfile(p)
    setUser({ id: p.id, email: p.email, role: p.role, displayName: p.displayName, hasAvatar: p.hasAvatar, avatarV: p.avatarV, mustChangePassword: p.mustChangePassword })
  }

  useEffect(() => {
    api<{ profile: Profile }>('profile.php')
      .then((r) => {
        setProfile(r.profile)
        setName(r.profile.displayName ?? '')
        setPhone(r.profile.phone ?? '')
      })
      .catch((e) => setLoadError(msg(e)))
  }, [])

  useEffect(() => {
    if (profile?.mustChangePassword) pwSection.current?.scrollIntoView({ block: 'center' })
  }, [profile?.mustChangePassword])

  const saveDetails = async (e: FormEvent) => {
    e.preventDefault()
    setDetails({})
    try {
      const r = await api<{ profile: Profile }>('profile.php', { action: 'update', displayName: name, phone })
      apply(r.profile)
      setDetails({ ok: 'Saved' })
    } catch (err) {
      setDetails({ error: msg(err) })
    }
  }

  const sendPhoto = async (image: string | null) => {
    setPhoto({ busy: true })
    try {
      const r = await api<{ profile: Profile }>('profile.php', { action: 'avatar', image })
      apply(r.profile)
      setPhoto({})
    } catch (err) {
      setPhoto({ error: err instanceof Error ? err.message : 'Could not save the picture' })
    }
  }

  const pickPhoto = async (f: File | undefined) => {
    if (!f) return
    try {
      await sendPhoto(await toAvatarDataUrl(f))
    } catch (err) {
      setPhoto({ error: err instanceof Error ? err.message : 'Could not read that picture' })
    }
  }

  const savePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.next !== pw.again) return setPwState({ error: 'The new passwords do not match' })
    setPwState({ busy: true })
    try {
      const r = await api<{ profile: Profile }>('profile.php', { action: 'password', current: pw.current, next: pw.next })
      apply(r.profile)
      setPw({ current: '', next: '', again: '' })
      setPwState({ ok: 'Password changed. Your other devices were signed out.' })
    } catch (err) {
      setPwState({ error: msg(err) })
    }
  }

  const self = profile ?? user

  return (
    <Modal title="Your profile" onClose={onClose}>
      {loadError && <Notice error={loadError} />}
      {!profile && !loadError && <p className="text-sm text-slate-400">Loading…</p>}
      {profile && (
        <div className="space-y-8">
          <section aria-label="Picture" className="flex items-center gap-4">
            <Avatar user={self} size={80} />
            <div className="min-w-0 flex-1 space-y-2">
              <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => { void pickPhoto(e.target.files?.[0]); e.target.value = '' }} />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={photo.busy}
                  onClick={() => file.current?.click()}
                  className="flex min-h-12 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-slate-100 active:bg-slate-700 disabled:opacity-60"
                >
                  <Camera size={18} aria-hidden /> {profile.hasAvatar ? 'Change picture' : 'Add picture'}
                </button>
                {profile.hasAvatar && (
                  <button
                    type="button"
                    disabled={photo.busy}
                    onClick={() => void sendPhoto(null)}
                    aria-label="Remove picture"
                    className="flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-300 active:bg-slate-800 disabled:opacity-60"
                  >
                    <Trash2 size={18} aria-hidden /> Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">Used instead of the default icon. It is cropped to a square.</p>
            </div>
          </section>
          <Notice error={photo.error} />

          <form onSubmit={saveDetails} className="space-y-4" aria-label="Details">
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400">Details</h3>
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Name</span>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Phone (optional)</span>
              <input className={inputClass} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="tel" />
            </label>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-slate-500">Email</dt>
              <dd className="truncate text-slate-200">{profile.email}</dd>
              <dt className="text-slate-500">Role</dt>
              <dd className="text-slate-200">{profile.role}</dd>
              <dt className="text-slate-500">Member since</dt>
              <dd className="text-slate-200">{when(profile.createdAt)}</dd>
              <dt className="text-slate-500">Last log in</dt>
              <dd className="text-slate-200">{when(profile.lastLoginAt)}</dd>
            </dl>
            <Notice error={details.error} ok={details.ok} />
            <button type="submit" className="min-h-12 w-full rounded-xl bg-amber-500 font-bold text-slate-950 active:bg-amber-400">
              Save details
            </button>
          </form>

          <form ref={pwSection} onSubmit={savePassword} className="space-y-4" aria-label="Change password">
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400">Change password</h3>
            {profile.mustChangePassword && (
              <p role="status" className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200">
                An admin set this password for you. Choose your own now.
              </p>
            )}
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Current password</span>
              <input className={inputClass} type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" required />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">New password (8+ characters)</span>
              <input className={inputClass} type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" minLength={8} required />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Repeat new password</span>
              <input className={inputClass} type="password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} autoComplete="new-password" minLength={8} required />
            </label>
            <Notice error={pwState.error} ok={pwState.ok} />
            <button
              type="submit"
              disabled={pwState.busy}
              className="min-h-12 w-full rounded-xl bg-slate-800 font-bold text-slate-50 active:bg-slate-700 disabled:opacity-60"
            >
              {pwState.busy ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </div>
      )}
    </Modal>
  )
}
