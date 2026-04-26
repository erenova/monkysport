'use client'

import { useState } from 'react'
import { Food, Meal } from '@/lib/types'
import { ScheduledMeal } from '@/lib/schedule'
import { ChevronDown, Pencil, ExternalLink, Play, FileText, Sparkles, Check } from 'lucide-react'
import { cn, getYouTubeEmbedUrl } from '@/lib/utils'

interface MealCardProps {
  meal: ScheduledMeal
  foods: Food[]
  isPast: boolean
  isNext: boolean
  onEdit: (meal: Meal) => void
}

function youtubeThumb(url: string): string | null {
  const embed = getYouTubeEmbedUrl(url)
  if (!embed) return null
  const match = embed.match(/embed\/([^?&]+)/)
  return match ? `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg` : null
}

function buildRecipePrompt(meal: ScheduledMeal, foods: Food[]): string {
  const lines: string[] = []
  lines.push('# Bağlam')
  lines.push('Bu öğün **temiz bulk** (clean bulk) sürecinin parçası — kontrollü kalori fazlası ile yağsız kas kazanmak hedefleniyor.')
  lines.push('Öncelikler: yüksek protein, kompleks karbonhidratlar, sağlıklı yağlar, az işlenmiş gerçek yiyecekler.')
  lines.push('Kaçınılacaklar: aşırı şeker, kızartma, trans yağ, gereksiz boş kalori, ağır işlenmiş ürünler.')
  lines.push('Tüm tarif sindirimi kolay, mikro besin açısından zengin ve sürdürülebilir olmalı.')
  lines.push('')
  lines.push(`# Görev`)
  lines.push(`Aşağıdaki malzemelerle "${meal.name}" öğünü için pratik, sağlıklı bir tarif hazırla.`)
  lines.push('')
  lines.push('# Hedefler')
  lines.push(`- Saat: ${meal.resolvedTime}`)
  if (meal.computedMacros.calories) lines.push(`- Makro hedefi: ${meal.computedMacros.calories} kcal · P${meal.computedMacros.protein} K${meal.computedMacros.carbs} Y${meal.computedMacros.fat}`)
  if (meal.notes) lines.push(`- Öğün notu: ${meal.notes}`)
  lines.push('')
  lines.push('# Malzemeler')
  if (meal.foods && meal.foods.length > 0) {
    for (const ref of meal.foods) {
      const food = foods.find(f => f.id === ref.foodId)
      if (!food) {
        lines.push(`- ${ref.amount} ${ref.foodId} (tanımsız)`)
        continue
      }
      const factor = ref.amount / food.baseAmount
      const kcal = Math.round(food.calories * factor)
      const p = Math.round(food.protein * factor)
      const k = Math.round(food.carbs * factor)
      const y = Math.round(food.fat * factor)
      lines.push(`- ${food.name}: ${ref.amount} ${food.unit} (${kcal} kcal · P${p} K${k} Y${y})`)
    }
  } else {
    lines.push('- (malzeme listesi boş)')
  }
  lines.push('')
  lines.push('# İstediklerim')
  lines.push('1. 1-2 cümlelik tarif özeti (neden temiz bulk için iyi olduğunu kısaca belirt)')
  lines.push('2. Adım adım hazırlanış (numaralı, kısa cümleler)')
  lines.push('3. Pişirme süresi ve toplam hazırlık süresi')
  lines.push('4. Sağlıklı pişirme yöntemi önerisi (zeytinyağı, ızgara, fırın vb. — kızartma değil)')
  lines.push('5. Lezzet artırıcı baharat/sos önerisi (sodyumu kontrollü, şekersiz)')
  lines.push('6. Varsa makroyu bozmadan benzer alternatif kombinasyonlar')
  lines.push('')
  lines.push('Türkçe yaz. Kısa, net ve uygulanabilir tut. Süslü dil kullanma.')
  return lines.join('\n')
}

