let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export function unlockAudio(): void {
  getCtx()
}

export function beep(freq = 880, ms = 120, gain = 0.15, delayMs = 0): void {
  const c = getCtx()
  if (!c) return
  const start = c.currentTime + delayMs / 1000
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(gain, start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, start + ms / 1000)
  osc.connect(g).connect(c.destination)
  osc.start(start)
  osc.stop(start + ms / 1000 + 0.02)
}

export function tick(): void {
  beep(660, 70, 0.1)
}

export function chime(): void {
  beep(784, 140, 0.18)
  beep(1175, 260, 0.18, 150)
}

export function buzz(pattern: number | number[] = 200): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Vibration unsupported.
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
