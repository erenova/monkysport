'use client'

import { useRef, useEffect, useState } from 'react'
import { WorkoutPlan, AppData } from '@/lib/types'
import { exportPlan, importFile, exportAllData, parseImport, ImportPayload } from '@/lib/storage'
import { extractGistId } from '@/lib/utils'
import {
  X, Download, Upload, RotateCcw, Database,
  RefreshCw, ArrowUpFromLine, Link, KeyRound,
  Copy, FileText, Sparkles,
} from 'lucide-react'

interface PlanManagerProps {
  plan: WorkoutPlan
  allData: AppData
  gistId: string
  githubToken: string
  onImport: (payload: ImportPayload) => void
  onReset: () => void
  onSettingsChange: (gistId: string, githubToken: string) => void
  onSync: () => Promise<void>
  onPush: () => Promise<void>
  onShowGuide: () => void
  onClose: () => void
}

export function PlanManager({
  plan, allData, gistId, githubToken,
  onImport, onReset, onSettingsChange, onSync, onPush, onShowGuide, onClose,
}: PlanManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [gistDraft, setGistDraft] = useState(gistId)
  const [tokenDraft, setTokenDraft] = useState(githubToken)
  const [syncing, setSyncing] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [showTextImport, setShowTextImport] = useState(false)
  const [textImport, setTextImport] = useState('')
  const [showGistSettings, setShowGistSettings] = useState(false)

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

  function handleSaveSettings() {
    onSettingsChange(extractGistId(gistDraft), tokenDraft.trim())
    setStatus({ type: 'ok', msg: 'Ayarlar kaydedildi' })
    setShowGistSettings(false)
  }

  async function handleSync() {
    setSyncing(true)
    setStatus(null)
    try {
      await onSync()
      setStatus({ type: 'ok', msg: 'Plan senkronlandı' })
    } catch {
      setStatus({ type: 'err', msg: 'Senkron başarısız — Gist ID kontrol et' })
    } finally {
      setSyncing(false)
    }
  }

  async function handlePush() {
    setPushing(true)
    setStatus(null)
    try {
      await onPush()
      setStatus({ type: 'ok', msg: 'Gist güncellendi' })
    } catch {
      setStatus({ type: 'err', msg: 'Push başarısız — token veya Gist ID kontrol et' })
    } finally {
      setPushing(false)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const payload = await importFile(file)
      onImport(payload)
      onClose()
    } catch (err) {
      alert('Yüklenemedi: ' + (err as Error).message)
    }
  }

  function handleTextImportSubmit() {
    try {
      const payload = parseImport(textImport.trim())
      onImport(payload)
      setTextImport('')
      setShowTextImport(false)
      onClose()
    } catch (err) {
      setStatus({ type: 'err', msg: (err as Error).message })
    }
  }

  async function copyToClipboard(data: object, label: string) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setStatus({ type: 'ok', msg: `${label} panoya kopyalandı` })
    } catch {
      setStatus({ type: 'err', msg: 'Kopyalama başarısız' })
    }
  }

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

        {/* Gist Sync */}
        <div className="p-4 border-b border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link size={14} className="text-violet-400" />
              <p className="text-xs font-medium text-zinc-300">Gist Senkronu</p>
            </div>
            <button
              onClick={() => setShowGistSettings(!showGistSettings)}
              className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
            >
              {showGistSettings ? 'Gizle' : 'Ayarlar'}
            </button>
          </div>

          {showGistSettings && (
            <div className="space-y-2.5 pb-1">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-medium">Gist URL veya ID</label>
                <input
                  value={gistDraft}
                  onChange={e => setGistDraft(e.target.value)}
                  placeholder="https://gist.github.com/... veya gist ID"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs mt-1 focus:outline-none focus:border-violet-500/50 placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-medium flex items-center gap-1">
                  <KeyRound size={10} />
                  GitHub Token (gist scope)
                </label>
                <input
                  type="password"
                  value={tokenDraft}
                  onChange={e => setTokenDraft(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs mt-1 focus:outline-none focus:border-violet-500/50 placeholder:text-zinc-600"
                />
                <p className="text-[10px] text-zinc-600 mt-1">
                  github.com/settings/tokens &rarr; Generate &rarr; gist scope
                </p>
              </div>
              <button
                onClick={handleSaveSettings}
                className="w-full py-2 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-medium hover:bg-violet-500/25 transition-colors"
              >
                Ayarları Kaydet
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing || !gistId}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors disabled:opacity-30"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Çekiliyor...' : 'Gist\'ten Çek'}
            </button>
            <button
              onClick={handlePush}
              disabled={pushing || !gistId || !githubToken}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-colors disabled:opacity-30"
            >
              <ArrowUpFromLine size={14} className={pushing ? 'animate-bounce' : ''} />
              {pushing ? 'Gönderiliyor...' : 'Gist\'e Gönder'}
            </button>
          </div>
        </div>

        {status && (
          <div className={`mx-4 mt-3 px-3 py-2 rounded-lg text-xs ${
            status.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {status.msg}
          </div>
        )}

        {/* Export / Import */}
        <div className="p-3 space-y-1.5">
          <p className="text-[10px] text-zinc-500 uppercase font-medium px-1 pt-1">Dışa Aktar</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => exportPlan(plan)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
            >
              <Download size={16} className="text-amber-400" />
              <span>İndir</span>
            </button>
            <button
              onClick={() => copyToClipboard(plan, 'Plan')}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
            >
              <Copy size={16} className="text-amber-400" />
              <span>Kopyala</span>
            </button>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => exportAllData(allData)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs text-zinc-400"
            >
              <Database size={14} className="text-emerald-400" />
              <span>Tüm Veriyi İndir</span>
            </button>
            <button
              onClick={() => copyToClipboard(allData, 'Tüm veri')}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs text-zinc-400"
            >
              <Copy size={14} className="text-emerald-400" />
              <span>Tüm Veriyi Kopyala</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-1 pt-3">
            <p className="text-[10px] text-zinc-500 uppercase font-medium">İçe Aktar</p>
            <button
              onClick={onShowGuide}
              className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors font-semibold"
            >
              <Sparkles size={11} />
              AI Promptu
            </button>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
            >
              <Upload size={16} className="text-sky-400" />
              <span>Dosyadan</span>
            </button>
            <button
              onClick={() => setShowTextImport(!showTextImport)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
            >
              <FileText size={16} className="text-sky-400" />
              <span>JSON Yapıştır</span>
            </button>
          </div>
          {showTextImport && (
            <div className="space-y-2 pt-1">
              <textarea
                value={textImport}
                onChange={e => setTextImport(e.target.value)}
                placeholder='{"id": "...", "name": "...", "schedule": [...]}'
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:border-sky-500/50 placeholder:text-zinc-600"
                rows={6}
              />
              <button
                onClick={handleTextImportSubmit}
                disabled={!textImport.trim()}
                className="w-full py-2.5 rounded-lg bg-sky-500/15 text-sky-400 text-xs font-medium hover:bg-sky-500/25 transition-colors disabled:opacity-30"
              >
                Planı Yükle
              </button>
            </div>
          )}

          <button
            onClick={() => {
              if (confirm('Varsayılan plana dönmek istediğine emin misin?')) {
                onReset()
                onClose()
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-zinc-800 transition-colors text-left mt-2"
          >
            <div className="shrink-0 w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
              <RotateCcw size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Varsayılana Dön</p>
              <p className="text-xs text-zinc-500">Orijinal planı geri yükle</p>
            </div>
          </button>
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
