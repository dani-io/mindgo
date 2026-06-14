'use client'

import { useEffect, useState } from 'react'

type ThemeMode = 'auto' | 'dark' | 'light'

function getAutoIsDark() {
  const h = new Date().getHours()
  return h >= 20 || h < 6
}

function applyTheme(mode: ThemeMode) {
  const isDark = mode === 'dark' || (mode === 'auto' && getAutoIsDark())
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

interface ThemeToggleProps {
  compact?: boolean
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [mode,   setMode]   = useState<ThemeMode>('auto')
  const [isDark, setIsDark] = useState(false)
  const [ready,  setReady]  = useState(false)

  useEffect(() => {
    const saved = (localStorage.getItem('mg_theme') ?? 'auto') as ThemeMode
    setMode(saved)
    setIsDark(saved === 'dark' || (saved === 'auto' && getAutoIsDark()))
    setReady(true)
  }, [])

  function cycle() {
    const next: ThemeMode = mode === 'auto' ? 'dark' : mode === 'dark' ? 'light' : 'auto'
    setMode(next)
    const dark = next === 'dark' || (next === 'auto' && getAutoIsDark())
    setIsDark(dark)
    applyTheme(next)
    localStorage.setItem('mg_theme', next)
    // Persist to server (best-effort)
    const token = localStorage.getItem('mg_token')
    if (token) {
      fetch('/api/user/theme', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ theme: next }),
      }).catch(() => {})
    }
  }

  if (!ready) return null

  const icon  = mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '🕐'
  const label = mode === 'dark' ? 'شب' : mode === 'light' ? 'روز' : 'اتو'

  if (compact) {
    return (
      <button
        onClick={cycle}
        className="w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all active:scale-90"
        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)' }}
        title={`تم: ${label}`}
      >
        {icon}
      </button>
    )
  }

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
      style={{
        background: 'var(--surface-secondary)',
        color:      'var(--content-secondary)',
        border:     '1px solid var(--border-color)',
      }}
      title="تغییر تم"
    >
      <span>{icon}</span>
      <span>{isDark ? 'خلوت شبانه' : 'انرژی صبحگاهی'}</span>
    </button>
  )
}
