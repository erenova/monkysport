'use client'

import { useRef, useEffect, useState } from 'react'
import { WorkoutPlan, AppData } from '@/lib/types'
import { exportPlan, importPlan, exportAllData } from '@/lib/storage'
import { extractGistId } from '@/lib/utils'
import {
  X, Download, Upload, RotateCcw, Database,
  Lock, Unlock, RefreshCw, ArrowUpFromLine, Link, KeyRound,
} from 'lucide-react'

interface PlanManagerProps {
  plan: WorkoutPlan
  allData: AppData
  isAdmin: boolean
  gistId: string
  githubToken: string
  onLogin: (password: string) => boolean
  onLogout: () => void
  onImport: (plan: WorkoutPlan) => void
  onReset: () => void
  onSettingsChange: (gistId: string, githubToken: string) => void
  onSync: () => Promise<void>
  onPush: () => Promise<void>
  onClose: () => void
}

export function PlanManager({
  plan, allData, isAdmin, gistId, githubToken,
  onLogin, onLogout, onImport, onReset, onSettingsChange, onSync, onPush, onClose,
}: PlanManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [password, setPassword] = useState('')
  const [wrongPw, setWrongPw] = useState(false)
  const [gistDraft, setGistDraft] = useState(gistId)
  const [tokenDraft, setTokenDraft] = useState(githubToken)
  const [syncing, setSyncing] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

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

  function handleLogin() {
    if (onLogin(password)) {
      setWrongPw(false)
      setPassword('')
    } else {
      setWrongPw(true)
    }
  }

  function handleSaveSettings() {
    onSettingsChange(extractGistId(gistDraft), tokenDraft.trim())
    setStatus({ type: 'ok', msg: 'Ayarlar kaydedildi' })
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
      const imported = await importPlan(file)
      onImport(imported)
      onClose()
    } catch (err) {
      alert('Plan yüklenemedi: ' + (err as Error).message)
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
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-amber-400 hover:bg-zinc-800 transition-colors"
                aria-label="Kilitle"
              >
                <Unlock size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              aria-label="Kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {!isAdmin && (
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} className="text-zinc-500" />
              <p className="text-xs font-medium text-zinc-400">Düzenleme için giriş yap</p>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setWrongPw(false) }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Şifre"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
              />
              <button
                onClick={handleLogin}
                className="px-4 py-2 rounded-lg bg-amber-500/15 text-amber-400 text-sm font-medium hover:bg-amber-500/25 transition-colors"
              >
                Giriş
              </button>
            </div>
            {wrongPw && <p className="text-red-400 text-[11px] mt-1.5">Yanlış şifre</p>}
          </div>
        )}

        {isAdmin && (
          <div className="p-4 border-b border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Link size={14} className="text-violet-400" />
              <p className="text-xs font-medium text-zinc-300">Gist Senkronu</p>
            </div>
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
        )}

        {status && (
          <div className={`mx-4 mt-3 px-3 py-2 rounded-lg text-xs ${
            status.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {status.msg}
          </div>
        )}

        {gistId && !isAdmin && (
          <div className="p-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Senkronlanıyor...' : 'Planı Senkronla'}
            </button>
          </div>
        )}

        <div className="p-3 space-y-1.5">
          {[
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
            ...(isAdmin ? [
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
                  if (confirm('Varsayılan plana dönmek istediğine emin misin?')) {
                    onReset()
                    onClose()
                  }
                },
              },
            ] : []),
          ].map((action) => (
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
