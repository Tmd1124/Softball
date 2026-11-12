import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from './api'

export type Role = 'admin' | 'sports'

export interface User {
  id: number
  email: string
  role: Role
}

interface Auth {
  status: 'loading' | 'ready'
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: 'loading' | 'ready'; user: User | null }>({
    status: 'loading',
    user: null,
  })

  useEffect(() => {
    let live = true
    api<{ user: User | null }>('auth.php')
      .then((r) => live && setState({ status: 'ready', user: r.user }))
      .catch(() => live && setState({ status: 'ready', user: null }))
    return () => {
      live = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ user: User }>('auth.php', { action: 'login', email, password })
    setState({ status: 'ready', user: r.user })
  }, [])

  const logout = useCallback(async () => {
    await api('auth.php', { action: 'logout' })
    setState({ status: 'ready', user: null })
  }, [])

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): Auth {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}
