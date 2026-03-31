'use client'

import { useState } from 'react'
import { Exercise, ExerciseLog } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Play, Pencil, Check, X, ChevronDown, ChevronUp, Timer } from 'lucide-react'

interface ExerciseCardProps {
  exercise: Exercise
  log?: ExerciseLog
  editable: boolean
  onToggleSet: (exerciseId: string, setIndex: number) => void
  onVideoClick: (exercise: Exercise) => void
  onUpdate: (exercise: Exercise) => void
}

export function ExerciseCard({ exercise, log, editable, onToggleSet, onVideoClick, onUpdate }: ExerciseCardProps) {
  const [editing, setEditing] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [draft, setDraft] = useState(exercise)

  const completedSets = log?.completedSets ?? Array(exercise.sets).fill(false)
  const completedCount = completedSets.filter(Boolean).length
  const allDone = completedCount === exercise.sets

  function save() {
    onUpdate(draft)
    setEditing(false)
  }

  function cancel() {
    setDraft(exercise)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 space-y-3">
        <input
          value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
          placeholder="Hareket adı"
        />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-medium">Set</label>
            <input
              type="number"
              value={draft.sets}
              onChange={e => setDraft({ ...draft, sets: parseInt(e.target.value) || 0 })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-medium">Tekrar</label>
            <input
              value={draft.reps}
              onChange={e => setDraft({ ...draft, reps: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-medium">Dinlenme</label>
            <input
              type="number"
              value={draft.restSeconds}
              onChange={e => setDraft({ ...draft, restSeconds: parseInt(e.target.value) || 0 })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
              placeholder="saniye"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-medium">Notlar</label>
          <textarea
            value={draft.notes}
            onChange={e => setDraft({ ...draft, notes: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-500/50"
            rows={2}
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-medium">Video URL</label>
          <input
            value={draft.videoUrl}
            onChange={e => setDraft({ ...draft, videoUrl: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
            placeholder="YouTube linki veya direkt video URL"
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-medium">Hedef Kaslar</label>
          <input
            value={draft.targetMuscles.join(', ')}
            onChange={e => setDraft({
              ...draft,
              targetMuscles: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
            })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
            placeholder="Virgülle ayır: Göğüs, Omuz, Triceps"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={cancel}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors"
          >
            <X size={14} />
            İptal
          </button>
          <button
            onClick={save}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-amber-500 text-black text-sm font-medium hover:bg-amber-400 transition-colors"
          >
            <Check size={14} />
            Kaydet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-zinc-900 border rounded-2xl p-4 transition-all',
      allDone ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-zinc-800/50',
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => onVideoClick(exercise)}
            className="shrink-0 w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center hover:bg-sky-500/20 transition-colors"
            aria-label="Video izle"
          >
            <Play size={18} />
          </button>
          <div className="min-w-0">
            <h3 className={cn(
              'font-semibold text-sm leading-tight',
              allDone && 'text-emerald-400',
            )}>
              {exercise.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
              <span>{exercise.sets} Set &times; {exercise.reps}</span>
              {exercise.restSeconds > 0 && (
                <span className="flex items-center gap-0.5">
                  <Timer size={10} />
                  {exercise.restSeconds}s
                </span>
              )}
            </div>
          </div>
        </div>
        {editable && (
          <button
            onClick={() => {
              setDraft(exercise)
              setEditing(true)
            }}
            className="shrink-0 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            aria-label="Düzenle"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 mt-3">
        {Array.from({ length: exercise.sets }, (_, i) => (
          <button
            key={i}
            onClick={() => onToggleSet(exercise.id, i)}
            className={cn(
              'flex-1 h-9 rounded-lg border text-xs font-medium transition-all active:scale-95',
              completedSets[i]
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-500 hover:border-zinc-600',
            )}
          >
            {completedSets[i] ? <Check size={14} className="mx-auto" /> : i + 1}
          </button>
        ))}
      </div>

      {exercise.targetMuscles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {exercise.targetMuscles.map(muscle => (
            <span
              key={muscle}
              className="px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 text-[10px] font-medium"
            >
              {muscle}
            </span>
          ))}
        </div>
      )}

      {exercise.notes && (
        <>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-1 mt-2.5 text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            {showNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showNotes ? 'Gizle' : 'Notlar'}
          </button>
          {showNotes && (
            <p className="mt-1.5 text-xs text-zinc-400 bg-zinc-800/40 rounded-lg px-3 py-2 leading-relaxed">
              {exercise.notes}
            </p>
          )}
        </>
      )}
    </div>
  )
}
