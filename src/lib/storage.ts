import { AppData, WorkoutPlan, DayLog, ScheduleConfig } from './types'
import { getToday } from './utils'

export type ImportPayload =
  | { kind: 'plan'; plan: WorkoutPlan }
  | { kind: 'full'; plan: WorkoutPlan; schedule?: ScheduleConfig; logs?: DayLog[] }

function isPlan(obj: unknown): obj is WorkoutPlan {
  return !!obj && typeof obj === 'object' && 'id' in obj && 'schedule' in obj && Array.isArray((obj as WorkoutPlan).schedule)
}

export function parseImport(raw: string): ImportPayload {
  const parsed = JSON.parse(raw) as unknown
  if (parsed && typeof parsed === 'object' && 'plan' in parsed && isPlan((parsed as AppData).plan)) {
    const data = parsed as AppData
    return { kind: 'full', plan: data.plan, schedule: data.settings?.schedule, logs: data.logs }
  }
  if (isPlan(parsed)) {
    return { kind: 'plan', plan: parsed }
  }
  throw new Error('Geçersiz format: WorkoutPlan veya AppData bekleniyor')
}

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

export function importFile(file: File): Promise<ImportPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(parseImport(reader.result as string))
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Geçersiz JSON'))
      }
    }
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.readAsText(file)
  })
}

const CANONICAL_FILE = 'monkysport.json'

async function readGistFiles(gistId: string, token?: string): Promise<Record<string, { content: string }>> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`)
  const gist = await res.json() as { files: Record<string, { content: string }> }
  return gist.files
}

export async function fetchGist(gistId: string): Promise<ImportPayload> {
  const files = await readGistFiles(gistId)
  const entries = Object.entries(files)
  if (entries.length === 0) throw new Error('Gist boş')
  const preferred = entries.find(([n]) => n === CANONICAL_FILE)
    ?? entries.find(([n]) => /^(plan|appdata|monkysport.*|.*backup.*)\.json$/i.test(n))
    ?? entries[0]
  return parseImport(preferred[1].content)
}

export async function pushGist(gistId: string, token: string, data: AppData): Promise<void> {
  const safe: AppData = {
    plan: data.plan,
    logs: data.logs,
    settings: {
      startDate: data.settings.startDate,
      schedule: data.settings.schedule,
    },
  }
  const existing = await readGistFiles(gistId, token)
  const files: Record<string, { content: string } | null> = {
    [CANONICAL_FILE]: { content: JSON.stringify(safe, null, 2) },
  }
  for (const name of Object.keys(existing)) {
    if (name !== CANONICAL_FILE) files[name] = null
  }
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  })
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`)
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
