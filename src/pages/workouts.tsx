import { useMemo } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { mount } from '../site/mount'
import SiteShell from '../site/SiteShell'
import LoginForm from '../site/LoginForm'
import App from '../App'
import { useAuth } from '../lib/auth'
import { initSync } from '../lib/sync'

function PwaRegistration() {
  useRegisterSW({ immediate: true })
  return null
}

function Gate() {
  const { status, user } = useAuth()

  const sportsId = user ? user.id : 0
  useMemo(() => {
    if (sportsId) initSync(sportsId)
  }, [sportsId])

  if (status === 'loading') return <p className="p-6 text-sm text-slate-400">Loading…</p>

  if (!user)
    return (
      <div className="mx-auto max-w-sm px-4 py-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-50">Log in to log workouts</h1>
        <p className="mb-6 mt-2 text-sm text-slate-400">Your sets, weights and completion times are saved to your account.</p>
        <LoginForm autoFocus />
      </div>
    )

  return <App key={user.id} />
}

mount(
  <SiteShell page="softball" footer={false}>
    <PwaRegistration />
    <Gate />
  </SiteShell>,
)
