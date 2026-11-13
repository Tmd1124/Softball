import { useCallback, useRef, useState } from 'react'
import BottomNav from './components/BottomNav'
import type { Tab } from './components/BottomNav'
import DaySchedule from './components/DaySchedule'
import MobilityChecklist from './components/MobilityChecklist'
import RestTimerBar from './components/RestTimerBar'
import type { RestRequest } from './components/RestTimerBar'
import VideoPlayerModal from './components/VideoPlayerModal'
import { days, getExercise } from './data/workouts'
import type { Program, WorkoutItem } from './data/workouts'
import HistoryView from './components/HistoryView'
import RebuildVideos from './components/RebuildVideos'
import { MOBILITY_DAY, useAthleteData } from './lib/data'
import { useSyncStatus } from './lib/sync'
import { useAuth } from './lib/auth'
import { usePersisted } from './lib/storage'

interface Selection {
  program: Program
  dayId: string
}

interface Open {
  id: string
  item?: WorkoutItem
}

export default function App() {
  const [tab, setTab] = useState<Tab>('schedule')
  const [open, setOpen] = useState<Open | null>(null)
  const [rest, setRest] = useState<RestRequest | null>(null)
  const restId = useRef(0)
  const [sel, setSel] = usePersisted<Selection>('catcher.selection.v1', { program: 'off', dayId: 'off-1' })
  const { entries, getEntry, getSets, save, resetDay } = useAthleteData()
  const sync = useSyncStatus()
  const isAdmin = useAuth().user?.role === 'admin'

  const day = days.find((d) => d.id === sel.dayId && d.program === sel.program) ?? days[0]
  const program = day.program

  const startRest = useCallback((label: string, seconds: number) => {
    restId.current += 1
    setRest({ id: restId.current, label, seconds })
  }, [])
  const dismissRest = useCallback(() => setRest(null), [])
  const closeModal = useCallback(() => setOpen(null), [])

  const changeProgram = (p: Program) => {
    const first = days.find((d) => d.program === p)!
    setSel({ program: p, dayId: first.id })
  }

  const toggleItem = (item: WorkoutItem) => {
    const done = getSets(day.id, item.id) >= item.sets
    save(day.id, item.id, item.sets, { sets: done ? 0 : item.sets })
  }

  const openItem = open?.item
  const openId = open?.id

  return (
    <div className="mx-auto min-h-[calc(100dvh-3.8rem)] max-w-md bg-slate-950 md:max-w-5xl text-slate-100">
      {sync !== 'synced' && (
        <p
          role="status"
          className={`sticky top-[3.8rem] z-20 md:top-[7.3rem] px-4 py-2 text-center text-xs font-semibold ${
            sync === 'pending' ? 'bg-slate-800 text-slate-300' : 'bg-amber-500 text-slate-950'
          }`}
        >
          {sync === 'offline' && 'Not saved to the server yet. Kept on this device and retrying.'}
          {sync === 'pending' && 'Saving…'}
          {sync === 'auth' && (
            <>
              Your session expired. Changes are kept on this device.{' '}
              <button type="button" onClick={() => window.location.reload()} className="font-extrabold underline">
                Sign in again
              </button>
            </>
          )}
        </p>
      )}
      <main className="md:pt-16">
        {tab === 'schedule' ? (
          <DaySchedule
            program={program}
            day={day}
            getSets={getSets}
            onProgram={changeProgram}
            onDay={(dayId) => setSel({ program, dayId })}
            onToggle={toggleItem}
            onOpen={(item) => setOpen({ id: item.id, item })}
            onReset={() => {
              if (window.confirm(`Reset all progress for "${day.pill}"?`)) resetDay(day.id)
            }}
          />
        ) : tab === 'rebuild' && isAdmin ? (
          <RebuildVideos />
        ) : tab === 'history' ? (
          <HistoryView entries={entries} />
        ) : (
          <MobilityChecklist
            onOpen={(id) => setOpen({ id })}
            isDone={(id) => getSets(MOBILITY_DAY, id) > 0}
            onDone={(id, on) => save(MOBILITY_DAY, id, 1, { sets: on ? 1 : 0 })}
          />
        )}
      </main>

      {openId && (
        <VideoPlayerModal
          key={openId}
          exercise={getExercise(openId)}
          item={openItem}
          completedSets={openItem ? getSets(day.id, openItem.id) : 0}
          weight={openItem ? (getEntry(day.id, openItem.id)?.weight ?? null) : null}
          onSetsChange={(n) => openItem && save(day.id, openItem.id, openItem.sets, { sets: n })}
          onWeightChange={(w) => openItem && save(day.id, openItem.id, openItem.sets, { weight: w })}
          onRest={startRest}
          onClose={closeModal}
        />
      )}

      <RestTimerBar request={rest} onDismiss={dismissRest} />
      <BottomNav tab={tab} onChange={setTab} showRebuild={isAdmin} />
    </div>
  )
}
