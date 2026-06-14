'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type GoalStatus = 'active' | 'completed' | 'paused'

interface Goal {
  id:          string
  title:       string
  description: string | null
  progressPct: number
  isPrivate:   boolean
  targetDate:  string | null
  status:      GoalStatus
  createdAt:   string
}

const STATUS_META: Record<GoalStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'فعال',        color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  completed: { label: 'تکمیل‌شده',  color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  paused:    { label: 'متوقف',       color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
}

function toPersian(s: string | number) {
  return String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export default function GoalsPage() {
  const router = useRouter()

  const [goals,      setGoals]      = useState<Goal[]>([])
  const [filter,     setFilter]     = useState<GoalStatus>('active')
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [savingId,   setSavingId]   = useState<string | null>(null)

  // Form state
  const [title,      setTitle]      = useState('')
  const [desc,       setDesc]       = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [isPrivate,  setIsPrivate]  = useState(true)
  const [formSaving, setFormSaving] = useState(false)

  useEffect(() => { fetchGoals() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchGoals() {
    setLoading(true)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch(`/api/goals?status=${filter}`, { headers: { Authorization: `Bearer ${token}` } })
      const json  = await res.json()
      if (json.success) setGoals(json.data)
    } finally {
      setLoading(false)
    }
  }

  async function createGoal() {
    if (!title.trim()) return
    setFormSaving(true)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/goals', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ title, description: desc, targetDate: targetDate || undefined, isPrivate }),
      })
      const json = await res.json()
      if (json.success) {
        setShowForm(false)
        setTitle(''); setDesc(''); setTargetDate(''); setIsPrivate(true)
        if (filter === 'active') setGoals((g) => [json.data, ...g])
      }
    } finally {
      setFormSaving(false)
    }
  }

  async function updateProgress(id: string, progressPct: number) {
    setSavingId(id)
    const token = localStorage.getItem('mg_token')
    await fetch(`/api/goals/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ progressPct }),
    })
    setGoals((g) => g.map((x) => x.id === id ? { ...x, progressPct } : x))
    setSavingId(null)
  }

  async function markComplete(id: string) {
    setSavingId(id)
    const token = localStorage.getItem('mg_token')
    await fetch(`/api/goals/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ status: 'completed' }),
    })
    setGoals((g) => g.filter((x) => x.id !== id))
    setSavingId(null)
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const focusGoal   = activeGoals[0]

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
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>🎯 اهداف من</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: '#10B981' }}
        >
          + هدف جدید
        </button>
      </div>

      {/* Focus Mode — biggest active goal */}
      {filter === 'active' && focusGoal && (
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.3)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}>
              ⚡ هدف اصلی
            </span>
          </div>
          <p className="font-bold text-base mb-3" style={{ color: 'var(--content-primary)' }}>
            {focusGoal.title}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${focusGoal.progressPct}%`, background: '#10B981' }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: '#10B981' }}>
              {toPersian(focusGoal.progressPct)}٪
            </span>
          </div>
          {focusGoal.targetDate && (
            <p className="text-xs mt-2" style={{ color: 'var(--content-tertiary)' }}>
              موعد: {new Date(focusGoal.targetDate).toLocaleDateString('fa-IR')}
            </p>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex rounded-xl p-1 mb-5 gap-1" style={{ background: 'var(--surface-secondary)' }}>
        {(['active', 'completed', 'paused'] as GoalStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: filter === s ? STATUS_META[s].bg : 'transparent',
              color:      filter === s ? STATUS_META[s].color : 'var(--content-tertiary)',
            }}
          >
            {STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--surface-secondary)' }} />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">🎯</p>
          <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>
            هنوز هدفی ثبت نشده
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#10B981' }}
          >
            اولین هدفت رو ثبت کن
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const isOpen = expanded === goal.id
            const sm     = STATUS_META[goal.status]
            return (
              <div
                key={goal.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : goal.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-semibold text-sm leading-snug" style={{ color: 'var(--content-primary)' }}>
                      {goal.title}
                    </p>
                    <span
                      className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: sm.bg, color: sm.color }}
                    >
                      {sm.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${goal.progressPct}%`, background: sm.color }}
                      />
                    </div>
                    <span className="text-xs font-bold" style={{ color: sm.color }}>
                      {toPersian(goal.progressPct)}٪
                    </span>
                  </div>
                </div>

                {/* Expanded controls */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                    {goal.description && (
                      <p className="text-sm" style={{ color: 'var(--content-secondary)' }}>{goal.description}</p>
                    )}
                    {goal.targetDate && (
                      <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                        موعد: {new Date(goal.targetDate).toLocaleDateString('fa-IR')}
                      </p>
                    )}
                    {goal.status === 'active' && (
                      <>
                        <div>
                          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--content-secondary)' }}>
                            <span>پیشرفت</span>
                            <span>{toPersian(goal.progressPct)}٪</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={goal.progressPct}
                            onChange={(e) => {
                              const v = parseInt(e.target.value)
                              setGoals((g) => g.map((x) => x.id === goal.id ? { ...x, progressPct: v } : x))
                            }}
                            onMouseUp={(e) => updateProgress(goal.id, parseInt((e.target as HTMLInputElement).value))}
                            onTouchEnd={(e) => updateProgress(goal.id, parseInt((e.target as HTMLInputElement).value))}
                            className="w-full"
                            style={{ accentColor: '#10B981' }}
                          />
                        </div>
                        <button
                          onClick={() => markComplete(goal.id)}
                          disabled={savingId === goal.id}
                          className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                          style={{ background: '#10B981' }}
                        >
                          ✅ تکمیل هدف
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New Goal Form Modal */}
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
            <h2 className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>هدف جدید</h2>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان هدف... (مثلاً: یادگیری زبان انگلیسی)"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)', border: '1px solid var(--border-color)' }}
            />

            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="توضیحات (اختیاری)..."
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)', border: '1px solid var(--border-color)' }}
            />

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--content-secondary)' }}>
                موعد مقرر (اختیاری)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)', border: '1px solid var(--border-color)' }}
              />
            </div>

            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className="flex items-center gap-3 w-full"
            >
              <div
                className="w-11 h-6 rounded-full relative transition-all"
                style={{ background: isPrivate ? '#10B981' : 'var(--surface-secondary)' }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow"
                  style={{ right: isPrivate ? '2px' : 'auto', left: isPrivate ? 'auto' : '2px' }}
                />
              </div>
              <span className="text-sm" style={{ color: 'var(--content-primary)' }}>
                هدف خصوصی 🔒 {isPrivate ? '(فقط برای خودت)' : '(عمومی)'}
              </span>
            </button>

            <button
              onClick={createGoal}
              disabled={formSaving || !title.trim()}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white"
              style={{ background: formSaving || !title.trim() ? '#374151' : '#10B981' }}
            >
              {formSaving ? 'در حال ثبت...' : '✅ ثبت هدف'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
