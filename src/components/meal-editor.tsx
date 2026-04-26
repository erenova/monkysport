'use client'

import { useState, useEffect } from 'react'
import { Meal, Recipe } from '@/lib/types'
import { X, Plus, Trash2, ExternalLink } from 'lucide-react'
import { generateId } from '@/lib/utils'

interface MealEditorProps {
  meal: Meal
  canDelete?: boolean
  onSave: (meal: Meal) => void
  onDelete?: () => void
  onClose: () => void
}

export function MealEditor({ meal, canDelete, onSave, onDelete, onClose }: MealEditorProps) {
  const [draft, setDraft] = useState<Meal>(meal)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const recipes = draft.recipes ?? []

  function updateRecipe(idx: number, patch: Partial<Recipe>) {
    const next = recipes.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    setDraft({ ...draft, recipes: next })
  }

  function addRecipe() {
    setDraft({ ...draft, recipes: [...recipes, { name: '', url: '' }] })
  }

  function removeRecipe(idx: number) {
    setDraft({ ...draft, recipes: recipes.filter((_, i) => i !== idx) })
  }

  function setNumber(key: keyof Meal, value: string) {
    const n = value === '' ? undefined : Number(value)
    setDraft({ ...draft, [key]: Number.isFinite(n) ? n : undefined })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90dvh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{draft.emoji}</span>
            <h2 className="font-bold text-sm">{draft.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-medium">Ad</label>
              <input
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-medium">Emoji</label>
              <input
                value={draft.emoji}
                onChange={e => setDraft({ ...draft, emoji: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {draft.anchor === 'fixed' && (
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-medium">Saat</label>
              <input
                type="time"
                value={draft.fixedTime ?? ''}
                onChange={e => setDraft({ ...draft, fixedTime: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
          )}

          {(draft.anchor === 'pre-workout' || draft.anchor === 'post-workout') && (
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-medium">
                Antrenmandan {draft.anchor === 'pre-workout' ? 'önce' : 'sonra'} (dakika)
              </label>
              <input
                type="number"
                value={draft.offsetMinutes ?? ''}
                onChange={e => setNumber('offsetMinutes', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
          )}

          {draft.anchor !== 'workout' && (
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-medium mb-1.5 block">Makrolar</label>
              <div className="grid grid-cols-4 gap-1.5">
                {([
                  ['protein', 'Protein', 'g'],
                  ['carbs', 'Karb', 'g'],
                  ['fat', 'Yağ', 'g'],
                  ['calories', 'Kcal', ''],
                ] as const).map(([key, label, unit]) => (
                  <div key={key}>
                    <input
                      type="number"
                      value={(draft[key] as number | undefined) ?? ''}
                      onChange={e => setNumber(key, e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-amber-500/50 tabular-nums"
                      placeholder="0"
                    />
                    <div className="text-[9px] text-zinc-500 text-center mt-0.5 uppercase tracking-wide">
                      {label} {unit && <span className="text-zinc-600">{unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-medium">Notlar</label>
            <textarea
              value={draft.notes ?? ''}
              onChange={e => setDraft({ ...draft, notes: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-500/50"
              rows={2}
              placeholder="Ne yiyeceksin, hangi içecek..."
            />
          </div>

          {draft.anchor !== 'workout' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-zinc-500 uppercase font-medium">Tarifler</label>
                <button
                  onClick={addRecipe}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300"
                >
                  <Plus size={12} />
                  Tarif ekle
                </button>
              </div>
              <div className="space-y-2">
                {recipes.length === 0 && (
                  <p className="text-[11px] text-zinc-600 italic">Henüz tarif yok. YouTube linki, blog yazısı...</p>
                )}
                {recipes.map((r, i) => (
                  <div key={i} className="flex gap-1.5">
                    <input
                      value={r.name}
                      onChange={e => updateRecipe(i, { name: e.target.value })}
                      className="w-1/3 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500/50"
                      placeholder="Ad"
                    />
                    <input
                      value={r.url}
                      onChange={e => updateRecipe(i, { url: e.target.value })}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
                      placeholder="https://..."
                    />
                    <button
                      onClick={() => removeRecipe(i)}
                      className="shrink-0 p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-zinc-800"
                      aria-label="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-1.5 rounded-lg text-zinc-600 hover:text-sky-400 hover:bg-zinc-800"
                        aria-label="Aç"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {canDelete && onDelete && (
              <button
                onClick={() => { onDelete(); onClose() }}
                className="px-3 py-2.5 rounded-lg bg-rose-500/15 text-rose-400 text-sm hover:bg-rose-500/25 transition-colors"
                aria-label="Sil"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={() => {
                onSave(draft)
                onClose()
              }}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function newCustomMeal(): Meal {
  return {
    id: generateId(),
    name: 'Ara öğün',
    emoji: '🍴',
    anchor: 'fixed',
    fixedTime: '15:00',
    recipes: [],
  }
}
