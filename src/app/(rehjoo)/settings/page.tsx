'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/layout/ThemeToggle'
import { logout } from '@/lib/utils/logout'

type ThemeMode = 'auto' | 'dark' | 'light'

const THEME_OPTIONS: { key: ThemeMode; icon: string; label: string; desc: string }[] = [
  { key: 'auto',  icon: '🕐', label: 'هماهنگ با ساعت', desc: 'شب تاریک، روز روشن' },
  { key: 'dark',  icon: '🌙', label: 'خلوت شبانه',     desc: 'همیشه تاریک' },
  { key: 'light', icon: '☀️', label: 'انرژی صبحگاهی',  desc: 'همیشه روشن' },
]

function applyTheme(mode: ThemeMode) {
  const h = new Date().getHours()
  const isDark = mode === 'dark' || (mode === 'auto' && (h >= 20 || h < 6))
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const [theme,        setTheme]        = useState<ThemeMode>('auto')
  const [phone,        setPhone]        = useState('')
  const [notifStreak,  setNotifStreak]  = useState(true)
  const [notifSession, setNotifSession] = useState(true)

  // Privacy settings (loaded from /api/users/me)
  const [isPrivateProfile,    setIsPrivateProfile]    = useState(false)
  const [hideFromLeaderboard, setHideFromLeaderboard] = useState(false)
  const [shareWithCoach,      setShareWithCoach]      = useState(true)
  const [privacyLoaded,       setPrivacyLoaded]       = useState(false)

  useEffect(() => {
    const saved = (localStorage.getItem('mg_theme') ?? 'auto') as ThemeMode
    setTheme(saved)

    const token = localStorage.getItem('mg_token')
    if (token) {
      try {
        const p = JSON.parse(atob(token.split('.')[1]))
        if (p.phone) setPhone(p.phone)
      } catch { /* ignore */ }
    }

    // Load current privacy settings
    fetch('/api/users/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setIsPrivateProfile(json.data.isPrivateProfile)
          setHideFromLeaderboard(json.data.hideFromLeaderboard)
          setShareWithCoach(json.data.shareWithCoach)
        }
      })
      .catch(() => {})
      .finally(() => setPrivacyLoaded(true))
  }, [])

  // Optimistically flip a privacy toggle and persist it. Reverts on failure.
  function savePrivacy(
    patch: Partial<{ isPrivateProfile: boolean; hideFromLeaderboard: boolean; shareWithCoach: boolean }>,
    revert: () => void,
  ) {
    const token = localStorage.getItem('mg_token')
    fetch('/api/users/me', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body:    JSON.stringify(patch),
    })
      .then((r) => r.json())
      .then((json) => { if (!json.success) revert() })
      .catch(() => revert())
  }

  function selectTheme(mode: ThemeMode) {
    setTheme(mode)
    applyTheme(mode)
    localStorage.setItem('mg_theme', mode)
    const token = localStorage.getItem('mg_token')
    if (token) {
      fetch('/api/user/theme', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ theme: mode }),
      }).catch(() => {})
    }
  }

  function handleLogout() {
    logout()
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
            style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)' }}
          >
            ›
          </button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>⚙️ تنظیمات</h1>
        </div>
        <ThemeToggle compact />
      </div>

      {/* Theme section */}
      <div className="mb-5">
        <p className="text-xs font-semibold mb-3 px-1" style={{ color: 'var(--content-secondary)' }}>
          ظاهر برنامه
        </p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border-color)' }}
        >
          {THEME_OPTIONS.map((opt, i) => (
            <button
              key={opt.key}
              onClick={() => selectTheme(opt.key)}
              className="w-full flex items-center gap-4 p-4 text-right transition-all"
              style={{
                background:  theme === opt.key ? 'rgba(16,185,129,0.06)' : 'var(--surface-card)',
                borderBottom: i < THEME_OPTIONS.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}
            >
              <span className="text-2xl flex-shrink-0">{opt.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
                  {opt.label}
                </p>
                <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{opt.desc}</p>
              </div>
              <div
                className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                style={{ borderColor: theme === opt.key ? '#10B981' : 'var(--content-tertiary)' }}
              >
                {theme === opt.key && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications (placeholder) */}
      <div className="mb-5">
        <p className="text-xs font-semibold mb-3 px-1" style={{ color: 'var(--content-secondary)' }}>
          یادآوری‌ها
        </p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border-color)' }}
        >
          {[
            { key: 'streak', label: 'یادآور روزانه', desc: 'ثبت حال و عادت‌های روزانه', value: notifStreak, set: setNotifStreak },
            { key: 'session', label: 'یادآور جلسه', desc: '۳۰ دقیقه قبل از شروع جلسه', value: notifSession, set: setNotifSession },
          ].map((item, i, arr) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4"
              style={{
                background:   'var(--surface-card)',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{item.desc}</p>
              </div>
              <button
                onClick={() => item.set(!item.value)}
                className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
                style={{ background: item.value ? '#10B981' : 'var(--surface-secondary)' }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                  style={{ right: item.value ? '2px' : 'auto', left: item.value ? 'auto' : '2px' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="mb-5">
        <p className="text-xs font-semibold mb-3 px-1" style={{ color: 'var(--content-secondary)' }}>
          حریم خصوصی
        </p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border-color)', opacity: privacyLoaded ? 1 : 0.5 }}
        >
          {[
            {
              key:   'isPrivateProfile',
              label: 'پروفایل خصوصی',
              desc:  'نامت به‌جای نمایش، «یک هم‌سفر» دیده می‌شود',
              value: isPrivateProfile,
              on:    () => { const v = !isPrivateProfile; setIsPrivateProfile(v); savePrivacy({ isPrivateProfile: v }, () => setIsPrivateProfile(!v)) },
            },
            {
              key:   'hideFromLeaderboard',
              label: 'نمایش فعالیت‌ها',
              desc:  'مخفی‌شدن از جدول‌های امتیاز و فهرست شرکت‌کنندگان چالش‌ها',
              value: hideFromLeaderboard,
              on:    () => { const v = !hideFromLeaderboard; setHideFromLeaderboard(v); savePrivacy({ hideFromLeaderboard: v }, () => setHideFromLeaderboard(!v)) },
            },
            {
              key:   'shareWithCoach',
              label: 'اشتراک با کوچ',
              desc:  'کوچت می‌تواند تاریخچه حال، عادت‌ها و دفترچه را ببیند',
              value: shareWithCoach,
              on:    () => { const v = !shareWithCoach; setShareWithCoach(v); savePrivacy({ shareWithCoach: v }, () => setShareWithCoach(!v)) },
            },
          ].map((item, i, arr) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 gap-3"
              style={{
                background:   'var(--surface-card)',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{item.desc}</p>
              </div>
              <button
                onClick={item.on}
                disabled={!privacyLoaded}
                aria-label={item.label}
                className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
                style={{ background: item.value ? '#10B981' : 'var(--surface-secondary)' }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                  style={{ right: item.value ? '2px' : 'auto', left: item.value ? 'auto' : '2px' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="mb-5">
        <p className="text-xs font-semibold mb-3 px-1" style={{ color: 'var(--content-secondary)' }}>
          حساب کاربری
        </p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border-color)' }}
        >
          {phone ? (
            <div
              className="flex items-center justify-between p-4"
              style={{ background: 'var(--surface-card)' }}
            >
              <span className="text-sm" style={{ color: 'var(--content-secondary)' }}>شماره موبایل</span>
              <span className="text-sm font-medium" style={{ color: 'var(--content-primary)', direction: 'ltr' }}>
                {phone}
              </span>
            </div>
          ) : (
            <div className="p-4" style={{ background: 'var(--surface-card)' }}>
              <span className="text-sm" style={{ color: 'var(--content-tertiary)' }}>حساب کاربری Mindgo</span>
            </div>
          )}
        </div>
      </div>

      {/* Logout — prominent, full-width */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 rounded-2xl p-4 mb-6 text-sm font-bold transition-all active:scale-[0.99]"
        style={{
          background: 'rgba(239,68,68,0.08)',
          color: '#EF4444',
          border: '1px solid rgba(239,68,68,0.3)',
        }}
      >
        <span className="text-base">🚪</span>
        خروج از حساب کاربری
      </button>

      {/* App version */}
      <p className="text-center text-xs" style={{ color: 'var(--content-tertiary)' }}>
        Mindgo نسخه ۰.۱.۰ — ذهنت رو به حرکت درآر
      </p>
    </div>
  )
}
