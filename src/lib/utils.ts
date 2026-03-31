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

export function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export function getYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' exercise form')}`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}
