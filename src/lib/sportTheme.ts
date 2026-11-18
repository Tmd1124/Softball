import type { SportConfig } from '../data/recruitingData'

function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`
}

export function hueOf(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

const KNOWN = ['softball', 'basketball']

export function applySportTheme(cfg: SportConfig) {
  if (KNOWN.includes(cfg.id)) return
  const h = hueOf(cfg.accent)
  const root = document.documentElement
  const set: Record<string, string> = {
    '--color-slate-950': hsl(h, 55, 4),
    '--color-slate-900': hsl(h, 50, 8),
    '--color-slate-800': hsl(h, 45, 13),
    '--color-slate-700': hsl(h, 42, 19),
    '--color-slate-600': hsl(h, 40, 28),
    '--color-amber-300': `color-mix(in srgb, ${cfg.accent} 60%, white)`,
    '--color-amber-400': `color-mix(in srgb, ${cfg.accent} 82%, white)`,
    '--color-amber-500': cfg.accent,
    '--color-amber-600': `color-mix(in srgb, ${cfg.accent} 82%, black)`,
  }
  for (const [k, v] of Object.entries(set)) root.style.setProperty(k, v)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hsl(h, 55, 4))
}

export function sheetTheme(cfg: SportConfig) {
  if (cfg.id === 'softball') return { dark: '#0d2214', mid: '#153220', accent: '#cde62b', tint: '#f1f7d9', ink: '#1d4a2d' }
  if (cfg.id === 'basketball') return { dark: '#1e130b', mid: '#2e1d11', accent: '#f97316', tint: '#fff0e3', ink: '#9a3a0a' }
  const h = hueOf(cfg.accent)
  return { dark: hsl(h, 55, 8), mid: hsl(h, 45, 13), accent: cfg.accent, tint: hsl(h, 70, 93), ink: hsl(h, 55, 24) }
}
