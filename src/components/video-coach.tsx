'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Exercise, DayLog } from '@/lib/types'
import { getYouTubeEmbedUrl, getYouTubeSearchUrl, cn } from '@/lib/utils'
import { Alarm, formatClock } from '@/lib/timer'
import {
  X, ExternalLink, Play, Pause, RotateCcw, Plus, Minus, BellOff,
  Link as LinkIcon, Check, ChevronLeft, ChevronRight,
} from 'lucide-react'

interface VideoCoachProps {
  exercises: Exercise[]
  activeExerciseId: string | null
  log?: DayLog
  onClose: () => void
  onChangeExercise: (id: string) => void
  onUpdate: (exercise: Exercise) => void
  onToggleSet: (exerciseId: string, setIndex: number) => void
}

const PRESETS = [30, 45, 60, 90, 120, 180]

type Status =
  | { kind: 'idle'; remainingSeconds: number }
  | { kind: 'running'; targetEnd: number }
  | { kind: 'alarm' }

export function VideoCoach({
  exercises, activeExerciseId, log,
  onClose, onChangeExercise, onUpdate, onToggleSet,
}: VideoCoachProps) {
  const exercise = useMemo(
    () => exercises.find(e => e.id === activeExerciseId) ?? null,
    [exercises, activeExerciseId],
  )
  const index = exercise ? exercises.findIndex(e => e.id === exercise.id) : -1
  const total = exercises.length
  const prevExercise = index > 0 ? exercises[index - 1] : null
  const nextExercise = index >= 0 && index < total - 1 ? exercises[index + 1] : null

  const completedSets = useMemo(() => {
    if (!exercise) return [] as boolean[]
    const entry = log?.exercises.find(e => e.exerciseId === exercise.id)
    return entry?.completedSets ?? Array(exercise.sets).fill(false)
  }, [exercise, log])
  const doneCount = completedSets.filter(Boolean).length

  const initialRest = exercise?.restSeconds && exercise.restSeconds > 0 ? exercise.restSeconds : 60
  const [preset, setPreset] = useState<number>(initialRest)
  const [totalRest, setTotalRest] = useState<number>(initialRest)
  const [status, setStatus] = useState<Status>({ kind: 'idle', remainingSeconds: initialRest })
  const [now, setNow] = useState<number>(() => Date.now())
  const [linkInput, setLinkInput] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const alarmRef = useRef<Alarm | null>(null)

  const stopAlarm = useCallback(() => {
    alarmRef.current?.stop()
    alarmRef.current = null
  }, [])

  // Reset state when active exercise changes
  useEffect(() => {
    if (!exercise) return
    stopAlarm()
    const rest = exercise.restSeconds && exercise.restSeconds > 0 ? exercise.restSeconds : 60
    setPreset(rest)
    setTotalRest(rest)
    setStatus({ kind: 'idle', remainingSeconds: rest })
    setLinkInput('')
    setShowLinkInput(false)
    setNow(Date.now())
  }, [exercise?.id, exercise?.restSeconds, stopAlarm])

  const running = status.kind === 'running'
  const alarmActive = status.kind === 'alarm'
  const remaining =
    status.kind === 'running'
      ? Math.max(0, (status.targetEnd - now) / 1000)
      : status.kind === 'alarm'
        ? 0
        : status.remainingSeconds

  const reset = useCallback(() => {
    stopAlarm()
    setStatus({ kind: 'idle', remainingSeconds: totalRest })
  }, [stopAlarm, totalRest])

  const start = useCallback(() => {
    setStatus(prev => {
      const seconds = prev.kind === 'idle' ? prev.remainingSeconds : totalRest
      const useSeconds = seconds > 0 ? seconds : totalRest
      return { kind: 'running', targetEnd: Date.now() + useSeconds * 1000 }
    })
    setNow(Date.now())
  }, [totalRest])

  const pause = useCallback(() => {
    setStatus(prev => {
      if (prev.kind !== 'running') return prev
      const remainingSeconds = Math.max(0, (prev.targetEnd - Date.now()) / 1000)
      return { kind: 'idle', remainingSeconds }
    })
  }, [])

  const toggle = useCallback(() => {
    if (alarmActive) { stopAlarm(); setStatus({ kind: 'idle', remainingSeconds: totalRest }); return }
    if (running) pause()
    else start()
  }, [alarmActive, stopAlarm, totalRest, running, pause, start])

  const adjust = useCallback((delta: number) => {
    setTotalRest(t => Math.max(5, t + delta))
    setStatus(prev => {
      if (prev.kind === 'running') {
        const newEnd = prev.targetEnd + delta * 1000
        return { kind: 'running', targetEnd: Math.max(Date.now(), newEnd) }
      }
      if (prev.kind === 'alarm') {
        stopAlarm()
        return { kind: 'idle', remainingSeconds: Math.max(0, delta) }
      }
      return { kind: 'idle', remainingSeconds: Math.max(0, prev.remainingSeconds + delta) }
    })
    setNow(Date.now())
  }, [stopAlarm])

  const loadPreset = useCallback((seconds: number) => {
    stopAlarm()
    setPreset(seconds)
    setTotalRest(seconds)
    setStatus({ kind: 'idle', remainingSeconds: seconds })
    setNow(Date.now())
  }, [stopAlarm])

  const goPrev = useCallback(() => {
    if (prevExercise) onChangeExercise(prevExercise.id)
  }, [prevExercise, onChangeExercise])

  const goNext = useCallback(() => {
    if (nextExercise) onChangeExercise(nextExercise.id)
  }, [nextExercise, onChangeExercise])

  const toggleNextSet = useCallback(() => {
    if (!exercise) return
    const idx = completedSets.findIndex(v => !v)
    const target = idx >= 0 ? idx : exercise.sets - 1
    onToggleSet(exercise.id, target)
  }, [exercise, completedSets, onToggleSet])

  // Tick while running
  useEffect(() => {
    if (status.kind !== 'running') return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [status.kind])

  // Trigger alarm at zero
  useEffect(() => {
    if (status.kind === 'running' && (status.targetEnd - now) / 1000 <= 0) {
      const a = new Alarm()
      a.start()
      alarmRef.current = a
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus({ kind: 'alarm' })
    }
  }, [now, status])

  // Cleanup alarm when modal closes
  useEffect(() => {
    return () => { alarmRef.current?.stop() }
  }, [])

  // Keyboard
  useEffect(() => {
    if (!exercise) return
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (e.key === 'Escape') {
        if (alarmActive) { stopAlarm(); setStatus({ kind: 'idle', remainingSeconds: totalRest }); return }
        onClose()
      } else if (e.code === 'Space') {
        e.preventDefault()
        toggle()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        reset()
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        adjust(15)
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        adjust(-15)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        toggleNextSet()
      } else {
        const num = parseInt(e.key, 10)
        if (num >= 1 && num <= PRESETS.length) {
          e.preventDefault()
          loadPreset(PRESETS[num - 1])
        }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [exercise, onClose, toggle, reset, adjust, loadPreset, alarmActive, stopAlarm, totalRest, goPrev, goNext, toggleNextSet])

  if (!exercise) return null

  const embedUrl = exercise.videoUrl
    ? getYouTubeEmbedUrl(exercise.videoUrl, { autoplay: 1, rel: 0, modestbranding: 1 })
    : null
  const isDirectVideo = exercise.videoUrl && !embedUrl
  const searchUrl = getYouTubeSearchUrl(exercise.name)
  const progress = totalRest > 0 ? Math.min(100, Math.max(0, ((totalRest - remaining) / totalRest) * 100)) : 0
  const allSetsDone = doneCount === exercise.sets && exercise.sets > 0

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[96dvh] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-20 p-2 rounded-lg bg-black/50 backdrop-blur text-zinc-300 hover:text-white hover:bg-black/70 transition-colors"
          aria-label="Kapat"
        >
          <X size={18} />
        </button>

        <div className="md:flex-1 md:min-w-0 bg-black flex items-center justify-center relative">
          {embedUrl ? (
            <div className="w-full aspect-video">
              <iframe
                key={exercise.id}
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : isDirectVideo ? (
            <div className="w-full aspect-video bg-black">
              <video key={exercise.id} src={exercise.videoUrl} controls autoPlay className="w-full h-full" />
            </div>
          ) : (
            <div className="w-full aspect-video flex flex-col items-center justify-center text-center px-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                <ExternalLink size={22} className="text-zinc-500" />
              </div>
              <div>
                <p className="text-zinc-300 text-sm font-medium">Video henüz eklenmemiş</p>
                <p className="text-zinc-500 text-xs mt-1">YouTube&apos;da ara, sonra linki yapıştır</p>
              </div>
              <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                <a
                  href={searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400"
                >
                  <ExternalLink size={14} />
                  YouTube&apos;da Ara
                </a>
                {!showLinkInput ? (
                  <button
                    onClick={() => setShowLinkInput(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-semibold hover:bg-zinc-700"
                  >
                    <LinkIcon size={14} />
                    Video Linki Ekle
                  </button>
                ) : (
                  <form
                    onSubmit={e => {
                      e.preventDefault()
                      const url = linkInput.trim()
                      if (!url) return
                      onUpdate({ ...exercise, videoUrl: url })
                      setLinkInput('')
                      setShowLinkInput(false)
                    }}
                    className="w-full flex gap-1.5"
                  >
                    <input
                      autoFocus
                      type="url"
                      value={linkInput}
                      onChange={e => setLinkInput(e.target.value)}
                      placeholder="https://youtu.be/..."
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/60 placeholder:text-zinc-600"
                    />
                    <button
                      type="submit"
                      disabled={!linkInput.trim()}
                      className="shrink-0 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 disabled:opacity-30"
                    >
                      <Check size={14} />
                      Kaydet
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          <button
            onClick={goPrev}
            disabled={!prevExercise}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Önceki hareket"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goNext}
            disabled={!nextExercise}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Sonraki hareket"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="md:w-[340px] md:border-l border-t md:border-t-0 border-zinc-800 flex flex-col bg-zinc-950 overflow-y-auto">
          <div className="px-4 pt-3 pb-2 pr-14 border-b border-zinc-800/60">
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider font-bold flex-wrap">
              <span>Hareket {index + 1} / {total}</span>
              <span className={cn(
                'normal-case tracking-normal font-semibold px-1.5 py-0.5 rounded',
                allSetsDone
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-amber-500/15 text-amber-400',
              )}>
                {doneCount}/{exercise.sets} set
              </span>
            </div>
            <div className={cn(
              'font-bold text-sm leading-tight mt-1',
              allSetsDone && 'text-emerald-400',
            )}>
              {exercise.name}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              {exercise.sets} Set &times; {exercise.reps}
              {exercise.restSeconds > 0 && ` · ${exercise.restSeconds}s dinlenme`}
            </div>
          </div>

          <div className="px-4 py-3 border-b border-zinc-800/60">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">Setler</div>
            <div className="flex gap-1.5">
              {Array.from({ length: exercise.sets }, (_, i) => (
                <button
                  key={i}
                  onClick={() => onToggleSet(exercise.id, i)}
                  className={cn(
                    'flex-1 h-10 rounded-lg border text-xs font-medium transition-all active:scale-95',
                    completedSets[i]
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-500 hover:border-zinc-600',
                  )}
                  aria-label={`Set ${i + 1}`}
                >
                  {completedSets[i] ? <Check size={14} className="mx-auto" /> : i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">Dinlenme Sayacı</div>
            <div className={cn(
              'relative rounded-2xl border-2 p-4 transition-colors',
              alarmActive
                ? 'border-rose-500 bg-rose-500/10 animate-pulse'
                : running
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-zinc-800 bg-zinc-900/60',
            )}>
              <div className={cn(
                'text-center font-bold tabular-nums tracking-tight',
                'text-5xl sm:text-6xl',
                alarmActive ? 'text-rose-300' : running ? 'text-emerald-300' : 'text-zinc-100',
              )}>
                {formatClock(remaining)}
              </div>
              <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-100 ease-linear',
                    alarmActive ? 'bg-rose-400' : 'bg-gradient-to-r from-amber-500 to-emerald-500',
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="px-4 pb-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">Presetler</div>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESETS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => loadPreset(s)}
                  className={cn(
                    'relative h-10 rounded-xl border text-sm font-semibold tabular-nums transition-all active:scale-95',
                    preset === s
                      ? 'bg-amber-500 border-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800',
                  )}
                >
                  {s}sn
                  <span className="hidden md:block absolute top-0.5 right-1 text-[8px] font-mono text-zinc-500">{i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pb-2">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => adjust(-15)}
                className="h-10 flex items-center justify-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 active:scale-95"
              >
                <Minus size={13} /> 15sn
              </button>
              <button
                onClick={reset}
                className="h-10 flex items-center justify-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 active:scale-95"
                aria-label="Sıfırla"
              >
                <RotateCcw size={13} /> Sıfırla
              </button>
              <button
                onClick={() => adjust(15)}
                className="h-10 flex items-center justify-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 active:scale-95"
              >
                <Plus size={13} /> 15sn
              </button>
            </div>
          </div>

          <div className="px-4 pb-3 mt-1">
            <button
              onClick={toggle}
              className={cn(
                'w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-base font-bold transition-all active:scale-[0.98] shadow-lg',
                alarmActive
                  ? 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/30'
                  : running
                    ? 'bg-zinc-200 text-zinc-950 hover:bg-zinc-100 shadow-zinc-200/10'
                    : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/30',
              )}
              aria-label={alarmActive ? 'Alarmı durdur' : running ? 'Duraklat' : 'Başlat'}
            >
              {alarmActive ? (
                <>
                  <BellOff size={18} />
                  Alarmı Durdur
                </>
              ) : running ? (
                <>
                  <Pause size={18} />
                  Duraklat
                </>
              ) : (
                <>
                  <Play size={18} />
                  Başlat
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 px-4 pb-3">
            <button
              onClick={goPrev}
              disabled={!prevExercise}
              className="h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Önceki
            </button>
            <button
              onClick={goNext}
              disabled={!nextExercise}
              className="h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Sonraki
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="hidden md:block px-4 py-2 border-t border-zinc-800/60 mt-auto">
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider font-bold mb-1">Klavye</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
              <Kbd k="← / →" v="Hareket" />
              <Kbd k="Enter" v="Set işaretle" />
              <Kbd k="Space" v={alarmActive ? 'Alarm dur' : running ? 'Duraklat' : 'Başlat'} />
              <Kbd k="R" v="Sıfırla" />
              <Kbd k="+ / -" v="±15 sn" />
              <Kbd k="1-6" v="Preset" />
              <Kbd k="Esc" v="Kapat" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kbd({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[9px] min-w-[28px] text-center">{k}</kbd>
      <span>{v}</span>
    </div>
  )
}