export function MealCard({ meal, foods, isPast, isNext, onEdit }: MealCardProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copyRecipePrompt() {
    try {
      await navigator.clipboard.writeText(buildRecipePrompt(meal, foods))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard unavailable
    }
  }
  const isWorkout = meal.anchor === 'workout'
  const macros = meal.computedMacros
  const hasMacros = macros.calories > 0 || macros.protein > 0
  const hasDetails = !!meal.notes || (meal.foods?.length ?? 0) > 0 || (meal.recipes?.length ?? 0) > 0

  return (
    <div
      className={cn(
        'relative rounded-2xl border transition-colors overflow-hidden',
        isWorkout
          ? 'bg-amber-500/10 border-amber-500/30'
          : isNext
            ? 'bg-zinc-900 border-emerald-500/30'
            : 'bg-zinc-900 border-zinc-800/50',
        isPast && !isNext && 'opacity-50',
      )}
    >
      <button
        onClick={() => !isWorkout && hasDetails && setOpen(o => !o)}
        disabled={isWorkout || !hasDetails}
        className="w-full text-left flex items-stretch disabled:cursor-default"
      >
        <div className={cn(
          'flex flex-col items-center justify-center px-3 py-3 border-r min-w-[68px]',
          isWorkout ? 'border-amber-500/20 bg-amber-500/5' : 'border-zinc-800/50',
        )}>
          <span className="text-base mb-0.5">{meal.emoji}</span>
          <span className={cn(
            'text-sm font-bold tabular-nums leading-none',
            isWorkout && 'text-amber-300',
            isNext && !isWorkout && 'text-emerald-300',
          )}>
            {meal.resolvedTime}
          </span>
        </div>

        <div className="flex-1 px-3 py-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className={cn(
                'font-semibold text-sm leading-tight',
                isWorkout && 'text-amber-300 uppercase tracking-wider',
              )}>
                {meal.name}
              </div>
              {!isWorkout && hasMacros && (
                <div className="flex flex-wrap gap-1 mt-1.5 text-[10px] tabular-nums">
                  {macros.calories ? <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">{macros.calories} kcal</span> : null}
                  {macros.protein ? <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400">P {macros.protein}</span> : null}
                  {macros.carbs ? <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400">K {macros.carbs}</span> : null}
                  {macros.fat ? <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400">Y {macros.fat}</span> : null}
                </div>
              )}
              {!isWorkout && !hasMacros && meal.notes && (
                <div className="text-[11px] text-zinc-500 leading-snug mt-0.5 line-clamp-1">
                  {meal.notes}
                </div>
              )}
            </div>
            {!isWorkout && hasDetails && (
              <ChevronDown
                size={16}
                className={cn(
                  'shrink-0 text-zinc-500 transition-transform mt-0.5',
                  open && 'rotate-180',
                )}
              />
            )}
          </div>
        </div>
      </button>

      {open && hasDetails && (
        <div className="border-t border-zinc-800/60 px-4 py-3 space-y-3 bg-zinc-950/40">
          {meal.notes && (
            <div className="flex gap-2 text-xs text-zinc-300 leading-relaxed">
              <FileText size={13} className="shrink-0 mt-0.5 text-zinc-500" />
              <p>{meal.notes}</p>
            </div>
          )}

          {meal.foods && meal.foods.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">İçindekiler</div>
              <div className="space-y-1">
                {meal.foods.map((ref, i) => {
                  const food = foods.find(f => f.id === ref.foodId)
                  if (!food) {
                    return (
                      <div key={i} className="flex items-center justify-between gap-2 text-[11px] text-rose-400 bg-rose-500/10 rounded-lg px-2 py-1.5">
                        <span>? {ref.foodId}</span>
                        <span className="text-zinc-500">tanımsız</span>
                      </div>
                    )
                  }
                  const factor = ref.amount / food.baseAmount
                  const kcal = Math.round(food.calories * factor)
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 text-[11px] bg-zinc-900/60 rounded-lg px-2.5 py-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-zinc-200 font-medium truncate">{food.name}</div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2 tabular-nums">
                        <span className="text-zinc-400">{ref.amount} {food.unit}</span>
                        <span className="text-amber-400/70">{kcal} kcal</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {meal.recipes && meal.recipes.filter(r => r.url).length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Tarifler</div>
              <div className="grid grid-cols-2 gap-2">
                {meal.recipes.filter(r => r.url).map((r, i) => {
                  const thumb = youtubeThumb(r.url)
                  return (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-sky-500/50 transition-colors"
                    >
                      {thumb ? (
                        <div className="relative aspect-video bg-zinc-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumb} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-rose-600/90 flex items-center justify-center">
                              <Play size={16} className="text-white ml-0.5" fill="white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-zinc-800/60 flex items-center justify-center">
                          <ExternalLink size={20} className="text-sky-400" />
                        </div>
                      )}
                      <div className="px-2 py-1.5">
                        <div className="text-[11px] font-medium text-zinc-200 truncate">{r.name || 'Tarif'}</div>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-1.5">
            <button
              onClick={copyRecipePrompt}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                copied
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25',
              )}
            >
              {copied ? (
                <>
                  <Check size={12} strokeWidth={3} />
                  Kopyalandı — AI&apos;ya yapıştır
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  Tarif için AI&apos;ya hazırla
                </>
              )}
            </button>
            <button
              onClick={() => onEdit(meal)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800/60 text-zinc-400 text-xs hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              aria-label="Düzenle"
            >
              <Pencil size={12} />
            </button>
          </div>
        </div>
      )}

      {isNext && !isPast && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400" />
      )}
    </div>
  )
}
