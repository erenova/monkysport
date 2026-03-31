'use client'

import { useEffect } from 'react'
import { Exercise } from '@/lib/types'
import { getYouTubeEmbedUrl, getYouTubeSearchUrl } from '@/lib/utils'
import { X, ExternalLink } from 'lucide-react'

interface VideoModalProps {
  exercise: Exercise | null
  onClose: () => void
}

export function VideoModal({ exercise, onClose }: VideoModalProps) {
  useEffect(() => {
    if (!exercise) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [exercise, onClose])

  if (!exercise) return null

  const embedUrl = exercise.videoUrl ? getYouTubeEmbedUrl(exercise.videoUrl) : null
  const isDirectVideo = exercise.videoUrl && !embedUrl
  const searchUrl = getYouTubeSearchUrl(exercise.name)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-lg text-zinc-400 hover:text-white transition-colors"
          aria-label="Kapat"
        >
          <X size={24} />
        </button>

        <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="font-semibold text-sm">{exercise.name}</h3>
            {exercise.targetMuscles.length > 0 && (
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {exercise.targetMuscles.join(' · ')}
              </p>
            )}
          </div>

          {embedUrl ? (
            <div className="aspect-video">
              <iframe
                src={`${embedUrl}?autoplay=1&rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : isDirectVideo ? (
            <div className="aspect-video bg-black">
              <video src={exercise.videoUrl} controls autoPlay className="w-full h-full" />
            </div>
          ) : (
            <div className="px-6 py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
                <ExternalLink size={24} className="text-zinc-500" />
              </div>
              <div>
                <p className="text-zinc-300 text-sm font-medium">Video henüz eklenmemiş</p>
                <p className="text-zinc-500 text-xs mt-1">
                  YouTube&apos;da aratabilir veya kart düzenlemeden video ekleyebilirsin
                </p>
              </div>
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-medium hover:bg-amber-400 transition-colors"
              >
                <ExternalLink size={16} />
                YouTube&apos;da Ara
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
