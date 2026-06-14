'use client'

import { useEffect, useState } from 'react'

// ── Constants ─────────────────────────────────────────────

const DAYS = [
  { dow: 0, label: 'شنبه' },
  { dow: 1, label: 'یکشنبه' },
  { dow: 2, label: 'دوشنبه' },
  { dow: 3, label: 'سه‌شنبه' },
  { dow: 4, label: 'چهارشنبه' },
  { dow: 5, label: 'پنج‌شنبه' },
  { dow: 6, label: 'جمعه' },
]

// Generate time options in 30-min steps
const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 23) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

function toPersian(s: string | number) {
  return String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

// ── Types ─────────────────────────────────────────────────

interface DayConfig {
  enabled:   boolean
  startTime: string
  endTime:   string
}

type Schedule = Record<number, DayConfig>

const DEFAULT: DayConfig = { enabled: false, startTime: '09:00', endTime: '17:00' }

// ── Page ──────────────────────────────────────────────────

export default function CoachAvailabilityPage() {
  const [schedule, setSchedule] = useState<Schedule>(() =>
    Object.fromEntries(DAYS.map(({ dow }) => [dow, { ...DEFAULT }]))
  )
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/coaches/me/availability')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data.slots.length > 0) {
          const base: Schedule = Object.fromEntries(DAYS.map(({ dow }) => [dow, { ...DEFAULT }]))
          for (const ts of json.data.slots) {
            base[ts.dayOfWeek] = { enabled: true, startTime: ts.startTime, endTime: ts.endTime }
          }
          setSchedule(base)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function toggle(dow: number) {
    setSchedule((prev) => ({
      ...prev,
      [dow]: { ...prev[dow], enabled: !prev[dow].enabled },
    }))
    setSaved(false)
  }

  function setTime(dow: number, field: 'startTime' | 'endTime', val: string) {
    setSchedule((prev) => ({
      ...prev,
      [dow]: { ...prev[dow], [field]: val },
    }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const slots = DAYS
        .filter(({ dow }) => schedule[dow].enabled)
        .map(({ dow }) => ({
          day_of_week: dow,
          start_time:  schedule[dow].startTime,
          end_time:    schedule[dow].endTime,
        }))

      const res  = await fetch('/api/coaches/me/availability', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots }),
      })
      const json = await res.json()
      if (json.success) setSaved(true)
      else setError(json.error?.message ?? 'خطایی رخ داد')
    } catch {
      setError('خطا در ارتباط با سرور')
    } finally {
      setSaving(false)
    }
  }

  const enabledCount = DAYS.filter(({ dow }) => schedule[dow].enabled).length

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6">

      <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--content-primary)' }}>
        زمان‌بندی کاری
      </h1>
      <p className="text-sm mb-5" style={{ color: 'var(--content-secondary)' }}>
        روزها و ساعات پذیرش رهجو را تعریف کنید
      </p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {DAYS.map((d) => (
            <div key={d.dow} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {DAYS.map(({ dow, label }) => {
            const cfg = schedule[dow]
            return (
              <div
                key={dow}
                className="rounded-xl overflow-hidden"
                style={{
                  background: cfg.enabled ? 'var(--surface-card)' : 'var(--surface-secondary)',
                  border:     `1px solid ${cfg.enabled ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
                }}
              >
                {/* Day header row */}
                <button
                  onClick={() => toggle(dow)}
                  className="w-full flex items-center justify-between px-4 py-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Toggle pill */}
                    <div
                      className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
                      style={{ background: cfg.enabled ? '#10B981' : 'var(--surface-tertiary)' }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                        style={{ right: cfg.enabled ? 2 : 'auto', left: cfg.enabled ? 'auto' : 2 }}
                      />
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: cfg.enabled ? 'var(--content-primary)' : 'var(--content-tertiary)' }}
                    >
                      {label}
                    </span>
                  </div>
                  {cfg.enabled && (
                    <span className="text-xs" style={{ color: '#10B981' }}>
                      {toPersian(cfg.startTime)} تا {toPersian(cfg.endTime)}
                    </span>
                  )}
                  {!cfg.enabled && (
                    <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>تعطیل</span>
                  )}
                </button>

                {/* Time selectors — shown only when enabled */}
                {cfg.enabled && (
                  <div
                    className="flex items-center gap-3 px-4 pb-3"
                    style={{ borderTop: '1px solid var(--border-color)' }}
                  >
                    <label className="text-xs" style={{ color: 'var(--content-tertiary)' }}>از</label>
                    <select
                      value={cfg.startTime}
                      onChange={(e) => setTime(dow, 'startTime', e.target.value)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                      style={{
                        background: 'var(--surface-secondary)',
                        color:      'var(--content-primary)',
                        border:     '1px solid var(--border-color)',
                      }}
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{toPersian(t)}</option>
                      ))}
                    </select>
                    <label className="text-xs" style={{ color: 'var(--content-tertiary)' }}>تا</label>
                    <select
                      value={cfg.endTime}
                      onChange={(e) => setTime(dow, 'endTime', e.target.value)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                      style={{
                        background: 'var(--surface-secondary)',
                        color:      'var(--content-primary)',
                        border:     '1px solid var(--border-color)',
                      }}
                    >
                      {TIME_OPTIONS.filter((t) => t > cfg.startTime).map((t) => (
                        <option key={t} value={t}>{toPersian(t)}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      <div
        className="rounded-xl px-4 py-3 mb-5"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
      >
        <p className="text-xs" style={{ color: '#10B981' }}>
          {enabledCount === 0
            ? 'هیچ روزی انتخاب نشده — رهجوها قادر به رزرو نخواهند بود'
            : `${toPersian(enabledCount)} روز در هفته فعال`}
        </p>
      </div>

      {error && (
        <p className="text-sm text-center mb-4 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
          {error}
        </p>
      )}

      {saved && (
        <p className="text-sm text-center mb-4 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
          ✓ زمان‌بندی با موفقیت ذخیره شد
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || loading}
        className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all active:scale-95"
        style={{ background: saving ? 'var(--surface-tertiary)' : '#10B981' }}
      >
        {saving ? 'در حال ذخیره...' : 'ذخیره زمان‌بندی'}
      </button>
    </div>
  )
}
