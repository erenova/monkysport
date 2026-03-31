'use client'

import { useState, useEffect, useCallback } from 'react'
import { WorkoutPlan, DayLog, Exercise, AppData } from '@/lib/types'
import { loadData, saveData, getTodayLog, updateLog, fetchGistPlan, pushGistPlan } from '@/lib/storage'
import { getTodaysDayNumber, getToday } from '@/lib/utils'
import { defaultPlan } from '@/data/default-plan'
import { DaySelector } from '@/components/day-selector'
import { ExerciseCard } from '@/components/exercise-card'
import { VideoModal } from '@/components/video-modal'
import { PlanManager } from '@/components/plan-manager'
import { Settings, Dumbbell } from 'lucide-react'

export default function Home() {
  const [plan, setPlan] = useState<WorkoutPlan>(defaultPlan)
  const [selectedDay, setSelectedDay] = useState(getTodaysDayNumber())
  const [logs, setLogs] = useState<DayLog[]>([])
  const [videoExercise, setVideoExercise] = useState<Exercise | null>(null)
  const [showManager, setShowManager] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [gistId, setGistId] = useState('')
  const [githubToken, setGithubToken] = useState('')

  useEffect(() => {
    const data = loadData()
    if (data) {
      setPlan(data.plan)
      setLogs(data.logs)
      if (data.settings.gistId) setGistId(data.settings.gistId)
      if (data.settings.githubToken) setGithubToken(data.settings.githubToken)
    }
    setLoaded(true)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])

  // Auto-sync from gist on load
  useEffect(() => {
    if (!loaded || !gistId) return
    fetchGistPlan(gistId)
      .then(remote => setPlan(remote))
      .catch(() => {})
  }, [loaded, gistId])

  useEffect(() => {
    if (!loaded) return
    saveData({ plan, logs, settings: { startDate: new Date().toISOString(), gistId: gistId || undefined, githubToken: githubToken || undefined } })
  }, [plan, logs, loaded, gistId, githubToken])

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

  const handleToggleSet = useCallback((exerciseId: string, setIndex: number) => {
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
            newSets[setIndex] = !newSets[setIndex]
            return { ...e, completedSets: newSets }
          })
        : [
            ...base.exercises,
            {
              exerciseId,
              completedSets: Array(currentDay?.exercises.find(e => e.id === exerciseId)?.sets ?? 0)
                .fill(false)
                .map((v: boolean, i: number) => (i === setIndex ? true : v)),
            },
          ]

      return updateLog(prev, { ...base, exercises })
    })
  }, [selectedDay, currentDay])

  function handleUpdateExercise(updated: Exercise) {
    setPlan(prev => ({
      ...prev,
      schedule: prev.schedule.map(day => ({
        ...day,
        exercises: day.exercises.map(e => (e.id === updated.id ? updated : e)),
      })),
    }))
  }

  function handleImport(imported: WorkoutPlan) {
    setPlan(imported)
    setLogs([])
    setSelectedDay(getTodaysDayNumber())
  }

  function handleReset() {
    setPlan(defaultPlan)
    setLogs([])
  }

  function handleSettingsChange(newGistId: string, newToken: string) {
    setGistId(newGistId)
    setGithubToken(newToken)
  }

  async function handleSync() {
    if (!gistId) throw new Error('Gist ID yok')
    const remote = await fetchGistPlan(gistId)
    setPlan(remote)
  }

  async function handlePush() {
    if (!gistId || !githubToken) throw new Error('Gist ayarları eksik')
    await pushGistPlan(gistId, githubToken, plan)
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

  const appData: AppData = { plan, logs, settings: { startDate: new Date().toISOString(), gistId: gistId || undefined, githubToken: githubToken || undefined } }

  return (
    <main className="max-w-lg mx-auto pb-12">
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
      </header>

      <section className="pt-4">
        <DaySelector
          schedule={plan.schedule}
          selectedDay={selectedDay}
          onSelect={setSelectedDay}
          completedDays={completedDays}
        />
      </section>

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

      {currentDay && (
        <div className="px-4 space-y-3">
          {currentDay.exercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              log={todayLog?.exercises.find(e => e.exerciseId === exercise.id)}
              onToggleSet={handleToggleSet}
              onVideoClick={setVideoExercise}
              onUpdate={handleUpdateExercise}
            />
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

      <VideoModal exercise={videoExercise} onClose={() => setVideoExercise(null)} />

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
          onClose={() => setShowManager(false)}
        />
      )}
    </main>
  )
}
