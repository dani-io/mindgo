'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/layout/ThemeToggle'

type ExerciseType       = 'meditation' | 'breathing' | 'planning'
type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced'

interface Exercise {
  id:              string
  title:           string
  description:     string | null
  type:            ExerciseType
  durationMinutes: number
  difficulty:      ExerciseDifficulty
  audioUrl:        string | null
  steps:           string[]
}

const TYPE_CONFIG: Record<ExerciseType, { icon: string; label: string; color: string }> = {
  meditation: { icon: '🧘', label: 'مدیتیشن هدایت‌شده', color: '#8B5CF6' },
  breathing:  { icon: '🌬️', label: 'تمرینات تنفسی',      color: '#3B82F6' },
  planning:   { icon: '📋', label: 'فرم‌های برنامه‌ریزی', color: '#10B981' },
}

const DIFF_CONFIG: Record<ExerciseDifficulty, { label: string; color: string }> = {
  beginner:     { label: 'مبتدی',      color: '#10B981' },
  intermediate: { label: 'متوسط',      color: '#F59E0B' },
  advanced:     { label: 'پیشرفته',    color: '#EF4444' },
}

function toPersian(n: number) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

// Breathing timer phases (4-4-6 box breathing variant)
const PHASES = [
  { label: 'دم کن',      duration: 4, color: '#3B82F6' },
  { label: 'نگه دار',    duration: 4, color: '#8B5CF6' },
  { label: 'بازدم کن',   duration: 6, color: '#10B981' },
]

function BreathingTimer({ onClose }: { onClose: () => void }) {
  const [running,   setRunning]   = useState(false)
  const [phaseIdx,  setPhaseIdx]  = useState(0)
  const [tick,      setTick]      = useState(PHASES[0].duration)
  const [cycles,    setCycles]    = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setTick((prev) => {
        if (prev > 1) return prev - 1
        // Move to next phase
        setPhaseIdx((pi) => {
          const next = (pi + 1) % PHASES.length
          if (next === 0) setCycles((c) => c + 1)
          setTick(PHASES[next].duration)
          return next
        })
        return PHASES[(phaseIdx + 1) % PHASES.length].duration
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, phaseIdx])

  const phase = PHASES[phaseIdx]
  const progress = ((phase.duration - tick) / phase.duration) * 100

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="rounded-3xl p-8 w-80 text-center"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-sm font-semibold mb-6" style={{ color: 'var(--content-secondary)' }}>
          🌬️ تمرین تنفسی ۴-۴-۶
        </p>

        {/* Circle animation */}
        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle cx="70" cy="70" r="60" fill="none" stroke="var(--surface-secondary)" strokeWidth="8" />
            <circle
              cx="70" cy="70" r="60" fill="none"
              stroke={phase.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-4xl font-bold" style={{ color: phase.color }}>{toPersian(tick)}</p>
            <p className="text-sm font-semibold mt-1" style={{ color: 'var(--content-primary)' }}>{phase.label}</p>
          </div>
        </div>

        <p className="text-xs mb-6" style={{ color: 'var(--content-tertiary)' }}>
          {toPersian(cycles)} چرخه کامل
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setRunning(!running)}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: running ? '#EF4444' : '#10B981' }}
          >
            {running ? '⏸ توقف' : '▶ شروع'}
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ExercisesPage() {
  const router = useRouter()
  const [items,          setItems]          = useState<Exercise[]>([])
  const [loading,        setLoading]        = useState(true)
  const [filter,         setFilter]         = useState<ExerciseType | 'all'>('all')
  const [selected,       setSelected]       = useState<Exercise | null>(null)
  const [showBreathing,  setShowBreathing]  = useState(false)

  const load = useCallback(async () => {
    const token = localStorage.getItem('mg_token')
    if (!token) { router.push('/login'); return }
    setLoading(true)
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('type', filter)
    const res  = await fetch(`/api/exercises?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.success) setItems(json.data)
    setLoading(false)
  }, [router, filter])

  useEffect(() => { load() }, [load])

  const FILTERS: (ExerciseType | 'all')[] = ['all', 'meditation', 'breathing', 'planning']

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">

      {showBreathing && <BreathingTimer onClose={() => setShowBreathing(false)} />}

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
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>🌿 کتابخانه تمرینات</h1>
        </div>
        <ThemeToggle compact />
      </div>

      {/* Quick breathing CTA */}
      <button
        onClick={() => setShowBreathing(true)}
        className="w-full rounded-2xl p-4 mb-5 flex items-center gap-4 text-right transition-all active:scale-[0.99]"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}
      >
        <span className="text-3xl">🌬️</span>
        <div>
          <p className="font-semibold text-sm" style={{ color: '#3B82F6' }}>تمرین تنفس سریع</p>
          <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>۴ ثانیه دم — ۴ نگه دار — ۶ بازدم</p>
        </div>
        <span className="mr-auto text-lg">▶</span>
      </button>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
            style={{
              background: filter === f ? '#10B981' : 'var(--surface-secondary)',
              color:      filter === f ? 'white' : 'var(--content-secondary)',
            }}
          >
            {f === 'all' ? 'همه' : `${TYPE_CONFIG[f].icon} ${TYPE_CONFIG[f].label}`}
          </button>
        ))}
      </div>

      {/* Exercises */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--surface-secondary)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>تمرینی موجود نیست</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const tc = TYPE_CONFIG[item.type]
            const dc = DIFF_CONFIG[item.difficulty]
            return (
              <button
                key={item.id}
                onClick={() => item.type === 'breathing' ? setShowBreathing(true) : setSelected(item)}
                className="w-full rounded-2xl p-4 text-right transition-all active:scale-[0.99]"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${tc.color}15` }}
                  >
                    {tc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>{item.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                        ⏱ {toPersian(item.durationMinutes)} دقیقه
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${dc.color}20`, color: dc.color }}
                      >
                        {dc.label}
                      </span>
                    </div>
                  </div>
                  <span style={{ color: 'var(--content-tertiary)' }}>›</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl p-6 pb-10"
            style={{ background: 'var(--surface-card)', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border-color)' }} />

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: `${TYPE_CONFIG[selected.type].color}15` }}
              >
                {TYPE_CONFIG[selected.type].icon}
              </div>
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--content-primary)' }}>{selected.title}</h2>
                <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                  {toPersian(selected.durationMinutes)} دقیقه · {DIFF_CONFIG[selected.difficulty].label}
                </p>
              </div>
            </div>

            {selected.description && (
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--content-secondary)' }}>
                {selected.description}
              </p>
            )}

            {selected.audioUrl && (
              <audio controls className="w-full mb-5" src={selected.audioUrl} style={{ borderRadius: 12 }} />
            )}

            {selected.steps.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>مراحل اجرا</p>
                <div className="space-y-2">
                  {selected.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ background: '#10B981', color: 'white', marginTop: 1 }}
                      >
                        {toPersian(i + 1)}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--content-primary)' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
