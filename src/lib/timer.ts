export type TimerKind = 'work' | 'rest'

export interface TimerState {
  kind: TimerKind
  exerciseId: string
  setIndex: number
  totalSeconds: number
  startedAt: number
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    return new Ctx()
  } catch {
    return null
  }
}

function playBingBing(ctx: AudioContext): void {
  const tones = [880, 1320]
  tones.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18)
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + i * 0.18 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime + i * 0.18)
    osc.stop(ctx.currentTime + i * 0.18 + 0.3)
  })
}

export function beep(): void {
  const ctx = getAudioContext()
  if (ctx) {
    try { playBingBing(ctx) } catch { /* ignore */ }
  }
  try { navigator.vibrate?.([120, 60, 200]) } catch { /* ignore */ }
}

export class Alarm {
  private intervalId: number | null = null
  private ctx: AudioContext | null = null
  private vibrateInterval: number | null = null

  start(): void {
    if (this.intervalId !== null) return
    this.ctx = getAudioContext()
    this.fire()
    this.intervalId = window.setInterval(() => this.fire(), 900)
    this.vibrateInterval = window.setInterval(() => {
      try { navigator.vibrate?.([200, 100, 200]) } catch { /* ignore */ }
    }, 1200)
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.vibrateInterval !== null) {
      clearInterval(this.vibrateInterval)
      this.vibrateInterval = null
    }
    try { navigator.vibrate?.(0) } catch { /* ignore */ }
    if (this.ctx) {
      try { this.ctx.close() } catch { /* ignore */ }
      this.ctx = null
    }
  }

  isActive(): boolean {
    return this.intervalId !== null
  }

  private fire(): void {
    if (!this.ctx) return
    try { playBingBing(this.ctx) } catch { /* ignore */ }
  }
}
