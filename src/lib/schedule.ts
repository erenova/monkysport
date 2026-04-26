import { Meal, ScheduleConfig } from './types'

export interface ScheduledMeal extends Meal {
  resolvedTime: string
  resolvedMinutes: number
}

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

export function resolveMealTime(meal: Meal, workoutTime: string): { minutes: number; time: string } {
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

export function buildDaySchedule(config: ScheduleConfig, isTrainingDay: boolean): ScheduledMeal[] {
  return config.meals
    .filter(m => isTrainingDay || !m.trainingOnly)
    .map(meal => {
      const { minutes, time } = resolveMealTime(meal, config.workoutTime)
      return { ...meal, resolvedTime: time, resolvedMinutes: minutes }
    })
    .sort((a, b) => a.resolvedMinutes - b.resolvedMinutes)
}

export function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function totalMacros(meals: ScheduledMeal[]) {
  return meals.reduce(
    (acc, m) => ({
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
      calories: acc.calories + (m.calories ?? 0),
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 },
  )
}
