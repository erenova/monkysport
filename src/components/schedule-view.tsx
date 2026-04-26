'use client'

import { useEffect, useState } from 'react'
import { ScheduleConfig, Meal, DayPlan } from '@/lib/types'
import { buildDaySchedule, nowMinutes, totalMacros } from '@/lib/schedule'
import { Clock, Pencil, Plus, Flame, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MealEditor, newCustomMeal } from './meal-editor'

interface ScheduleViewProps {
  config: ScheduleConfig
  currentDay: DayPlan | undefined
  onChange: (config: ScheduleConfig) => void
}

export function ScheduleView({ config, currentDay, onChange }: ScheduleViewProps) {
  const isTrainingDay = !!currentDay && currentDay.category !== 'rest'
  const meals = buildDaySchedule(config, isTrainingDay)
  const [editing, setEditing] = useState<Meal | null>(null)
  const [now, setNow] = useState<number>(() => nowMinutes())

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 30_000)
    return () => clearInterval(id)
  }, [])

  function handleSaveMeal(updated: Meal) {
    const exists = config.meals.some(m => m.id === updated.id)
    const next = exists
      ? config.meals.map(m => (m.id === updated.id ? updated : m))
      : [...config.meals, updated]
    onChange({ ...config, meals: next })
  }

  function handleDeleteMeal(id: string) {
    onChange({ ...config, meals: config.meals.filter(m => m.id !== id) })
  }

  function setWorkoutTime(time: string) {
    onChange({ ...config, workoutTime: time })
  }

  const macros = totalMacros(meals)
  const nextIdx = meals.findIndex(m => m.resolvedMinutes >= now)

  return (
    <div className="px-4 space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-500/20 p-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">
          <Clock size={11} />
          Antrenman saati
        </div>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={config.workoutTime}
            onChange={e => setWorkoutTime(e.target.value)}
            disabled={!isTrainingDay}
            className={cn(
              'bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-2xl font-bold tabular-nums focus:outline-none focus:border-amber-500/50',
              !isTrainingDay && 'opacity-50',
            )}
          />
          <div className="text-[11px] text-zinc-400 leading-tight">
            {isTrainingDay
              ? 'Yemekler bu saate göre otomatik kayar.'
              : 'Bugün dinlenme günü — antrenman yok.'}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {meals.map((meal) => {
          const isPast = meal.resolvedMinutes < now
          const isNext = meals.indexOf(meal) === nextIdx
          const isWorkout = meal.anchor === 'workout'
          return (
            <div
              key={meal.id}
              className={cn(
                'relative rounded-2xl border transition-colors overflow-hidden',
                isWorkout
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : isNext
                    ? 'bg-zinc-900 border-emerald-500/30'
                    : 'bg-zinc-900 border-zinc-800/50',
                isPast && !isNext && 'opacity-50',
              )}
            >
              <div className="flex items-stretch">
                <div className={cn(
                  'flex flex-col items-center justify-center px-3 py-3 border-r min-w-[68px]',
                  isWorkout ? 'border-amber-500/20 bg-amber-500/5' : 'border-zinc-800/50',
                )}>
                  <span className="text-base mb-0.5">{meal.emoji}</span>
                  <span className={cn(
                    'text-sm font-bold tabular-nums leading-none',
                    isWorkout && 'text-amber-300',
                    isNext && !isWorkout && 'text-emerald-300',
                  )}>
                    {meal.resolvedTime}
                  </span>
                </div>

                <button
                  onClick={() => !isWorkout && setEditing(meal)}
                  disabled={isWorkout}
                  className="flex-1 text-left px-3 py-3 hover:bg-zinc-800/30 transition-colors disabled:hover:bg-transparent disabled:cursor-default"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className={cn(
                        'font-semibold text-sm leading-tight',
                        isWorkout && 'text-amber-300 uppercase tracking-wider',
                      )}>
                        {meal.name}
                      </div>
                      {meal.notes && (
                        <div className="text-[11px] text-zinc-500 leading-snug mt-0.5 line-clamp-2">
                          {meal.notes}
                        </div>
                      )}
                      {!isWorkout && (meal.protein || meal.carbs || meal.fat || meal.calories) && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] tabular-nums">
                          {meal.calories ? <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">{meal.calories} kcal</span> : null}
                          {meal.protein ? <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400">P {meal.protein}</span> : null}
                          {meal.carbs ? <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400">K {meal.carbs}</span> : null}
                          {meal.fat ? <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400">Y {meal.fat}</span> : null}
                        </div>
                      )}
                      {meal.recipes && meal.recipes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {meal.recipes.filter(r => r.url).map((r, i) => (
                            <a
                              key={i}
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] hover:bg-sky-500/20"
                            >
                              <ExternalLink size={9} />
                              {r.name || 'Tarif'}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isWorkout && (
                      <Pencil size={13} className="shrink-0 text-zinc-600" />
                    )}
                  </div>
                </button>
              </div>
              {isNext && !isPast && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400" />
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setEditing(newCustomMeal())}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-sm hover:border-zinc-700 hover:text-zinc-400 transition-colors"
      >
        <Plus size={14} />
        Öğün ekle
      </button>

      {(macros.calories > 0 || macros.protein > 0) && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/50 p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
            <Flame size={11} />
            Günlük toplam
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-lg font-bold tabular-nums text-amber-400">{macros.calories}</div>
              <div className="text-[9px] uppercase tracking-wide text-zinc-500">Kcal</div>
            </div>
            <div>
              <div className="text-lg font-bold tabular-nums text-rose-400">{macros.protein}g</div>
              <div className="text-[9px] uppercase tracking-wide text-zinc-500">Protein</div>
            </div>
            <div>
              <div className="text-lg font-bold tabular-nums text-sky-400">{macros.carbs}g</div>
              <div className="text-[9px] uppercase tracking-wide text-zinc-500">Karb</div>
            </div>
            <div>
              <div className="text-lg font-bold tabular-nums text-violet-400">{macros.fat}g</div>
              <div className="text-[9px] uppercase tracking-wide text-zinc-500">Yağ</div>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <MealEditor
          meal={editing}
          canDelete={config.meals.some(m => m.id === editing.id) && !DEFAULT_MEAL_IDS.has(editing.id)}
          onSave={handleSaveMeal}
          onDelete={() => handleDeleteMeal(editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

const DEFAULT_MEAL_IDS = new Set(['breakfast', 'lunch', 'pre', 'workout', 'post', 'dinner'])
