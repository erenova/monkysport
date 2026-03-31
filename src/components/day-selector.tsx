'use client'

import { useRef, useEffect } from 'react'
import { DayPlan } from '@/lib/types'
import { cn, getTodaysDayNumber } from '@/lib/utils'

interface DaySelectorProps {
  schedule: DayPlan[]
  selectedDay: number
  onSelect: (day: number) => void
  completedDays: Set<number>
}

export function DaySelector({ schedule, selectedDay, onSelect, completedDays }: DaySelectorProps) {
  const today = getTodaysDayNumber()
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedDay])

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none">
      {schedule.map((day) => {
        const isSelected = day.day === selectedDay
        const isToday = day.day === today
        const isCompleted = completedDays.has(day.day)

        return (
          <button
            key={day.day}
            ref={isSelected ? selectedRef : null}
            onClick={() => onSelect(day.day)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl min-w-[64px] shrink-0 transition-all border',
              isSelected && 'bg-amber-500/15 border-amber-500/40 text-amber-400',
              !isSelected && 'bg-zinc-900 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800',
              isCompleted && !isSelected && 'border-emerald-500/30',
            )}
          >
            <span className="text-lg leading-none">{day.emoji}</span>
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wide',
              isToday && !isSelected && 'text-amber-500',
            )}>
              {isToday ? 'Bugün' : `Gün ${day.day}`}
            </span>
            <span className="text-[9px] truncate max-w-[56px] opacity-70">
              {day.name}
            </span>
            {isCompleted && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
            )}
          </button>
        )
      })}
    </div>
  )
}
