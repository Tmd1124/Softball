import { UserRound } from 'lucide-react'
import type { User } from '../lib/auth'

export default function Avatar({ user, size = 40 }: { user: User | null; size?: number }) {
  const box = { width: size, height: size }
  if (user?.hasAvatar)
    return (
      <img
        src={`/api/avatar.php?v=${user.avatarV}`}
        alt=""
        style={box}
        className="rounded-full object-cover ring-2 ring-amber-500/70"
      />
    )
  return (
    <span style={box} className="flex items-center justify-center rounded-full bg-slate-800 text-slate-200 ring-2 ring-slate-700">
      <UserRound size={Math.round(size * 0.55)} aria-hidden />
    </span>
  )
}
