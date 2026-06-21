'use client'

import { useState, useEffect, useCallback } from 'react'
import jalaali from 'jalaali-js'

// ── Utilities ─────────────────────────────────────────────

function toPersian(n: number | string): string {
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

function minutesUntilSession(sessionDate: string, sessionTime: string): number {
  const d = new Date(sessionDate)
  const [h, m] = sessionTime.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return (d.getTime() - Date.now()) / 60000
}

// ── Types ─────────────────────────────────────────────────

interface Habit {
  id:          string
  title:       string
  completed:   boolean
  isFromCoach: boolean
}

interface NextSession {
  bookingId:   string
  status:      string
  sessionDate: string
  sessionTime: string
  coach: {
    id:       string
    userId:   string
    name:     string
    shortBio: string | null
  }
}

// ── Constants ─────────────────────────────────────────────

const MOODS = [
  { type: 'great',    emoji: '😄', label: 'عالی'     },
  { type: 'good',     emoji: '🙂', label: 'خوب'      },
  { type: 'normal',   emoji: '😐', label: 'معمولی'   },
  { type: 'stressed', emoji: '😤', label: 'کلافه'    },
  { type: 'tired',    emoji: '😴', label: 'بی‌انرژی' },
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
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
    >
      {children}
    </div>
  )
}

function SkeletonCard({ height = 80 }: { height?: number }) {
  return (
    <div
      className="rounded-xl animate-pulse"
      style={{ height, background: 'var(--surface-secondary)' }}
    />
  )
}

// ── Page ──────────────────────────────────────────────────

