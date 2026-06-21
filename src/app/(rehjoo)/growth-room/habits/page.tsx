'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface HabitDay {
  date:      string
  completed: boolean
}

interface Habit {
  id:             string
  title:          string
  description:    string | null
  frequency:      'daily' | 'weekly'
  assignedBy:     string | null
  createdAt:      string
  completedToday: boolean
  currentStreak:  number
  heatmap:        HabitDay[]
}

function toPersian(s: string | number) {
  return String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export default function HabitsPage() {
  const router = useRouter()

  const [habits,   setHabits]   = useState<Habit[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title,    setTitle]    = useState('')
  const [freq,     setFreq]     = useState<'daily' | 'weekly'>('daily')
  const [saving,   setSaving]   = useState(false)
  const [checking, setChecking] = useState<string | null>(null)

  useEffect(() => { fetchHabits() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchHabits() {
    setLoading(true)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/habits', { headers: { Authorization: `Bearer ${token}` } })
      const json  = await res.json()
      if (json.success) setHabits(json.data)
    } finally {
      setLoading(false)
    }
  }

  async function toggleCheck(habit: Habit) {
    if (checking) return
    setChecking(habit.id)
    // Optimistic
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? { ...h, completedToday: !h.completedToday, currentStreak: !h.completedToday ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1) }
          : h
      )
    )
    try {
      const token = localStorage.getItem('mg_token')
      const today = new Date().toISOString().slice(0, 10)
      const res   = await fetch(`/api/habits/${habit.id}/check`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ completed: !habit.completedToday, date: today }),
      })
      const json = await res.json()
      if (json.success) {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id ? { ...h, completedToday: json.data.completed, currentStreak: json.data.streak } : h
          )
        )
      } else {
        // Revert
        setHabits((prev) => prev.map((h) => h.id === habit.id ? habit : h))
      }
    } catch {
      setHabits((prev) => prev.map((h) => h.id === habit.id ? habit : h))
    } finally {
      setChecking(null)
    }
  }

  async function createHabit() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/habits', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ title, frequency: freq }),
      })
      const json = await res.json()
      if (json.success) {
        setShowForm(false)
        setTitle('')
        setHabits((prev) => [...prev, json.data])
      }
    } finally {
      setSaving(false)
    }
  }

  const completedToday = habits.filter((h) => h.completedToday).length

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">

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
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>✅ عادت‌ها</h1>
            {habits.length > 0 && (
              <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                {toPersian(completedToday)} از {toPersian(habits.length)} امروز انجام شد
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: '#3B82F6' }}
        >
          + عادت جدید
        </button>
      </div>

      {/* Progress bar */}
      {habits.length > 0 && (
        <div className="h-2 rounded-full mb-6 overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${(completedToday / habits.length) * 100}%`, background: '#10B981' }}
          />
        </div>
      )}

      {/* Habits list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--surface-secondary)' }} />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🌱</p>
          <p className="font-semibold mb-1" style={{ color: 'var(--content-primary)' }}>اولین عادتت رو بساز</p>
          <p className="text-sm mb-5" style={{ color: 'var(--content-tertiary)' }}>
            عادت‌های کوچک، تغییرات بزرگ می‌سازن
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: '#3B82F6' }}
          >
            شروع کن
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="rounded-2xl p-4"
              style={{
                background: habit.completedToday ? 'rgba(16,185,129,0.06)' : 'var(--surface-card)',
                border:     `1px solid ${habit.completedToday ? 'rgba(16,185,129,0.25)' : 'var(--border-color)'}`,
              }}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleCheck(habit)}
                  disabled={checking === habit.id}
                  className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 mt-0.5"
                  style={{
                    background: habit.completedToday ? '#10B981' : 'transparent',
                    border:     `2.5px solid ${habit.completedToday ? '#10B981' : 'var(--content-tertiary)'}`,
                  }}
                >
                  {habit.completedToday && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="font-semibold text-sm"
                      style={{
                        color:          'var(--content-primary)',
                        textDecoration: habit.completedToday ? 'line-through' : 'none',
                        opacity:        habit.completedToday ? 0.6 : 1,
                      }}
                    >
                      {habit.title}
                    </p>
                    {habit.assignedBy && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                        🧭 از کوچ
                      </span>
                    )}
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-secondary)', color: 'var(--content-tertiary)' }}>
                      {habit.frequency === 'daily' ? 'روزانه' : 'هفتگی'}
                    </span>
                  </div>

                  {/* Streak + heatmap row */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>
                      🔥 {toPersian(habit.currentStreak)} روز
                    </span>
                    {/* 7-day heatmap */}
                    <div className="flex gap-1">
                      {habit.heatmap.map(({ date, completed }) => (
                        <div
                          key={date}
                          className="w-4 h-4 rounded"
                          style={{ background: completed ? '#10B981' : 'var(--surface-secondary)' }}
                          title={new Date(date).toLocaleDateString('fa-IR')}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Habit Form */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl p-5 pb-10 space-y-4"
            style={{ background: 'var(--surface-card)' }}
          >
            <div className="w-12 h-1.5 rounded-full mx-auto mb-4" style={{ background: 'var(--border-color)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>عادت جدید</h2>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان عادت... (مثلاً: مطالعه ۲۰ دقیقه)"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)', border: '1px solid var(--border-color)' }}
            />

            <div className="flex gap-2">
              {(['daily', 'weekly'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFreq(f)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: freq === f ? 'rgba(59,130,246,0.15)' : 'var(--surface-secondary)',
                    color:      freq === f ? '#3B82F6' : 'var(--content-tertiary)',
                    border:     freq === f ? '1.5px solid #3B82F6' : '1px solid var(--border-color)',
                  }}
                >
                  {f === 'daily' ? 'روزانه' : 'هفتگی'}
                </button>
              ))}
            </div>

            <button
              onClick={createHabit}
              disabled={saving || !title.trim()}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white"
              style={{ background: saving || !title.trim() ? '#374151' : '#3B82F6' }}
            >
              {saving ? 'در حال ثبت...' : '✅ ثبت عادت'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
