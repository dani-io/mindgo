'use client'

import { useEffect, useState } from 'react'
import jalaali from 'jalaali-js'

// ── Types ─────────────────────────────────────────────────

interface CoachData {
  name:          string
  avgRating:     number
  totalSessions: number
  commissionRate: number
  wallet: {
    totalEarned:     number
    lockedAmount:    number
    availableAmount: number
  } | null
  upcomingBookings: {
    id:          string
    sessionDate: string
    sessionTime: string
    clientName:  string
    packageName: string
    duration:    number
    jitsiRoomId: string | null
  }[]
  recentReviews: {
    id:           string
    rating:       number
    comment:      string | null
    isAnonymous:  boolean
    reviewerName: string | null
    createdAt:    string
  }[]
}

// ── Helpers ───────────────────────────────────────────────

function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatPrice(toman: number): string {
  const s = toman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return toPersian(s) + ' تومان'
}

const MONTH_NAMES = [
  'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
  'مهر','آبان','آذر','دی','بهمن','اسفند',
]

function formatJalaliDate(isoDate: string): string {
  const d = new Date(isoDate)
  const { jy, jm, jd } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${toPersian(jd)} ${MONTH_NAMES[jm - 1]} ${toPersian(jy)}`
}

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(rating)
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: 12, opacity: i <= filled ? 1 : 0.25 }}>⭐</span>
      ))}
    </span>
  )
}

// ── Stat Card ─────────────────────────────────────────────

function StatCard({
  label, value, icon, color = '#10B981',
}: {
  label: string; value: string; icon: string; color?: string
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--content-tertiary)' }}>{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

export default function CoachDashboardPage() {
  const [data,    setData]    = useState<CoachData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coaches/me')
      .then((r) => r.json())
      .then((json) => { if (json.success) setData(json.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        {[80, 180, 200].map((h, i) => (
          <div key={i} className="rounded-xl mb-4 animate-pulse" style={{ height: h, background: 'var(--surface-card)' }} />
        ))}
      </div>
    )
  }

  if (!data) return null

  const earnings = data.wallet?.totalEarned ?? 0

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6">

      {/* Greeting */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>
          سلام، {data.name || 'راه‌بلد'} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--content-secondary)' }}>
          خوش اومدی به پنل راه‌بلدت
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="جلسات برگزار شده"  value={toPersian(data.totalSessions)}           icon="📅" />
        <StatCard label="میانگین امتیاز"    value={data.avgRating.toFixed(1)}                 icon="⭐" color="#F59E0B" />
        <StatCard label="موجودی قابل برداشت" value={formatPrice(data.wallet?.availableAmount ?? 0)} icon="💰" />
        <StatCard label="در انتظار آزادسازی"   value={formatPrice(data.wallet?.lockedAmount ?? 0)}    icon="🔒" color="#94A3B8" />
      </div>

      {/* Commission badge */}
      <div
        className="rounded-xl px-4 py-3 mb-6 flex items-center gap-3"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
      >
        <span className="text-xl">💼</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#10B981' }}>
            سهم شما از هر جلسه: {toPersian(Math.round(data.commissionRate * 100))}٪
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
            درآمد کل: {formatPrice(earnings)}
          </p>
        </div>
      </div>

      {/* Upcoming sessions */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
          📅 جلسات پیش‌رو
        </h2>

        {data.upcomingBookings.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
          >
            <p className="text-3xl mb-2">🗓️</p>
            <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>
              جلسه‌ای در پیش ندارید
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.upcomingBookings.map((b) => {
              const sessionDate = new Date(b.sessionDate)
              const { jy, jm, jd } = jalaali.toJalaali(sessionDate.getFullYear(), sessionDate.getMonth() + 1, sessionDate.getDate())
              const dateLabel = `${toPersian(jd)} ${MONTH_NAMES[jm - 1]}`

              // Check if session is within 30 min
              const now = new Date()
              const sessionDateTime = new Date(sessionDate)
              const [sh, sm] = b.sessionTime.split(':').map(Number)
              sessionDateTime.setHours(sh, sm, 0, 0)
              const minutesDiff = (sessionDateTime.getTime() - now.getTime()) / 60000
              const canJoin = minutesDiff <= 30 && minutesDiff >= -120

              return (
                <div
                  key={b.id}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>
                        {b.clientName}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--content-tertiary)' }}>
                        {dateLabel} · ساعت {toPersian(b.sessionTime)} · {toPersian(b.duration)} دقیقه
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
                        {b.packageName}
                      </p>
                    </div>
                    {canJoin && b.jitsiRoomId && (
                      <a
                        href={`https://meet.jit.si/${b.jitsiRoomId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                        style={{ background: '#10B981' }}
                      >
                        ورود 🎥
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Recent reviews */}
      {data.recentReviews.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
            ⭐ آخرین نظرات
          </h2>
          <div className="flex flex-col gap-3">
            {data.recentReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl p-4"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>
                    {rev.isAnonymous ? 'یک هم‌سفر' : (rev.reviewerName ?? 'رهجو')}
                  </span>
                  <StarRow rating={rev.rating} />
                </div>
                {rev.comment && (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--content-secondary)' }}>
                    «{rev.comment}»
                  </p>
                )}
                <p className="text-xs mt-2" style={{ color: 'var(--content-tertiary)' }}>
                  {formatJalaliDate(rev.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
