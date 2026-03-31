'use client'

import { useRef, useEffect, useState } from 'react'
import { WorkoutPlan, AppData } from '@/lib/types'
import { exportPlan, importPlan, exportAllData } from '@/lib/storage'
import { X, Download, Upload, RotateCcw, Database, Globe, RefreshCw, Check } from 'lucide-react'

interface PlanManagerProps {
  plan: WorkoutPlan
  allData: AppData
  remoteUrl: string
  onImport: (plan: WorkoutPlan) => void
  onReset: () => void
  onRemoteUrlChange: (url: string) => void
  onSync: () => Promise<void>
  onClose: () => void
}

export function PlanManager({
  plan, allData, remoteUrl, onImport, onReset, onRemoteUrlChange, onSync, onClose,
}: PlanManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlDraft, setUrlDraft] = useState(remoteUrl)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<'ok' | 'err' | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importPlan(file)
      onImport(imported)
      onClose()
    } catch (err) {
      alert('Plan yüklenemedi: ' + (err as Error).message)
    }
  }

  function handleSaveUrl() {
    onRemoteUrlChange(urlDraft.trim())
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      await onSync()
      setSyncResult('ok')
    } catch {
      setSyncResult('err')
    } finally {
      setSyncing(false)
    }
  }

  const actions = [
    {
      icon: <Download size={20} className="text-amber-400" />,
      title: 'Planı Dışa Aktar',
      subtitle: 'JSON formatında indir',
      onClick: () => exportPlan(plan),
    },
    {
      icon: <Database size={20} className="text-emerald-400" />,
      title: 'Tüm Veriyi Yedekle',
      subtitle: 'Plan + antrenman logları',
      onClick: () => exportAllData(allData),
    },
    {
      icon: <Upload size={20} className="text-sky-400" />,
      title: 'Plan İçe Aktar',
      subtitle: 'JSON dosyası yükle',
      onClick: () => fileInputRef.current?.click(),
    },
    {
      icon: <RotateCcw size={20} className="text-red-400" />,
      title: 'Varsayılana Dön',
      subtitle: 'Orijinal planı geri yükle',
      onClick: () => {
        if (confirm('Varsayılan plana dönmek istediğine emin misin? Mevcut plan silinecek.')) {
          onReset()
          onClose()
        }
      },
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-800 overflow-hidden max-h-[90dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="font-semibold">Plan Yönetimi</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={16} className="text-violet-400 shrink-0" />
            <p className="text-xs font-medium text-zinc-300">Uzak Plan Senkronu</p>
          </div>
          <p className="text-[11px] text-zinc-500 mb-2.5">
            GitHub Gist raw URL gir, PC&apos;de düzenle &rarr; telefonda senkronla.
          </p>
          <div className="flex gap-2">
            <input
              value={urlDraft}
              onChange={e => setUrlDraft(e.target.value)}
              placeholder="https://gist.githubusercontent.com/..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/50 placeholder:text-zinc-600"
            />
            <button
              onClick={handleSaveUrl}
              disabled={urlDraft.trim() === remoteUrl}
              className="px-3 py-2 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-medium hover:bg-violet-500/25 transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              Kaydet
            </button>
          </div>
          {remoteUrl && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-medium hover:bg-violet-500/25 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Senkronlanıyor...' : 'Şimdi Senkronla'}
              {syncResult === 'ok' && <Check size={14} className="text-emerald-400" />}
            </button>
          )}
          {syncResult === 'err' && (
            <p className="text-red-400 text-[11px] mt-1.5">Senkron başarısız. URL&apos;yi kontrol et.</p>
          )}
        </div>

        <div className="p-3 space-y-1.5">
          {actions.map((action) => (
            <button
              key={action.title}
              onClick={action.onClick}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-zinc-800 transition-colors text-left"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                {action.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-zinc-500">{action.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 pb-4 pt-2">
          <p className="text-[10px] text-zinc-600 text-center">
            JSON formatında plan dosyası ile başka biri de kendi planını yükleyebilir
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
    </div>
  )
}