export default function DashboardPage() {
  const [userName,     setUserName]     = useState<string | null>(null)
  const [streakCount,  setStreakCount]  = useState(0)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [moodSaved,    setMoodSaved]    = useState(false)
  const [habits,       setHabits]       = useState<Habit[]>([])
  const [nextSession,  setNextSession]  = useState<NextSession | null | undefined>(undefined)
  const [hour,         setHour]         = useState(new Date().getHours())
  const [loading,      setLoading]      = useState(true)

  const load = useCallback(async () => {
    const token = localStorage.getItem('mg_token')
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    setHour(new Date().getHours())

    const [profileRes, habitsRes, bookingRes, moodRes] = await Promise.allSettled([
      fetch('/api/profile',     { headers }).then((r) => r.json()),
      fetch('/api/habits',      { headers }).then((r) => r.json()),
      fetch('/api/bookings/me', { headers }).then((r) => r.json()),
      fetch('/api/moods',       { headers }).then((r) => r.json()),
    ])

    if (profileRes.status === 'fulfilled' && profileRes.value.success) {
      setUserName(profileRes.value.data.name ?? null)
      setStreakCount(profileRes.value.data.streakCount ?? 0)
    }

    if (habitsRes.status === 'fulfilled' && habitsRes.value.success) {
      setHabits(
        (habitsRes.value.data as {
          id: string; title: string; completedToday: boolean; assignedBy: string | null
        }[]).map((h) => ({
          id:          h.id,
          title:       h.title,
          completed:   h.completedToday,
          isFromCoach: !!h.assignedBy,
        }))
      )
    }

    if (bookingRes.status === 'fulfilled' && bookingRes.value.success) {
      setNextSession(bookingRes.value.data ?? null)
    } else {
      setNextSession(null)
    }

    if (moodRes.status === 'fulfilled' && moodRes.value.success && moodRes.value.data) {
      setSelectedMood(moodRes.value.data.mood)
      setMoodSaved(true)
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleMoodSelect(type: string) {
    setSelectedMood(type)
    setMoodSaved(true)
    try {
      await fetch('/api/moods', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('mg_token')}` },
        body:    JSON.stringify({ mood: type }),
      })
    } catch { /* silent — optimistic update already applied */ }
  }

  async function toggleHabit(id: string, currentlyCompleted: boolean) {
    // Optimistic update
    setHabits((prev) => prev.map((h) => h.id === id ? { ...h, completed: !h.completed } : h))

    const token = localStorage.getItem('mg_token')
    const today = new Date().toISOString().slice(0, 10)
    try {
      const res  = await fetch(`/api/habits/${id}/check`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ completed: !currentlyCompleted, date: today }),
      })
      const json = await res.json()
      if (!json.success) {
        // Revert on failure
        setHabits((prev) => prev.map((h) => h.id === id ? { ...h, completed: currentlyCompleted } : h))
      }
    } catch {
      setHabits((prev) => prev.map((h) => h.id === id ? { ...h, completed: currentlyCompleted } : h))
    }
  }

  const completedCount = habits.filter((h) => h.completed).length

  // Session join window: 30 min before to 2 hours after
  const sessionMins    = nextSession ? minutesUntilSession(nextSession.sessionDate, nextSession.sessionTime) : null
  const canJoinSession = sessionMins !== null && sessionMins <= 30 && sessionMins >= -120 && nextSession?.status === 'confirmed'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">

      {/* ── Greeting Header ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium" style={{ color: 'var(--content-tertiary)' }}>
            {toJalaliString(new Date())}
          </p>
          <div
            className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
          >
            <span>🔥</span>
            <span>{toPersian(streakCount)} روز</span>
          </div>
        </div>
        <h1 className="text-xl font-bold leading-snug" style={{ color: 'var(--content-primary)' }}>
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
                    border:     selectedMood === type ? '1.5px solid #10B981' : '1.5px solid transparent',
                  }}
                >
                  <span className="text-2xl leading-none">{emoji}</span>
                  <span className="text-[10px]" style={{ color: 'var(--content-secondary)' }}>{label}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Today's Habits ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>قدم‌های امروز من</SectionTitle>
          {habits.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
              {toPersian(completedCount)} از {toPersian(habits.length)} انجام شد
            </span>
          )}
        </div>

        {loading ? (
          <SkeletonCard height={120} />
        ) : habits.length === 0 ? (
          <Card>
            <p className="text-sm text-center py-2" style={{ color: 'var(--content-tertiary)' }}>
              هنوز عادتی ثبت نشده — از اتاق رشد شروع کن! 🌱
            </p>
          </Card>
        ) : (
          <>
            <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: 'var(--surface-tertiary)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${habits.length > 0 ? (completedCount / habits.length) * 100 : 0}%`, background: '#10B981' }}
              />
            </div>

            <div className="flex flex-col gap-3">
              {habits.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id, habit.completed)}
                  className="flex items-center gap-3 rounded-xl p-4 text-right transition-all active:scale-[0.98]"
                  style={{
                    background: habit.completed ? 'rgba(16,185,129,0.08)' : 'var(--surface-card)',
                    border:     `1px solid ${habit.completed ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
                  }}
                >
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all"
                    style={{
                      background: habit.completed ? '#10B981' : 'transparent',
                      border:     `2px solid ${habit.completed ? '#10B981' : 'var(--content-tertiary)'}`,
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
                        🧭 از کوچ
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Next Session ── */}
      <div className="mb-6">
        <SectionTitle>جلسه بعدی من</SectionTitle>

        {loading || nextSession === undefined ? (
          <SkeletonCard height={100} />
        ) : nextSession === null ? (
          <Card>
            <p className="text-sm text-center py-2" style={{ color: 'var(--content-tertiary)' }}>
              جلسه‌ای رزرو نشده — یک کوچ پیدا کن! 🧭
            </p>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center gap-4">
              <div
                className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
              >
                {nextSession.coach.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base" style={{ color: 'var(--content-primary)' }}>
                  {nextSession.coach.name}
                </p>
                {nextSession.coach.shortBio && (
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--content-secondary)' }}>
                    {nextSession.coach.shortBio}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>📅</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--content-secondary)' }}>
                    {toJalaliString(new Date(nextSession.sessionDate))}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>·</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--content-secondary)' }}>
                    ساعت {toPersian(nextSession.sessionTime)}
                  </span>
                </div>
              </div>
            </div>

            <button
              disabled={!canJoinSession}
              className="w-full mt-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
              style={{
                background: canJoinSession ? '#10B981' : 'var(--surface-tertiary)',
                color:      canJoinSession ? '#fff' : 'var(--content-tertiary)',
                cursor:     canJoinSession ? 'pointer' : 'not-allowed',
              }}
            >
              {canJoinSession
                ? '🎥 ورود به اتاق گفتگو'
                : '⏳ ۳۰ دقیقه قبل از جلسه فعال می‌شود'}
            </button>
          </Card>
        )}
      </div>

      {/* ── Daily Inspiration ── */}
      <div className="mb-2">
        <SectionTitle>الهام روزانه</SectionTitle>
        <Card>
          <p className="text-sm leading-relaxed text-center" style={{ color: 'var(--content-secondary)' }}>
            «رشد یعنی آگاهی از اینکه کجا هستی و کجا می‌خواهی باشی»
          </p>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--content-tertiary)' }}>
            برای محتوای آموزشی به اتاق رشد برو 🌱
          </p>
        </Card>
      </div>

    </div>
  )
}
