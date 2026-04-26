import { Meal, ScheduleConfig, Food, FoodRef, DayMealPlan } from './types'

export interface ScheduledMeal extends Meal {
  resolvedTime: string
  resolvedMinutes: number
  computedMacros: Macros
}

export interface Macros {
  protein: number
  carbs: number
  fat: number
  calories: number
}

const ZERO: Macros = { protein: 0, carbs: 0, fat: 0, calories: 0 }

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function formatTime(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function resolveMealTime(meal: Meal, workoutTime: string): { minutes: number; time: string } {
  const workoutMin = parseTime(workoutTime)
  switch (meal.anchor) {
    case 'pre-workout':
      return { minutes: workoutMin - (meal.offsetMinutes ?? 60), time: formatTime(workoutMin - (meal.offsetMinutes ?? 60)) }
    case 'post-workout':
      return { minutes: workoutMin + (meal.offsetMinutes ?? 30), time: formatTime(workoutMin + (meal.offsetMinutes ?? 30)) }
    case 'workout':
      return { minutes: workoutMin, time: workoutTime }
    case 'fixed':
    default:
      return { minutes: parseTime(meal.fixedTime ?? '12:00'), time: meal.fixedTime ?? '12:00' }
  }
}

export function computeMealMacros(meal: Meal, foods: Food[]): Macros {
  if (meal.foods && meal.foods.length > 0) {
    const totals = { ...ZERO }
    for (const ref of meal.foods) {
      const food = foods.find(f => f.id === ref.foodId)
      if (!food || food.baseAmount === 0) continue
      const factor = ref.amount / food.baseAmount
      totals.protein += food.protein * factor
      totals.carbs += food.carbs * factor
      totals.fat += food.fat * factor
      totals.calories += food.calories * factor
    }
    return roundMacros(totals)
  }
  return {
    protein: meal.protein ?? 0,
    carbs: meal.carbs ?? 0,
    fat: meal.fat ?? 0,
    calories: meal.calories ?? 0,
  }
}

function roundMacros(m: Macros): Macros {
  return {
    protein: Math.round(m.protein),
    carbs: Math.round(m.carbs),
    fat: Math.round(m.fat),
    calories: Math.round(m.calories),
  }
}

export function getMealsForDay(config: ScheduleConfig, day: number): Meal[] {
  if (config.dailyMeals && config.dailyMeals.length > 0) {
    const entry = config.dailyMeals.find(d => d.day === day)
    if (entry) return entry.meals
    return []
  }
  return config.meals ?? []
}

export function getWorkoutTimeForDay(config: ScheduleConfig, day: number): string {
  const entry = config.dailyMeals?.find(d => d.day === day)
  return entry?.workoutTime ?? config.workoutTime
}

export function buildDaySchedule(config: ScheduleConfig, day: number, isTrainingDay: boolean): ScheduledMeal[] {
  const meals = getMealsForDay(config, day)
  const workoutTime = getWorkoutTimeForDay(config, day)
  const foods = config.foods ?? []
  return meals
    .filter(m => isTrainingDay || !m.trainingOnly)
    .map(meal => {
      const { minutes, time } = resolveMealTime(meal, workoutTime)
      return {
        ...meal,
        resolvedTime: time,
        resolvedMinutes: minutes,
        computedMacros: computeMealMacros(meal, foods),
      }
    })
    .sort((a, b) => a.resolvedMinutes - b.resolvedMinutes)
}

export function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function totalMacros(meals: ScheduledMeal[]): Macros {
  return meals.reduce<Macros>(
    (acc, m) => ({
      protein: acc.protein + m.computedMacros.protein,
      carbs: acc.carbs + m.computedMacros.carbs,
      fat: acc.fat + m.computedMacros.fat,
      calories: acc.calories + m.computedMacros.calories,
    }),
    { ...ZERO },
  )
}

export function findFood(foods: Food[] | undefined, id: string): Food | undefined {
  return foods?.find(f => f.id === id)
}

export function ingredientLine(food: Food, ref: FoodRef): string {
  return `${ref.amount} ${food.unit} ${food.name}`
}

export function copyDayMeals(config: ScheduleConfig, fromDay: number, toDay: number): ScheduleConfig {
  const fromMeals = getMealsForDay(config, fromDay)
  const fromWorkoutTime = config.dailyMeals?.find(d => d.day === fromDay)?.workoutTime
  return upsertDayMeals(config, toDay, fromMeals.map(m => ({ ...m })), fromWorkoutTime)
}

export function upsertDayMeals(
  config: ScheduleConfig,
  day: number,
  meals: Meal[],
  workoutTimeOverride?: string,
): ScheduleConfig {
  const existing = config.dailyMeals ?? buildEmptyDailyMeals(config)
  const next = existing.map(d =>
    d.day === day ? { ...d, meals, workoutTime: workoutTimeOverride ?? d.workoutTime } : d,
  )
  return { ...config, dailyMeals: next }
}

function buildEmptyDailyMeals(config: ScheduleConfig): DayMealPlan[] {
  const fallback = config.meals ?? []
  return [1, 2, 3, 4, 5, 6, 7].map(day => ({ day, meals: [...fallback] }))
}

export function ensureDailyMeals(config: ScheduleConfig): ScheduleConfig {
  if (config.dailyMeals && config.dailyMeals.length === 7) return config
  return { ...config, dailyMeals: buildEmptyDailyMeals(config) }
}

export function setWorkoutTimeForDay(config: ScheduleConfig, day: number, time: string): ScheduleConfig {
  const ensured = ensureDailyMeals(config)
  const next = ensured.dailyMeals!.map(d =>
    d.day === day ? { ...d, workoutTime: time } : d,
  )
  return { ...ensured, dailyMeals: next }
}
