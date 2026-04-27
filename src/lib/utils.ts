export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getTodaysDayNumber(): number {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function getYouTubeEmbedUrl(url: string, params?: Record<string, string | number>): string | null {
  const idMatch = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
  if (!idMatch) return null
  const startMatch = url.match(/[?&#]t=(\d+h)?(\d+m)?(\d+s?)?/)
  let start = 0
  if (startMatch) {
    const [, h, m, s] = startMatch
    start = (parseInt(h ?? '0') || 0) * 3600
      + (parseInt(m ?? '0') || 0) * 60
      + (parseInt(s ?? '0') || 0)
  }
  const query = new URLSearchParams()
  if (start > 0) query.set('start', String(start))
  for (const [k, v] of Object.entries(params ?? {})) query.set(k, String(v))
  const qs = query.toString()
  return qs ? `https://www.youtube.com/embed/${idMatch[1]}?${qs}` : `https://www.youtube.com/embed/${idMatch[1]}`
}

export function getYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' exercise form')}`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function extractGistId(input: string): string {
  const trimmed = input.trim()
  if (/^[a-f0-9]{20,}$/.test(trimmed)) return trimmed
  const match = trimmed.match(/([a-f0-9]{20,})/)
  return match ? match[1] : trimmed
}
