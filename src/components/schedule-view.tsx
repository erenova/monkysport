'use client'

import { useEffect, useState } from 'react'
import { ScheduleConfig, Meal, DayPlan } from '@/lib/types'
import {
  buildDaySchedule,
  nowMinutes,
  totalMacros,
  getMealsForDay,
  getWorkoutTimeForDay,
  upsertDayMeals,
  ensureDailyMeals,
  setWorkoutTimeForDay,
  copyDayMeals,
} from '@/lib/schedule'
import { Clock, Plus, Flame, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MealEditor, newCustomMeal } from './meal-editor'
import { MealCard } from './meal-card'

interface ScheduleViewProps {
  config: ScheduleConfig
  selectedDay: number
  schedule: DayPlan[]
  currentDay: DayPlan | undefined
  onChange: (config: ScheduleConfig) => void
}

const DEFAULT_MEAL_IDS = new Set(['breakfast', 'lunch', 'pre', 'workout', 'post', 'dinner'])

export function ScheduleView({ config, selectedDay, schedule, currentDay, onChange }: ScheduleViewProps) {
  const isTrainingDay = !!currentDay && currentDay.category !== 'rest'
  const dayMeals = getMealsForDay(config, selectedDay)
  const workoutTime = getWorkoutTimeForDay(config, selectedDay)
  const meals = buildDaySchedule(config, selectedDay, isTrainingDay)
  const foods = config.foods ?? []
  const [editing, setEditing] = useState<Meal | null>(null)
  const [showCopyMenu, setShowCopyMenu] = useState(false)
  const [now, setNow] = useState<number>(() => nowMinutes())

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 30_000)
    return () => clearInterval(id)
  }, [])

  function handleSaveMeal(updated: Meal) {
    const exists = dayMeals.some(m => m.id === updated.id)
    const nextMeals = exists
      ? dayMeals.map(m => (m.id === updated.id ? updated : m))
      : [...dayMeals, updated]
    onChange(upsertDayMeals(ensureDailyMeals(config), selectedDay, nextMeals))
  }

  function handleDeleteMeal(id: string) {
    const nextMeals = dayMeals.filter(m => m.id !== id)
    onChange(upsertDayMeals(ensureDailyMeals(config), selectedDay, nextMeals))
  }

  function handleSetWorkoutTime(time: string) {
    onChange(setWorkoutTimeForDay(config, selectedDay, time))
  }

  function handleCopyFromDay(fromDay: number) {
    onChange(copyDayMeals(ensureDailyMeals(config), fromDay, selectedDay))
    setShowCopyMenu(false)
  }

  const macros = totalMacros(meals)
  const nextIdx = meals.findIndex(m => m.resolvedMinutes >= now)
  const dayLabel = schedule.find(d => d.day === selectedDay)
  const otherDays = schedule.filter(d => d.day !== selectedDay)

  return (
    <div className="px-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Günlük Plan</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base">{dayLabel?.emoji}</span>
            <h2 className="font-bold text-base">{dayLabel?.name}</h2>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowCopyMenu(o => !o)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/60 text-zinc-300 text-[11px] font-medium hover:bg-zinc-800 transition-colors"
          >
            <Copy size={12} />
            Kopyala
          </button>
          {showCopyMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowCopyMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-40 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                <div className="px-3 py-2 text-[10px] text-zinc-500 uppercase tracking-wider font-bold border-b border-zinc-800">
                  Şu günden kopyala
                </div>
                {otherDays.map(d => (
                  <button
                    key={d.day}
                    onClick={() => handleCopyFromDay(d.day)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-zinc-800 transition-colors"
                  >
                    <span>{d.emoji}</span>
                    <span className="text-zinc-300">{d.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-500/20 p-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">
          <Clock size={11} />
          Antrenman saati
        </div>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={workoutTime}
            onChange={e => handleSetWorkoutTime(e.target.value)}
            disabled={!isTrainingDay}
            className={cn(
              'bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-2xl font-bold tabular-nums focus:outline-none focus:border-amber-500/50',
              !isTrainingDay && 'opacity-50',
            )}
          />
          <div className="text-[11px] text-zinc-400 leading-tight">
            {isTrainingDay
              ? 'Pre/post öğünleri bu saate göre kayar.'
              : 'Bu gün dinlenme — antrenman yok.'}
          </div>
        </div>
      </div>

      {meals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
          <p className="text-sm text-zinc-500 mb-1">Bu gün için öğün tanımlı değil</p>
          <p className="text-[11px] text-zinc-600">Aşağıdan öğün ekle veya başka bir günden kopyala.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {meals.map((meal) => {
            const isPast = meal.resolvedMinutes < now
            const isNext = meals.indexOf(meal) === nextIdx
            return (
              <MealCard
                key={meal.id}
                meal={meal}
                foods={foods}
                isPast={isPast}
                isNext={isNext}
                onEdit={setEditing}
              />
            )
          })}
        </div>
      )}

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
          foods={foods}
          canDelete={dayMeals.some(m => m.id === editing.id) && !DEFAULT_MEAL_IDS.has(editing.id)}
          onSave={handleSaveMeal}
          onDelete={() => handleDeleteMeal(editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
