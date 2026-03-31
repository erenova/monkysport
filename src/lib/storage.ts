import { AppData, WorkoutPlan, DayLog } from './types'
import { getToday } from './utils'

const STORAGE_KEY = 'monkysport_data'

export function loadData(): AppData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage full or unavailable
  }
}

export function getTodayLog(logs: DayLog[], dayNumber: number): DayLog | undefined {
  return logs.find(l => l.date === getToday() && l.dayNumber === dayNumber)
}

export function updateLog(logs: DayLog[], log: DayLog): DayLog[] {
  const idx = logs.findIndex(l => l.date === log.date && l.dayNumber === log.dayNumber)
  if (idx >= 0) {
    return logs.map((l, i) => (i === idx ? log : l))
  }
  return [...logs, log]
}

export function exportPlan(plan: WorkoutPlan): void {
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${plan.name.toLowerCase().replace(/\s+/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importPlan(file: File): Promise<WorkoutPlan> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const plan = JSON.parse(reader.result as string)
        if (!plan.id || !plan.schedule) {
          reject(new Error('Geçersiz plan formatı'))
          return
        }
        resolve(plan)
      } catch {
        reject(new Error('Geçersiz JSON'))
      }
    }
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.readAsText(file)
  })
}

export async function fetchRemotePlan(url: string): Promise<WorkoutPlan> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const plan = await res.json()
  if (!plan.id || !plan.schedule) throw new Error('Geçersiz plan formatı')
  return plan
}

export function exportAllData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `monkysport-backup-${getToday()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
