export interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  notes: string
  videoUrl: string
  targetMuscles: string[]
  restSeconds: number
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

export interface AppData {
  plan: WorkoutPlan
  logs: DayLog[]
  settings: {
    startDate: string
    gistId?: string
    githubToken?: string
  }
}
