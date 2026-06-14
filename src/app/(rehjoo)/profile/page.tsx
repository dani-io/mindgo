'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/layout/ThemeToggle'
import ImageCropper from '@/components/ui/ImageCropper'

interface ProfileData {
  id:          string
  name:        string | null
  phone:       string
  avatarUrl:   string | null
  xpPoints:    number
  level:       number
  streakCount: number
  badges:      unknown
  stats: {
    totalJournalEntries: number
    totalGoals:          number
    completedGoals:      number
    totalHabits:         number
    totalSessions:       number
    totalMoodLogs:       number
  }
}

const ALL_BADGES = [
  { id: 'kitabkhan', emoji: '📚', label: 'کتابخوان',   desc: '۱۰ یادداشت ثبت کردی' },
  { id: 'sahrkheez', emoji: '🌅', label: 'سحرخیز',    desc: '۷ روز متوالی عادت' },
  { id: 'zehnaagah', emoji: '🧘', label: 'ذهن‌آگاه',  desc: '۱۰ بار حالت رو ثبت کردی' },
  { id: 'hadafmand', emoji: '🎯', label: 'هدفمند',     desc: 'اولین هدفت رو تکمیل کردی' },
  { id: 'hamsohbat', emoji: '💬', label: 'هم‌صحبت',    desc: 'اولین پیامت رو فرستادی' },
  { id: 'aatashin',  emoji: '🔥', label: 'آتشین',      desc: '۳۰ روز متوالی عادت' },
]

function toPersian(s: string | number) {
  return String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function parseBadges(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[]
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
  return []
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile,       setProfile]       = useState<ProfileData | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [showCropper,   setShowCropper]   = useState(false)
  const [savingAvatar,  setSavingAvatar]  = useState(false)

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('mg_token')
      if (!token) { router.push('/login'); return }
      try {
        const res  = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (json.success) setProfile(json.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function updateAvatar(url: string) {
    setSavingAvatar(true)
    const token = localStorage.getItem('mg_token')
    try {
      const res  = await fetch('/api/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    JSON.stringify({ avatarUrl: url }),
      })
      const json = await res.json()
      if (json.success && profile) setProfile({ ...profile, avatarUrl: url })
    } finally {
      setSavingAvatar(false)
      setShowCropper(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--surface-primary)' }}>
        <div className="w-12 h-12 rounded-full animate-pulse" style={{ background: 'var(--surface-secondary)' }} />
      </div>
    )
  }

  if (!profile) return null

  const earnedBadges   = parseBadges(profile.badges)
  const xpInLevel      = profile.xpPoints % 100
  const xpToNext       = 100 - xpInLevel
  const initials       = profile.name ? profile.name.charAt(0) : '?'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
          style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)' }}
        >
          ›
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>داشبورد رشد</h1>
        <ThemeToggle compact />
      </div>

      {/* Avatar + Level Card */}
      <div
        className="rounded-2xl p-6 mb-4 text-center"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Avatar */}
        <button
          onClick={() => setShowCropper(true)}
          className="relative w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3 group"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
          title="تغییر عکس پروفایل"
        >
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            <span className="text-white text-sm">📷</span>
          </div>
        </button>

        {/* Avatar cropper modal */}
        {showCropper && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', direction: 'rtl' }}
            onClick={() => setShowCropper(false)}
          >
            <div
              className="rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4"
              style={{ background: 'var(--surface-card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base" style={{ color: 'var(--content-primary)' }}>عکس پروفایل</h3>
                <button onClick={() => setShowCropper(false)} style={{ color: 'var(--content-tertiary)' }}>✕</button>
              </div>
              <div className="flex justify-center">
                <ImageCropper
                  folder="avatars"
                  size={220}
                  onUploadComplete={(url) => { if (url) updateAvatar(url) }}
                />
              </div>
              {savingAvatar && (
                <p className="text-sm text-center" style={{ color: 'var(--content-secondary)' }}>در حال ذخیره...</p>
              )}
            </div>
          </div>
        )}

        <p className="font-bold text-lg mb-1" style={{ color: 'var(--content-primary)' }}>
          {profile.name ?? 'رهجو'}
        </p>

        {/* Level badge */}
        <span
          className="inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full mb-4"
          style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
        >
          ⭐ سطح {toPersian(profile.level)}
        </span>

        {/* XP progress */}
        <div className="text-right">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--content-tertiary)' }}>
            <span>{toPersian(xpInLevel)} امتیاز</span>
            <span>{toPersian(xpToNext)} تا سطح بعد</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpInLevel}%`, background: 'linear-gradient(90deg, #10B981, #F59E0B)' }}
            />
          </div>
          <p className="text-xs mt-1 text-center" style={{ color: 'var(--content-tertiary)' }}>
            {toPersian(profile.xpPoints)} XP کل
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>آمار کلی</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'جلسات',     value: toPersian(profile.stats.totalSessions),        icon: '🎙️' },
            { label: 'یادداشت‌ها', value: toPersian(profile.stats.totalJournalEntries),  icon: '📓' },
            { label: '🔥 زنجیره', value: `${toPersian(profile.streakCount)} روز`,        icon: null },
            { label: 'اهداف',     value: `${toPersian(profile.stats.completedGoals)}/${toPersian(profile.stats.totalGoals)}`, icon: '🎯' },
            { label: 'عادت‌ها',   value: toPersian(profile.stats.totalHabits),           icon: '✅' },
            { label: 'حال‌نگاری', value: toPersian(profile.stats.totalMoodLogs),         icon: '😊' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="text-center">
              {icon && <p className="text-xl mb-1">{icon}</p>}
              <p className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>{value}</p>
              <p className="text-[10px]" style={{ color: 'var(--content-tertiary)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-xs font-semibold mb-4" style={{ color: 'var(--content-secondary)' }}>
          مدال‌ها و دستاوردها
        </p>
        <div className="grid grid-cols-3 gap-3">
          {ALL_BADGES.map((badge) => {
            const earned = earnedBadges.includes(badge.id)
            return (
              <div
                key={badge.id}
                className="rounded-xl p-3 text-center"
                style={{
                  background: earned ? 'rgba(139,92,246,0.08)' : 'var(--surface-secondary)',
                  border:     `1.5px solid ${earned ? 'rgba(139,92,246,0.4)' : 'var(--border-color)'}`,
                  opacity:    earned ? 1 : 0.45,
                }}
              >
                <p className="text-2xl mb-1">{badge.emoji}</p>
                <p className="text-xs font-bold mb-0.5" style={{ color: earned ? '#8B5CF6' : 'var(--content-tertiary)' }}>
                  {badge.label}
                </p>
                <p className="text-[9px] leading-tight" style={{ color: 'var(--content-tertiary)' }}>
                  {badge.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-2">
        <Link
          href="/growth-room"
          className="flex items-center justify-between rounded-xl p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
            🌱 اتاق رشد
          </span>
          <span style={{ color: 'var(--content-tertiary)' }}>›</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center justify-between rounded-xl p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
            ⚙️ تنظیمات
          </span>
          <span style={{ color: 'var(--content-tertiary)' }}>›</span>
        </Link>
      </div>
    </div>
  )
}
