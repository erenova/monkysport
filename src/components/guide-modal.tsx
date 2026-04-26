'use client'

import { useEffect, useState } from 'react'
import { X, Copy, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AI_PROMPT } from '@/data/ai-prompt'

export function GuideModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function copy() {
    try {
      await navigator.clipboard.writeText(AI_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92dvh] flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h2 className="font-bold text-sm">AI Dönüşüm Promptu</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-4 pb-3 space-y-3 border-b border-zinc-800/60">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Bu promptu kopyala, ChatGPT/Claude/Gemini&apos;ye yapıştır ve sonuna kendi antrenman/yemek planını ekle.
            AI, MonkySport&apos;a uyumlu JSON üretir. Çıktıyı{' '}
            <span className="text-sky-400 font-medium">Ayarlar → JSON Yapıştır</span>
            {' '}kutusuna yapıştır.
          </p>
          <button
            onClick={copy}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all',
              copied
                ? 'bg-emerald-500 text-black'
                : 'bg-amber-500 text-black hover:bg-amber-400 active:scale-[0.98] shadow-lg shadow-amber-500/20',
            )}
          >
            {copied ? (
              <>
                <Check size={16} strokeWidth={3} />
                Kopyalandı — AI&apos;ya yapıştır
              </>
            ) : (
              <>
                <Copy size={16} />
                Promptu Kopyala
              </>
            )}
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-1.5">Önizleme</div>
          <pre className="text-[10px] leading-relaxed text-zinc-400 bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3 overflow-x-auto font-mono whitespace-pre-wrap">
            {AI_PROMPT}
          </pre>
        </div>
      </div>
    </div>
  )
}
