'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import jalaali from 'jalaali-js'

// ── Types ─────────────────────────────────────────────────

interface CoachData {
  name:           string
  avgRating:      number
  totalSessions:  number
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

interface TodaySession {
  id:            string
  sessionDate:   string
  sessionTime:   string
  sessionNumber: number
  status:        string
  sessionStatus: string | null
  jitsiRoomId:   string | null
  client: { id: string; name: string; avatarUrl: string | null }
  package: { name: string; sessionCount: number; durationMinutes: number }
}

interface RecentMessage {
  partnerId:   string
  partnerName: string
  lastMessage: string
  unreadCount: number
  sentAt:      string
}

// ── Helpers ───────────────────────────────────────────────

const MONTH_NAMES = [
  'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
  'مهر','آبان','آذر','دی','بهمن','اسفند',
]

function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatPrice(toman: number): string {
  const s = toman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return toPersian(s) + ' ت'
}

function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate)
  const { jm, jd } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${toPersian(jd)} ${MONTH_NAMES[jm - 1]}`
}

function minutesUntil(isoDate: string, time: string): number {
  const d = new Date(isoDate)
  const [h, m] = time.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return (d.getTime() - Date.now()) / 60000
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'الان'
  if (mins < 60) return `${toPersian(mins)} دق پیش`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${toPersian(hrs)} س پیش`
  return `${toPersian(Math.floor(hrs / 24))} روز پیش`
}

// ── Sub-components ────────────────────────────────────────

function StatCard({ label, value, icon, color = '#10B981', sub }: {
  label: string; value: string; icon: string; color?: string; sub?: string
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1.5"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--content-tertiary)' }}>{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px]" style={{ color: 'var(--content-tertiary)' }}>{sub}</p>}
    </div>
  )
}

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(rating)
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: 11, opacity: i <= filled ? 1 : 0.2 }}>⭐</span>
      ))}
    </span>
  )
}

// ── Today session card ────────────────────────────────────

