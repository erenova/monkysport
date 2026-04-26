'use client'

import { useEffect, useRef, useState } from 'react'
import { Timer, SkipForward, Plus, X, Dumbbell } from 'lucide-react'
import { TimerState, formatClock, beep } from '@/lib/timer'
import { cn } from '@/lib/utils'

interface TimerBarProps {
  timer: TimerState
  exerciseName: string
  onAddSeconds: (seconds: number) => void
  onComplete: () => void
  onCancel: () => void
}

export function TimerBar({ timer, exerciseName, onAddSeconds, onComplete, onCancel }: TimerBarProps) {
  const [now, setNow] = useState<number>(() => Date.now())
  const firedRef = useRef(false)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [])

  const elapsed = (now - timer.startedAt) / 1000
  const remaining = timer.totalSeconds - elapsed
  const progress = Math.min(100, Math.max(0, (elapsed / timer.totalSeconds) * 100))
  const isWork = timer.kind === 'work'

  useEffect(() => {
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true
      beep()
      onComplete()
    }
  }, [remaining, onComplete])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className={cn(
          'rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden',
          isWork
            ? 'bg-amber-950/85 border-amber-500/40 shadow-amber-500/20'
            : 'bg-emerald-950/85 border-emerald-500/40 shadow-emerald-500/20',
        )}>
          <div className="h-1 bg-black/30">
            <div
              className={cn(
                'h-full transition-[width] duration-200 ease-linear',
                isWork ? 'bg-amber-400' : 'bg-emerald-400',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
                  isWork ? 'bg-amber-500/25 text-amber-300' : 'bg-emerald-500/25 text-emerald-300',
                )}>
                  {isWork ? <Dumbbell size={16} /> : <Timer size={16} />}
                </div>
                <div className="min-w-0">
                  <div className={cn(
                    'text-[10px] uppercase tracking-wide font-bold',
                    isWork ? 'text-amber-400' : 'text-emerald-400',
                  )}>
                    {isWork ? 'Çalış · Set ' + (timer.setIndex + 1) : 'Dinlen · Set ' + (timer.setIndex + 1) + ' bitti'}
                  </div>
                  <div className="text-[11px] text-zinc-300 truncate">{exerciseName}</div>
                </div>
              </div>

              <div className={cn(
                'tabular-nums font-bold text-2xl tracking-tight',
                isWork ? 'text-amber-200' : 'text-emerald-200',
              )}>
                {formatClock(remaining)}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={onCancel}
                className="flex items-center justify-center gap-1 h-9 px-3 rounded-lg bg-black/30 text-zinc-300 text-xs font-medium hover:bg-black/40 transition-colors"
                aria-label="İptal"
              >
                <X size={14} />
              </button>
              <button
                onClick={() => onAddSeconds(15)}
                className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg bg-black/30 text-zinc-200 text-xs font-medium hover:bg-black/40 transition-colors"
              >
                <Plus size={14} />
                15 sn
              </button>
              <button
                onClick={() => {
                  firedRef.current = true
                  onComplete()
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-colors',
                  isWork
                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                    : 'bg-emerald-500 text-black hover:bg-emerald-400',
                )}
              >
                <SkipForward size={14} />
                {isWork ? 'Bitir' : 'Atla'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
