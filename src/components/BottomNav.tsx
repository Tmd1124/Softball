import { CalendarDays, Activity, History, Film } from 'lucide-react'

export type Tab = 'schedule' | 'mobility' | 'history' | 'rebuild'

interface Props {
  tab: Tab
  onChange: (t: Tab) => void
  showRebuild?: boolean
}

const tabs = [
  { id: 'schedule' as const, label: 'Schedule', Icon: CalendarDays },
  { id: 'mobility' as const, label: 'Mobility', Icon: Activity },
  { id: 'history' as const, label: 'History', Icon: History },
  { id: 'rebuild' as const, label: 'Rebuild Videos', Icon: Film },
]

export default function BottomNav({ tab, onChange, showRebuild = false }: Props) {
  const visible = tabs.filter((t) => t.id !== 'rebuild' || showRebuild)
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:bottom-auto md:top-[3.8rem] md:max-w-none md:border-b md:border-t-0 md:pb-0"
    >
      <ul className={`${visible.length === 4 ? 'grid-cols-4' : 'grid-cols-3'} grid md:mx-auto md:flex md:max-w-5xl md:gap-2 md:px-6`}>
        {visible.map(({ id, label, Icon }) => {
          const on = tab === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={on ? 'page' : undefined}
                className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold tracking-wide transition-colors md:w-auto md:flex-row md:gap-2 md:px-5 md:text-sm ${
                  on ? 'text-amber-400' : 'text-slate-400 active:text-slate-200'
                }`}
              >
                <Icon size={22} aria-hidden strokeWidth={on ? 2.4 : 1.8} />
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
