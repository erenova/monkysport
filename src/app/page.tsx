'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { WorkoutPlan, DayLog, Exercise, AppData, ScheduleConfig } from '@/lib/types'
import { loadData, saveData, getTodayLog, updateLog, fetchGist, pushGist, ImportPayload } from '@/lib/storage'
import { getTodaysDayNumber, getToday, cn } from '@/lib/utils'
import { defaultPlan } from '@/data/default-plan'
import { defaultSchedule } from '@/data/default-schedule'
import { DaySelector } from '@/components/day-selector'
import { ExerciseCard } from '@/components/exercise-card'
import { VideoCoach } from '@/components/video-coach'
import { PlanManager } from '@/components/plan-manager'
import { TimerBar } from '@/components/timer-bar'
import { FocusPanel, computeFocus } from '@/components/focus-panel'
import { ScheduleView } from '@/components/schedule-view'
import { GuideModal } from '@/components/guide-modal'
import { TimerState } from '@/lib/timer'
import { Settings, Dumbbell, Calendar, Activity } from 'lucide-react'

type View = 'workout' | 'schedule'

export default function Home() {
  const [plan, setPlan] = useState<WorkoutPlan>(defaultPlan)
  const [selectedDay, setSelectedDay] = useState(getTodaysDayNumber())
  const [logs, setLogs] = useState<DayLog[]>([])
  const [videoExercise, setVideoExercise] = useState<Exercise | null>(null)
  const [showManager, setShowManager] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [gistId, setGistId] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [schedule, setSchedule] = useState<ScheduleConfig>(defaultSchedule)
  const [view, setView] = useState<View>('workout')
  const [timer, setTimer] = useState<TimerState | null>(null)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    const data = loadData()
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlan(data.plan)
      setLogs(data.logs)
      if (data.settings.gistId) setGistId(data.settings.gistId)
      if (data.settings.githubToken) setGithubToken(data.settings.githubToken)
      if (data.settings.schedule) setSchedule(data.settings.schedule)
    }
    setLoaded(true)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])

  useEffect(() => {
    if (!loaded || !gistId) return
    fetchGist(gistId)
      .then(handleImport)
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, gistId])

  useEffect(() => {
    if (!loaded) return
    saveData({
      plan,
      logs,
      settings: {
        startDate: new Date().toISOString(),
        gistId: gistId || undefined,
        githubToken: githubToken || undefined,
        schedule,
      },
    })
  }, [plan, logs, loaded, gistId, githubToken, schedule])

  const currentDay = plan.schedule.find(d => d.day === selectedDay)
  const todayLog = getTodayLog(logs, selectedDay)

  const completedDays = new Set(
    logs
      .filter(l => l.date === getToday())
      .filter(l => {
        const day = plan.schedule.find(d => d.day === l.dayNumber)
        if (!day) return false
        return day.exercises.length > 0 &&
          l.exercises.length >= day.exercises.length &&
          l.exercises.every(e => e.completedSets.every(Boolean))
      })
      .map(l => l.dayNumber)
  )

  const setSetState = useCallback((exerciseId: string, setIndex: number, value: boolean) => {
    setLogs(prev => {
      const today = getToday()
      const existing = prev.find(l => l.date === today && l.dayNumber === selectedDay)

      const base = existing ?? {
        date: today,
        dayNumber: selectedDay,
        exercises: currentDay?.exercises.map(e => ({
          exerciseId: e.id,
          completedSets: Array(e.sets).fill(false),
        })) ?? [],
      }

      const exerciseExists = base.exercises.some(e => e.exerciseId === exerciseId)
      const exercises = exerciseExists
        ? base.exercises.map(e => {
            if (e.exerciseId !== exerciseId) return e
            const newSets = [...e.completedSets]
            newSets[setIndex] = value
            return { ...e, completedSets: newSets }
          })
        : [
            ...base.exercises,
            {
              exerciseId,
              completedSets: Array(currentDay?.exercises.find(e => e.id === exerciseId)?.sets ?? 0)
                .fill(false)
                .map((v: boolean, i: number) => (i === setIndex ? value : v)),
            },
          ]

      return updateLog(prev, { ...base, exercises })
    })
  }, [selectedDay, currentDay])

  const scrollToNext = useCallback((exerciseId: string, setIndex: number) => {
    if (!currentDay) return
    const exIdx = currentDay.exercises.findIndex(e => e.id === exerciseId)
    if (exIdx < 0) return
    const ex = currentDay.exercises[exIdx]
    const stillSame = setIndex + 1 < ex.sets
    const targetId = stillSame ? ex.id : currentDay.exercises[exIdx + 1]?.id
    if (!targetId) return
    setTimeout(() => {
      document.getElementById('ex-' + targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
  }, [currentDay])

  const handleSetClick = useCallback((exerciseId: string, setIndex: number) => {
    if (!currentDay) return
    const exercise = currentDay.exercises.find(e => e.id === exerciseId)
    if (!exercise) return
    const log = todayLog?.exercises.find(e => e.exerciseId === exerciseId)
    const currentlyChecked = log?.completedSets[setIndex] ?? false

    if (currentlyChecked) {
      setSetState(exerciseId, setIndex, false)
      if (timer && timer.exerciseId === exerciseId && timer.setIndex === setIndex) {
        setTimer(null)
      }
      return
    }

    if (exercise.durationSeconds && exercise.durationSeconds > 0) {
      setTimer({
        kind: 'work',
        exerciseId,
        setIndex,
        totalSeconds: exercise.durationSeconds,
        startedAt: Date.now(),
      })
      return
    }

    setSetState(exerciseId, setIndex, true)
    if (exercise.restSeconds > 0) {
      setTimer({
        kind: 'rest',
        exerciseId,
        setIndex,
        totalSeconds: exercise.restSeconds,
        startedAt: Date.now(),
      })
    }
  }, [currentDay, todayLog, timer, setSetState])

  const handleTimerComplete = useCallback(() => {
    if (!timer || !currentDay) return
    const exercise = currentDay.exercises.find(e => e.id === timer.exerciseId)
    if (!exercise) {
      setTimer(null)
      return
    }
    if (timer.kind === 'work') {
      setSetState(timer.exerciseId, timer.setIndex, true)
      if (exercise.restSeconds > 0) {
        setTimer({
          kind: 'rest',
          exerciseId: timer.exerciseId,
          setIndex: timer.setIndex,
          totalSeconds: exercise.restSeconds,
          startedAt: Date.now(),
        })
      } else {
        setTimer(null)
        scrollToNext(timer.exerciseId, timer.setIndex)
      }
    } else {
      setTimer(null)
      scrollToNext(timer.exerciseId, timer.setIndex)
    }
  }, [timer, currentDay, setSetState, scrollToNext])

  function handleAddSeconds(extra: number) {
    setTimer(prev => prev ? { ...prev, totalSeconds: prev.totalSeconds + extra } : prev)
  }

  function handleUpdateExercise(updated: Exercise) {
    setPlan(prev => ({
      ...prev,
      schedule: prev.schedule.map(day => ({
        ...day,
        exercises: day.exercises.map(e => (e.id === updated.id ? updated : e)),
      })),
    }))
  }

  function handleImport(payload: ImportPayload) {
    setPlan(payload.plan)
    setSelectedDay(getTodaysDayNumber())
    if (payload.kind === 'full') {
      setLogs(payload.logs ?? [])
      if (payload.schedule) setSchedule(payload.schedule)
    } else {
      setLogs([])
    }
  }

  function handleReset() {
    setPlan(defaultPlan)
    setLogs([])
    setSchedule(defaultSchedule)
  }

  function handleSettingsChange(newGistId: string, newToken: string) {
    setGistId(newGistId)
    setGithubToken(newToken)
  }

  async function handleSync() {
    if (!gistId) throw new Error('Gist ID yok')
    const payload = await fetchGist(gistId)
    handleImport(payload)
  }

  async function handlePush() {
    if (!gistId || !githubToken) throw new Error('Gist ayarları eksik')
    await pushGist(gistId, githubToken, appData)
  }

  const focus = useMemo(
    () => computeFocus(currentDay?.exercises ?? [], todayLog?.exercises ?? []),
    [currentDay, todayLog],
  )

  function handleFocusStart() {
    if (!focus.current) return
    handleSetClick(focus.current.exercise.id, focus.current.setIndex)
  }

  function handleJumpToCard(exerciseId: string) {
    document.getElementById('ex-' + exerciseId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Dumbbell className="animate-pulse text-amber-500" size={32} />
      </div>
    )
  }

  const totalSets = currentDay?.exercises.reduce((sum, e) => sum + e.sets, 0) ?? 0
  const doneSets = todayLog?.exercises.reduce(
    (sum, e) => sum + e.completedSets.filter(Boolean).length, 0
  ) ?? 0
  const progress = totalSets > 0 ? (doneSets / totalSets) * 100 : 0
  const allMuscles = currentDay
    ? [...new Set(currentDay.exercises.flatMap(e => e.targetMuscles))]
    : []

  const appData: AppData = {
    plan,
    logs,
    settings: {
      startDate: new Date().toISOString(),
      gistId: gistId || undefined,
      githubToken: githubToken || undefined,
      schedule,
    },
  }

  const timerExerciseName = timer
    ? currentDay?.exercises.find(e => e.id === timer.exerciseId)?.name ?? ''
    : ''

  return (
    <main className={cn('max-w-lg mx-auto', timer ? 'pb-40' : 'pb-12')}>
      <div className="fixed top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none z-0" />

      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/30">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Dumbbell size={18} className="text-amber-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">{plan.name}</h1>
              <p className="text-[11px] text-zinc-500 leading-none">{plan.description}</p>
            </div>
          </div>
          <button
            onClick={() => setShowManager(true)}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            aria-label="Ayarlar"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="px-4 pb-2">
          <div className="flex bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-0.5">
            <button
              onClick={() => setView('workout')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors',
                view === 'workout'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              <Activity size={13} />
              Antrenman
            </button>
            <button
              onClick={() => setView('schedule')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors',
                view === 'schedule'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              <Calendar size={13} />
              Günlük Plan
            </button>
          </div>
        </div>
      </header>

      <section className="pt-4">
        <DaySelector
          schedule={plan.schedule}
          selectedDay={selectedDay}
          onSelect={setSelectedDay}
          completedDays={completedDays}
        />
      </section>

      {view === 'workout' && (
        <>
          {currentDay && currentDay.category !== 'rest' && totalSets > 0 && (
            <div className="px-4 mt-4">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
                <span>İlerleme</span>
                <span className="tabular-nums">{doneSets}/{totalSets} set</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {currentDay && (
            <div className="px-4 mt-5 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{currentDay.emoji}</span>
                <div>
                  <h2 className="text-lg font-bold leading-tight">{currentDay.name}</h2>
                  <p className="text-[11px] text-zinc-500">
                    {currentDay.category !== 'rest'
                      ? `${currentDay.exercises.length} hareket · ${allMuscles.join(', ')}`
                      : 'Aktif dinlenme günü'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentDay && currentDay.category !== 'rest' && (
            <FocusPanel
              focus={focus}
              onStart={handleFocusStart}
              onJumpToCard={handleJumpToCard}
              onOpenVideo={setVideoExercise}
              timerActive={!!timer}
            />
          )}

          {currentDay && (
            <div className="px-4 space-y-3">
              {currentDay.exercises.map(exercise => (
                <div key={exercise.id} id={'ex-' + exercise.id}>
                  <ExerciseCard
                    exercise={exercise}
                    log={todayLog?.exercises.find(e => e.exerciseId === exercise.id)}
                    onToggleSet={handleSetClick}
                    onVideoClick={setVideoExercise}
                    onUpdate={handleUpdateExercise}
                    activeTimer={
                      timer && timer.exerciseId === exercise.id
                        ? { kind: timer.kind, setIndex: timer.setIndex }
                        : null
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {currentDay?.category === 'rest' && currentDay.exercises.length === 0 && (
            <div className="px-4 mt-12 text-center space-y-3">
              <span className="text-5xl block">🧘</span>
              <h3 className="text-base font-semibold">Aktif Dinlenme</h3>
              <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                Tempolu yürüyüş, yokuş kardiyosu. Deep Work ve reset zamanı.
              </p>
            </div>
          )}

          {progress >= 100 && currentDay?.category !== 'rest' && (
            <div className="px-4 mt-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                <span className="text-3xl block mb-2">🔥</span>
                <p className="text-emerald-400 font-semibold text-sm">Bugünkü antrenman tamam!</p>
                <p className="text-zinc-500 text-xs mt-1">Disiplin amatörler için değil, devam et aslanım.</p>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'schedule' && (
        <div className="mt-5">
          <ScheduleView
            config={schedule}
            selectedDay={selectedDay}
            schedule={plan.schedule}
            currentDay={currentDay}
            onChange={setSchedule}
          />
        </div>
      )}

      <VideoCoach exercise={videoExercise} onClose={() => setVideoExercise(null)} />

      {timer && (
        <TimerBar
          key={`${timer.kind}-${timer.exerciseId}-${timer.setIndex}-${timer.startedAt}`}
          timer={timer}
          exerciseName={timerExerciseName}
          onAddSeconds={handleAddSeconds}
          onComplete={handleTimerComplete}
          onCancel={() => setTimer(null)}
        />
      )}

      {showManager && (
        <PlanManager
          plan={plan}
          allData={appData}
          gistId={gistId}
          githubToken={githubToken}
          onImport={handleImport}
          onReset={handleReset}
          onSettingsChange={handleSettingsChange}
          onSync={handleSync}
          onPush={handlePush}
          onShowGuide={() => { setShowManager(false); setShowGuide(true) }}
          onClose={() => setShowManager(false)}
        />
      )}

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </main>
  )
}
