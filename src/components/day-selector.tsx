'use client'

import { DayPlan } from '@/lib/types'
import { cn, getTodaysDayNumber } from '@/lib/utils'
import { Check } from 'lucide-react'

interface DaySelectorProps {
  schedule: DayPlan[]
  selectedDay: number
  onSelect: (day: number) => void
  completedDays: Set<number>
}

const WEEKDAY_TR = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ']

const CATEGORY_ACCENT: Record<DayPlan['category'], string> = {
  push: 'bg-amber-400',
  pull: 'bg-sky-400',
  legs: 'bg-emerald-400',
  rest: 'bg-zinc-500',
  custom: 'bg-violet-400',
}

export function DaySelector({ schedule, selectedDay, onSelect, completedDays }: DaySelectorProps) {
  const today = getTodaysDayNumber()

  return (
    <div className="px-3">
      <div className="grid grid-cols-7 gap-1.5">
        {schedule.map((day) => {
          const isSelected = day.day === selectedDay
          const isToday = day.day === today
          const isCompleted = completedDays.has(day.day)
          const accent = CATEGORY_ACCENT[day.category]

          return (
            <button
              key={day.day}
              onClick={() => onSelect(day.day)}
              className={cn(
                'relative aspect-[3/4] rounded-2xl flex flex-col items-center justify-between py-2 transition-all duration-200 outline-none',
                isSelected
                  ? 'bg-zinc-50 text-zinc-950 shadow-lg shadow-amber-500/10 scale-[1.04]'
                  : 'bg-zinc-900/80 text-zinc-300 border border-zinc-800/60 hover:border-zinc-700 active:scale-[0.97]',
                isToday && !isSelected && 'border-amber-500/50',
              )}
              aria-label={`${day.name} — Gün ${day.day}`}
              aria-pressed={isSelected}
            >
              <span className={cn(
                'text-[9px] font-bold tracking-[0.08em] tabular-nums',
                isSelected ? 'text-zinc-500' : isToday ? 'text-amber-400' : 'text-zinc-500',
              )}>
                {WEEKDAY_TR[day.day - 1]}
              </span>

              <span className={cn(
                'text-xl leading-none transition-transform',
                isSelected && 'scale-110',
              )}>
                {day.emoji}
              </span>

              <span className={cn(
                'h-1 w-5 rounded-full transition-all',
                isCompleted
                  ? 'bg-emerald-400'
                  : isSelected
                    ? accent
                    : 'bg-zinc-700/60',
              )} />

              {isCompleted && (
                <span className={cn(
                  'absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2',
                  isSelected ? 'bg-emerald-500 ring-zinc-50' : 'bg-emerald-500 ring-zinc-950',
                )}>
                  <Check size={8} strokeWidth={3.5} className="text-zinc-950" />
                </span>
              )}
            </button>
          )
        })}
      </div>

    </div>
  )
}
