'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import jalaali from 'jalaali-js'

// ── Types ─────────────────────────────────────────────────

interface Package {
  id: string
  name: string
  priceToman: number
  sessionCount: number
  durationMinutes: number
  isIntro: boolean
}

interface Coach {
  id: string
  name: string
  packages: Package[]
}

interface AvailableDay {
  date: string
  slots: string[]
}

// ── Constants ─────────────────────────────────────────────

const MONTH_NAMES = [
  'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
  'مهر','آبان','آذر','دی','بهمن','اسفند',
]
const DAY_ABBR = ['ش','ی','د','س','چ','پ','ج']

// ── Helpers ───────────────────────────────────────────────

function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatPrice(toman: number): string {
  const s = toman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return toPersian(s) + ' تومان'
}

// JS getDay() → Jalali DOW (0=شنبه)
function jalaliDow(jsDay: number) {
  return (jsDay + 1) % 7
}

function todayJalali() {
  const now = new Date()
  return jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

// ── Page ──────────────────────────────────────────────────

export default function BookPage() {
  const router       = useRouter()
  const params       = useParams()
  const searchParams = useSearchParams()

  const coachId   = params?.coachId as string
  const packageId = searchParams.get('package')

  const [coach,        setCoach]        = useState<Coach | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [availDays,    setAvailDays]    = useState<AvailableDay[]>([])
  const [calLoading,   setCalLoading]   = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [booking,      setBooking]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  // Calendar nav state — default to current Jalali month
  const initToday = todayJalali()
  const [calYear,  setCalYear]  = useState(initToday.jy)
  const [calMonth, setCalMonth] = useState(initToday.jm)

  // Load coach & package info
  useEffect(() => {
    if (!coachId) return
    fetch(`/api/marketplace/coaches/${coachId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCoach(json.data)
        else router.replace(`/coaches/${coachId}`)
      })
      .catch(() => router.replace('/coaches'))
      .finally(() => setLoading(false))
  }, [coachId, router])

  // Load availability for current calendar month
  const fetchAvailability = useCallback(async (year: number, month: number) => {
    setCalLoading(true)
    setSelectedDate(null)
    setSelectedTime(null)
    try {
      const res  = await fetch(`/api/marketplace/coaches/${coachId}/availability?year=${year}&month=${month}`)
      const json = await res.json()
      if (json.success) setAvailDays(json.data.available_days)
    } catch { /* silent */ } finally {
      setCalLoading(false)
    }
  }, [coachId])

  useEffect(() => { fetchAvailability(calYear, calMonth) }, [calYear, calMonth, fetchAvailability])

  // Map date string → slots[]
  const availMap = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const d of availDays) m.set(d.date, d.slots)
    return m
  }, [availDays])

  // Calendar grid math
  const daysInMonth = jalaali.jalaaliMonthLength(calYear, calMonth)
  const firstDayG = jalaali.toGregorian(calYear, calMonth, 1)
  const firstDow  = jalaliDow(new Date(firstDayG.gy, firstDayG.gm - 1, firstDayG.gd).getDay())
  const today     = todayJalali()

  const selectedPkg = coach?.packages.find((p) => p.id === packageId) ?? coach?.packages[0] ?? null

  async function handleProceed() {
    if (!selectedDate || !selectedTime || !selectedPkg || !coach) return
    setBooking(true)
    setError(null)
    try {
      const res  = await fetch('/api/bookings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id:     coach.id,
          package_id:   selectedPkg.id,
          session_date: selectedDate,
          session_time: selectedTime,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message ?? 'خطایی رخ داد')
        return
      }
      // Convert Shamsi date for display
      const [jy, jm, jd] = selectedDate.split('-').map(Number)
      const dateDisplay = `${toPersian(jd)} ${MONTH_NAMES[jm - 1]} ${toPersian(jy)}`

      const qs = new URLSearchParams({
        booking_id: json.data.booking_id,
        coach_name: coach.name,
        pkg_name:   selectedPkg.name,
        date:       selectedDate,
        date_label: dateDisplay,
        time:       selectedTime,
        amount:     String(json.data.amount),
      })
      router.push(`/payment?${qs}`)
    } catch {
      setError('خطا در ارتباط با سرور')
    } finally {
      setBooking(false)
    }
  }

  // ── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        {[120, 280, 120].map((h, i) => (
          <div key={i} className="rounded-xl mb-4 animate-pulse" style={{ height: h, background: 'var(--surface-card)' }} />
        ))}
      </div>
    )
  }

  if (!coach || !selectedPkg) return null

  const isPrevDisabled = calYear === today.jy && calMonth === today.jm

  function prevMonth() {
    if (isPrevDisabled) return
    if (calMonth === 1) { setCalYear((y) => y - 1); setCalMonth(12) }
    else setCalMonth((m) => m - 1)
  }

  function nextMonth() {
    if (calMonth === 12) { setCalYear((y) => y + 1); setCalMonth(1) }
    else setCalMonth((m) => m + 1)
  }

  const selectedSlots = selectedDate ? (availMap.get(selectedDate) ?? []) : []

  const [selJY, selJM, selJD] = selectedDate ? selectedDate.split('-').map(Number) : [0, 0, 0]
  const selectedDateLabel = selectedDate
    ? `${toPersian(selJD)} ${MONTH_NAMES[selJM - 1]}`
    : ''

  return (
    <div className="max-w-lg mx-auto pb-36">

      {/* Back */}
      <div className="px-4 pt-5 mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--content-secondary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4l4 4-4 4M3 8h11" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          پروفایل راه‌بلد
        </button>
      </div>

      {/* Package summary */}
      <div className="px-4 mb-6">
        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--content-primary)' }}>
          رزرو جلسه
        </h1>
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>
                {selectedPkg.name}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--content-tertiary)' }}>
                با {coach.name} · {toPersian(selectedPkg.sessionCount)} جلسه · {toPersian(selectedPkg.durationMinutes)} دقیقه
              </p>
            </div>
            <p className="font-bold text-sm flex-shrink-0" style={{ color: '#10B981' }}>
              {formatPrice(selectedPkg.priceToman)}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--content-secondary)' }}>
          📅 انتخاب روز
        </h2>

        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
              style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)' }}
              aria-label="ماه بعد"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <p className="font-semibold" style={{ color: 'var(--content-primary)' }}>
              {MONTH_NAMES[calMonth - 1]} {toPersian(calYear)}
            </p>

            <button
              onClick={prevMonth}
              disabled={isPrevDisabled}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
              style={{
                background: isPrevDisabled ? 'transparent' : 'var(--surface-secondary)',
                color:      isPrevDisabled ? 'var(--content-tertiary)' : 'var(--content-primary)',
                cursor:     isPrevDisabled ? 'default' : 'pointer',
              }}
              aria-label="ماه قبل"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_ABBR.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold py-1"
                style={{ color: 'var(--content-tertiary)' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className={`grid grid-cols-7 gap-y-1 ${calLoading ? 'opacity-40 pointer-events-none' : ''}`}>
            {/* Empty leading cells */}
            {Array.from({ length: firstDow }, (_, i) => (
              <div key={`e${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day     = i + 1
              const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isPast  =
                calYear < today.jy ||
                (calYear === today.jy && calMonth < today.jm) ||
                (calYear === today.jy && calMonth === today.jm && day <= today.jd)
              const isToday    = calYear === today.jy && calMonth === today.jm && day === today.jd
              const hasSlots   = availMap.has(dateStr)
              const isSelected = selectedDate === dateStr

              return (
                <button
                  key={day}
                  disabled={isPast || !hasSlots}
                  onClick={() => { setSelectedDate(dateStr); setSelectedTime(null) }}
                  className="relative flex flex-col items-center justify-center h-10 rounded-xl transition-all active:scale-90"
                  style={{
                    background: isSelected ? '#10B981' : 'transparent',
                    color:      isPast
                      ? 'var(--content-tertiary)'
                      : isSelected
                        ? '#fff'
                        : hasSlots
                          ? 'var(--content-primary)'
                          : 'var(--content-tertiary)',
                    opacity:    isPast && !isToday ? 0.35 : 1,
                    border:     isToday && !isSelected
                      ? '1px solid rgba(16,185,129,0.5)'
                      : '1px solid transparent',
                    cursor:     isPast || !hasSlots ? 'default' : 'pointer',
                  }}
                >
                  <span className="text-sm">{toPersian(day)}</span>
                  {hasSlots && !isPast && (
                    <span
                      className="absolute bottom-1 w-1 h-1 rounded-full"
                      style={{ background: isSelected ? 'rgba(255,255,255,0.8)' : '#10B981' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {calLoading && (
            <p className="text-xs text-center mt-3" style={{ color: 'var(--content-tertiary)' }}>
              در حال بارگذاری...
            </p>
          )}

          {!calLoading && availDays.length === 0 && (
            <p className="text-xs text-center mt-3" style={{ color: 'var(--content-tertiary)' }}>
              در این ماه روز آزادی موجود نیست
            </p>
          )}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="px-4 mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
            ⏰ انتخاب ساعت — {selectedDateLabel}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {selectedSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className="py-3 rounded-xl text-sm font-medium text-center transition-all active:scale-95"
                style={{
                  background: selectedTime === slot ? '#10B981' : 'var(--surface-card)',
                  color:      selectedTime === slot ? '#fff'     : 'var(--content-primary)',
                  border:     `1px solid ${selectedTime === slot ? '#10B981' : 'var(--border-color)'}`,
                }}
              >
                {toPersian(slot)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 mb-4">
          <p className="text-sm text-center py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
            {error}
          </p>
        </div>
      )}

      {/* Sticky CTA */}
      <div
        className="fixed inset-x-0 px-4 py-4"
        style={{
          bottom:     68,
          zIndex:     45,
          background: 'var(--surface-card)',
          borderTop:  '1px solid var(--border-color)',
        }}
      >
        <div className="max-w-lg mx-auto">
          {selectedDate && selectedTime && (
            <p className="text-xs text-center mb-3" style={{ color: 'var(--content-secondary)' }}>
              {selectedDateLabel} · ساعت {toPersian(selectedTime)} · {formatPrice(selectedPkg.priceToman)}
            </p>
          )}
          <button
            disabled={!selectedDate || !selectedTime || booking}
            onClick={handleProceed}
            className="w-full py-3.5 rounded-xl font-bold text-base transition-all active:scale-95"
            style={{
              background: selectedDate && selectedTime && !booking ? '#10B981' : 'var(--surface-tertiary)',
              color:      selectedDate && selectedTime && !booking ? '#fff'     : 'var(--content-tertiary)',
              cursor:     selectedDate && selectedTime && !booking ? 'pointer'  : 'not-allowed',
            }}
          >
            {booking ? 'در حال پردازش...' : 'ادامه به پرداخت ←'}
          </button>
        </div>
      </div>

    </div>
  )
}
