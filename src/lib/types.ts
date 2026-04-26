export interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  notes: string
  videoUrl: string
  targetMuscles: string[]
  restSeconds: number
  durationSeconds?: number
}

export interface DayPlan {
  day: number
  name: string
  category: 'push' | 'pull' | 'legs' | 'rest' | 'custom'
  emoji: string
  exercises: Exercise[]
}

export interface WorkoutPlan {
  id: string
  name: string
  description: string
  schedule: DayPlan[]
}

export interface ExerciseLog {
  exerciseId: string
  completedSets: boolean[]
}

export interface DayLog {
  date: string
  dayNumber: number
  exercises: ExerciseLog[]
}

export interface Recipe {
  name: string
  url: string
}

export interface Food {
  id: string
  name: string
  unit: string
  baseAmount: number
  protein: number
  carbs: number
  fat: number
  calories: number
}

export interface FoodRef {
  foodId: string
  amount: number
}

export type MealAnchor = 'fixed' | 'pre-workout' | 'workout' | 'post-workout'

export interface Meal {
  id: string
  name: string
  emoji: string
  anchor: MealAnchor
  fixedTime?: string
  offsetMinutes?: number
  foods?: FoodRef[]
  protein?: number
  carbs?: number
  fat?: number
  calories?: number
  notes?: string
  recipes?: Recipe[]
  trainingOnly?: boolean
}

export interface DayMealPlan {
  day: number
  workoutTime?: string
  meals: Meal[]
}

export interface ScheduleConfig {
  workoutTime: string
  foods?: Food[]
  dailyMeals?: DayMealPlan[]
  meals?: Meal[]
}

export interface AppData {
  plan: WorkoutPlan
  logs: DayLog[]
  settings: {
    startDate: string
    gistId?: string
    githubToken?: string
    schedule?: ScheduleConfig
  }
}