function TodayCard({ session, router }: { session: TodaySession; router: ReturnType<typeof useRouter> }) {
  const mins     = minutesUntil(session.sessionDate, session.sessionTime)
  const canJoin  = mins <= 30 && mins >= -120 && session.status === 'confirmed'
  const initials = session.client.name.charAt(0)

  let timeLabel = ''
  if (mins > 60) timeLabel = `${toPersian(Math.ceil(mins / 60))} ساعت دیگر`
  else if (mins > 0) timeLabel = `${toPersian(Math.ceil(mins))} دقیقه دیگر`
  else if (mins > -120) timeLabel = 'در حال برگزاری'
  else timeLabel = 'تمام شده'

  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
        style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>
          {session.client.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--content-secondary)' }}>
          {session.package.name} · جلسه {toPersian(session.sessionNumber)}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#10B981' }}>
          ⏰ {toPersian(session.sessionTime)} · {timeLabel}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          disabled={!canJoin}
          onClick={() => router.push(`/coach-sessions/${session.id}`)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: canJoin ? '#10B981' : 'var(--surface-secondary)',
            color:      canJoin ? 'white' : 'var(--content-tertiary)',
          }}
        >
          🎥 شروع
        </button>
        <button
          onClick={() => router.push(`/coach-messages/${session.client.id}`)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
        >
          💬 پیام
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

export default function CoachDashboardPage() {
  const router = useRouter()
  const [data,         setData]         = useState<CoachData | null>(null)
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([])
  const [stats,        setStats]        = useState<{ thisWeekCount: number; thisMonthEarnings: number } | null>(null)
  const [messages,     setMessages]     = useState<RecentMessage[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('mg_token') ?? ''
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch('/api/coaches/me', { headers }).then((r) => r.json()),
      fetch('/api/coaches/me/sessions?filter=today', { headers }).then((r) => r.json()),
    ]).then(([coachJson, todayJson]) => {
      if (coachJson.success) setData(coachJson.data)
      if (todayJson.success) {
        setTodaySessions(todayJson.data.sessions)
        setStats(todayJson.data.stats)
      }
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        {[60, 140, 180, 180].map((h, i) => (
          <div key={i} className="rounded-xl mb-4 animate-pulse" style={{ height: h, background: 'var(--surface-card)' }} />
        ))}
      </div>
    )
  }

  if (!data) return null

  const earnings = data.wallet?.totalEarned ?? 0

  // Upcoming sessions that are NOT today
  const upcomingFuture = data.upcomingBookings.filter((b) => {
    const d   = new Date(b.sessionDate)
    const now = new Date()
    return !(d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate())
  })

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6 space-y-5">

      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>
          سلام، {data.name || 'راه‌بلد'} 👋
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--content-secondary)' }}>
          خوش اومدی به پنل راه‌بلدت
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="کل جلسات"
          value={toPersian(data.totalSessions)}
          icon="📅"
        />
        <StatCard
          label="میانگین امتیاز"
          value={data.avgRating > 0 ? data.avgRating.toFixed(1) : '—'}
          icon="⭐"
          color="#F59E0B"
        />
        <StatCard
          label="این هفته"
          value={toPersian(stats?.thisWeekCount ?? 0)}
          icon="📊"
          color="#3B82F6"
          sub="جلسه برگزار شده"
        />
        <StatCard
          label="این ماه"
          value={stats ? formatPrice(stats.thisMonthEarnings) : '—'}
          icon="💵"
          color="#10B981"
          sub="درآمد آزاد شده"
        />
        <StatCard
          label="قابل برداشت"
          value={formatPrice(data.wallet?.availableAmount ?? 0)}
          icon="💰"
          color="#10B981"
        />
        <StatCard
          label="در انتظار آزادسازی"
          value={formatPrice(data.wallet?.lockedAmount ?? 0)}
          icon="🔒"
          color="#94A3B8"
        />
      </div>

      {/* Commission badge */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
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

      {/* Today's sessions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {todaySessions.length > 0 && (
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
            )}
            <h2 className="text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>
              جلسات امروز
            </h2>
            {todaySessions.length > 0 && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#10B981', color: 'white' }}
              >
                {toPersian(todaySessions.length)}
              </span>
            )}
          </div>
          <button
            onClick={() => router.push('/coach-sessions')}
            className="text-xs font-semibold"
            style={{ color: '#10B981' }}
          >
            همه جلسات ›
          </button>
        </div>

        {todaySessions.length === 0 ? (
          <div
            className="rounded-xl p-5 text-center"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
          >
            <p className="text-2xl mb-1.5">☀️</p>
            <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>
              امروز جلسه‌ای ندارید
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaySessions.map((s) => (
              <TodayCard key={s.id} session={s} router={router} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming sessions (future, not today) */}
      {upcomingFuture.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
            📅 جلسات پیش‌رو
          </h2>
          <div className="space-y-3">
            {upcomingFuture.slice(0, 5).map((b) => {
              const minsUntil = minutesUntil(b.sessionDate, b.sessionTime)
              const canJoin   = minsUntil <= 30 && minsUntil >= -120 && b.jitsiRoomId

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
                        {formatShortDate(b.sessionDate)} · ساعت {toPersian(b.sessionTime)} · {toPersian(b.duration)} دقیقه
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
                        {b.packageName}
                      </p>
                    </div>
                    {canJoin && (
                      <button
                        onClick={() => router.push(`/coach-sessions/${b.id}`)}
                        className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                        style={{ background: '#10B981' }}
                      >
                        ورود 🎥
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {upcomingFuture.length > 5 && (
              <button
                onClick={() => router.push('/coach-sessions')}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
              >
                نمایش همه ({toPersian(upcomingFuture.length)} جلسه) ›
              </button>
            )}
          </div>
        </section>
      )}

      {/* Messages quick link */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>
            💬 پیام‌ها
          </h2>
          <button
            onClick={() => router.push('/coach-messages')}
            className="text-xs font-semibold"
            style={{ color: '#10B981' }}
          >
            مشاهده همه ›
          </button>
        </div>
        <button
          onClick={() => router.push('/coach-messages')}
          className="w-full rounded-xl p-4 flex items-center gap-3 text-right transition-all active:scale-[0.99]"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'rgba(59,130,246,0.12)' }}
          >
            💬
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
              گفتگو با رهجوها
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
              پیام‌رسانی مستقیم با مراجعین
            </p>
          </div>
          <span style={{ color: 'var(--content-tertiary)' }}>›</span>
        </button>
      </section>

      {/* Recent reviews */}
      {data.recentReviews.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
            ⭐ آخرین نظرات
          </h2>
          <div className="space-y-3">
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
                  {formatShortDate(rev.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
