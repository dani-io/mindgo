'use client'

import { useState, useEffect } from 'react'
import jalaali from 'jalaali-js'

// ── Utilities ─────────────────────────────────────────────

function toPersian(n: number): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

const JALALI_MONTHS = [
  'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
  'مهر','آبان','آذر','دی','بهمن','اسفند',
]

function toJalaliString(date: Date): string {
  const { jy, jm, jd } = jalaali.toJalaali(
    date.getFullYear(), date.getMonth() + 1, date.getDate()
  )
  return `${toPersian(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersian(jy)}`
}

function getGreeting(name: string | null, hour: number): string {
  const display = name ?? 'رهجو'
  if (hour >= 6  && hour < 12) return `صبح به خیر ${display}! آماده‌ای قدم امروزت رو برداری؟`
  if (hour >= 12 && hour < 15) return `ظهر بخیر ${display}! روزت چطوره؟`
  if (hour >= 15 && hour < 20) return `عصر بخیر ${display}! یه نگاه به قدم‌هات بنداز.`
  return `خسته نباشی ${display}، بیا روزت رو جمع‌بندی کنیم.`
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

// ── Types ─────────────────────────────────────────────────

interface Habit {
  id: string
  title: string
  completed: boolean
  isFromCoach: boolean
}

// ── Mock data ─────────────────────────────────────────────

const MOCK_HABITS: Habit[] = [
  { id: '1', title: '۱۰ دقیقه مطالعه کتاب',    completed: false, isFromCoach: false },
  { id: '2', title: 'مدیتیشن صبحگاهی',           completed: true,  isFromCoach: true  },
  { id: '3', title: 'پیاده‌روی ۳۰ دقیقه',       completed: false, isFromCoach: false },
]

const MOCK_SESSION = {
  coachName:   'مریم احمدی',
  specialty:   'لایف کوچینگ',
  date:        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  time:        '۱۸:۳۰',
  canJoin:     false,
}

const MOODS = [
  { type: 'great',   emoji: '😄', label: 'عالی'      },
  { type: 'good',    emoji: '🙂', label: 'خوب'       },
  { type: 'normal',  emoji: '😐', label: 'معمولی'    },
  { type: 'stressed',emoji: '😤', label: 'کلافه'     },
  { type: 'tired',   emoji: '😴', label: 'بی‌انرژی'  },
] as const

// ── Components ────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
      {children}
    </h2>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl p-4 ${className}`}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

export default function DashboardPage() {
  const [userName,       setUserName]       = useState<string | null>(null)
  const [streakCount,    setStreakCount]     = useState(7)
  const [selectedMood,   setSelectedMood]   = useState<string | null>(null)
  const [moodSaved,      setMoodSaved]       = useState(false)
  const [habits,         setHabits]          = useState<Habit[]>(MOCK_HABITS)
  const [hour,           setHour]            = useState(new Date().getHours())

  useEffect(() => {
    const token = localStorage.getItem('mg_token')
    if (token) {
      const p = decodeJwtPayload(token)
      if (p?.name) setUserName(p.name as string)
    }
    setHour(new Date().getHours())
  }, [])

  async function handleMoodSelect(type: string) {
    setSelectedMood(type)
    try {
      await fetch('/api/moods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mg_token')}`,
        },
        body: JSON.stringify({ mood: type }),
      })
    } catch { /* silent — optimistic update already applied */ }
    setMoodSaved(true)
  }

  function toggleHabit(id: string) {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h))
    )
  }

  const completedCount = habits.filter((h) => h.completed).length

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">

      {/* ── Greeting Header ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium" style={{ color: 'var(--content-tertiary)' }}>
            {toJalaliString(new Date())}
          </p>
          {/* Streak badge */}
          <div
            className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
          >
            <span>🔥</span>
            <span>{toPersian(streakCount)} روز</span>
          </div>
        </div>
        <h1
          className="text-xl font-bold leading-snug"
          style={{ color: 'var(--content-primary)' }}
        >
          {getGreeting(userName, hour)}
        </h1>
      </div>

      {/* ── Mood Tracker ── */}
      <div className="mb-6">
        <SectionTitle>امروز چه حسی داری؟</SectionTitle>
        <Card>
          {moodSaved ? (
            <p className="text-center text-sm py-1" style={{ color: '#10B981' }}>
              ✓ حالت ثبت شد — ممنون که به اشتراک گذاشتی 🌱
            </p>
          ) : (
            <div className="flex justify-around">
              {MOODS.map(({ type, emoji, label }) => (
                <button
                  key={type}
                  onClick={() => handleMoodSelect(type)}
                  className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg transition-all active:scale-90"
                  style={{
                    background: selectedMood === type ? 'rgba(16,185,129,0.12)' : 'transparent',
                    border: selectedMood === type ? '1.5px solid #10B981' : '1.5px solid transparent',
                  }}
                >
                  <span className="text-2xl leading-none">{emoji}</span>
                  <span className="text-[10px]" style={{ color: 'var(--content-secondary)' }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Today's Steps ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>قدم‌های امروز من</SectionTitle>
          <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
            {toPersian(completedCount)} از {toPersian(habits.length)} انجام شد
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 rounded-full mb-4 overflow-hidden"
          style={{ background: 'var(--surface-tertiary)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(completedCount / habits.length) * 100}%`,
              background: '#10B981',
            }}
          />
        </div>

        <div className="flex flex-col gap-3">
          {habits.map((habit) => (
            <button
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              className="flex items-center gap-3 rounded-xl p-4 text-right transition-all active:scale-[0.98]"
              style={{
                background: habit.completed ? 'rgba(16,185,129,0.08)' : 'var(--surface-card)',
                border: `1px solid ${habit.completed ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
              }}
            >
              {/* Checkbox */}
              <div
                className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all"
                style={{
                  background:     habit.completed ? '#10B981' : 'transparent',
                  border:         `2px solid ${habit.completed ? '#10B981' : 'var(--content-tertiary)'}`,
                }}
              >
                {habit.completed && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{
                    color:          habit.completed ? 'var(--content-tertiary)' : 'var(--content-primary)',
                    textDecoration: habit.completed ? 'line-through' : 'none',
                  }}
                >
                  {habit.title}
                </p>
                {habit.isFromCoach && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-medium mt-0.5 px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}
                  >
                    🧭 از راه‌بلد
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Next Session ── */}
      <div className="mb-6">
        <SectionTitle>جلسه بعدی من</SectionTitle>
        <Card>
          <div className="flex items-center gap-4">
            {/* Coach avatar */}
            <div
              className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
            >
              {MOCK_SESSION.coachName.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base" style={{ color: 'var(--content-primary)' }}>
                {MOCK_SESSION.coachName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--content-secondary)' }}>
                {MOCK_SESSION.specialty}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>📅</span>
                <span className="text-xs font-medium" style={{ color: 'var(--content-secondary)' }}>
                  {toJalaliString(MOCK_SESSION.date)}
                </span>
                <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>·</span>
                <span className="text-xs font-medium" style={{ color: 'var(--content-secondary)' }}>
                  ساعت {MOCK_SESSION.time}
                </span>
              </div>
            </div>
          </div>

          <button
            disabled={!MOCK_SESSION.canJoin}
            className="w-full mt-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
            style={{
              background:     MOCK_SESSION.canJoin ? '#10B981' : 'var(--surface-tertiary)',
              color:          MOCK_SESSION.canJoin ? '#fff' : 'var(--content-tertiary)',
              cursor:         MOCK_SESSION.canJoin ? 'pointer' : 'not-allowed',
            }}
          >
            {MOCK_SESSION.canJoin ? '🎥 ورود به اتاق گفتگو' : '⏳ ۳۰ دقیقه قبل از جلسه فعال می‌شود'}
          </button>
        </Card>
      </div>

      {/* ── Daily Insight ── */}
      <div className="mb-2">
        <SectionTitle>دوز آگاهی روزانه</SectionTitle>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(139,92,246,0.15)' }}
            >
              🎧
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
                پادکست: چرا عادت‌سازی سخته؟
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
                ۵ دقیقه · توسعه فردی
              </p>
            </div>
          </div>

          {/* Fake audio player */}
          <div
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{ background: 'var(--surface-secondary)' }}
          >
            <button
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: '#8B5CF6' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
                <path d="M3 2l9 5-9 5V2z" />
              </svg>
            </button>
            <div className="flex-1">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--surface-tertiary)' }}
              >
                <div className="h-full w-0 rounded-full" style={{ background: '#8B5CF6' }} />
              </div>
            </div>
            <span className="text-xs font-mono" style={{ color: 'var(--content-tertiary)' }}>
              ۵:۰۰
            </span>
          </div>

          {/* Inspirational quote */}
          <p
            className="text-xs leading-relaxed mt-3 pt-3 text-center"
            style={{
              color: 'var(--content-secondary)',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            «تنها راه انجام کار بزرگ، عشق به کاری است که انجام می‌دهید.» — استیو جابز
          </p>
        </Card>
      </div>

    </div>
  )
}
