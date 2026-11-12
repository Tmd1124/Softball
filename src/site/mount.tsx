import { StrictMode } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { AuthProvider } from '../lib/auth'

export function mount(node: ReactNode) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>{node}</AuthProvider>
    </StrictMode>,
  )
}
