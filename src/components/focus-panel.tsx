'use client'

import { Exercise, ExerciseLog } from '@/lib/types'
import { Target, ArrowRight, Play, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FocusInfo {
  current?: {
    exercise: Exercise
    setIndex: number
  }
  next?: Exercise
  done: boolean
}

export function computeFocus(exercises: Exercise[], logs: ExerciseLog[]): FocusInfo {
  for (const exercise of exercises) {
    const log = logs.find(l => l.exerciseId === exercise.id)
    const completed = log?.completedSets ?? Array(exercise.sets).fill(false)
    const nextSet = completed.findIndex(c => !c)
    if (nextSet >= 0) {
      const remainingAfter = exercises.slice(exercises.indexOf(exercise) + 1)
      const next = remainingAfter[0]
      return { current: { exercise, setIndex: nextSet }, next, done: false }
    }
  }
  return { done: true }
}

interface FocusPanelProps {
  focus: FocusInfo
  onStart: () => void
  onJumpToCard: (exerciseId: string) => void
  onOpenVideo: (exercise: Exercise) => void
  timerActive: boolean
}

export function FocusPanel({ focus, onStart, onJumpToCard, onOpenVideo, timerActive }: FocusPanelProps) {
  if (focus.done || !focus.current) return null
  const { exercise, setIndex } = focus.current

  return (
    <div className="px-4 mb-3">
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <Target size={11} />
            Şimdi
          </div>
          <div className="text-[10px] text-zinc-500 tabular-nums">
            Set {setIndex + 1}/{exercise.sets}
          </div>
        </div>

        <button
          onClick={() => onJumpToCard(exercise.id)}
          className="block w-full text-left"
        >
          <div className="text-base font-bold leading-tight">{exercise.name}</div>
          <div className="text-xs text-zinc-400 mt-0.5">
            {exercise.durationSeconds
              ? `${exercise.durationSeconds} sn çalış`
              : exercise.reps + ' tekrar'}
            {exercise.restSeconds > 0 && ` · ${exercise.restSeconds} sn dinlen`}
          </div>
        </button>

        <div className="flex items-stretch gap-2 mt-3">
          <button
            onClick={() => onOpenVideo(exercise)}
            className="flex items-center justify-center gap-1.5 px-4 h-12 rounded-xl bg-sky-500/15 text-sky-300 text-sm font-semibold border border-sky-500/30 hover:bg-sky-500/25 active:scale-[0.98] transition-all"
            aria-label="Video + Timer"
          >
            <Video size={16} />
            Video
          </button>
          <button
            onClick={onStart}
            disabled={timerActive}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl text-sm font-bold transition-all shadow-lg',
              timerActive
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none'
                : 'bg-amber-500 text-black hover:bg-amber-400 active:scale-[0.98] shadow-amber-500/20',
            )}
          >
            <Play size={16} />
            {exercise.durationSeconds ? 'Seti Başlat' : 'Seti İşaretle'}
          </button>
        </div>

        {focus.next && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-amber-500/10 text-[11px] text-zinc-500">
            <ArrowRight size={11} />
            <span>Sonra:</span>
            <span className="text-zinc-300 truncate">{focus.next.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
