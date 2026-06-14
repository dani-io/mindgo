'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import jalaali from 'jalaali-js'

// ── Types ─────────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled_by_coach' | 'cancelled_by_user' | 'no_show'
type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'disputed'
type FilterTab     = 'upcoming' | 'completed' | 'cancelled'

interface SessionItem {
  id:            string
  sessionDate:   string
  sessionTime:   string
  sessionNumber: number
  status:        BookingStatus
  sessionStatus: SessionStatus | null
  jitsiRoomId:   string | null
  client: {
    id:        string
    name:      string
    avatarUrl: string | null
  }
  package: {
    name:            string
    sessionCount:    number
    durationMinutes: number
  }
}

// ── Helpers ───────────────────────────────────────────────

const MONTH_NAMES = [
  'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
  'مهر','آبان','آذر','دی','بهمن','اسفند',
]

const DAY_NAMES = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']

function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate)
  const { jm, jd } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${toPersian(jd)} ${MONTH_NAMES[jm - 1]}`
}

function formatFullDate(isoDate: string): string {
  const d = new Date(isoDate)
  const { jy, jm, jd } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  // 0=Sun,1=Mon... convert to shamsi week where 0=Sat
  const jsDow = d.getDay() // 0=Sun
  const shamsiDow = (jsDow + 1) % 7 // 0=Sat,1=Sun,...,6=Fri
  return `${DAY_NAMES[shamsiDow]} ${toPersian(jd)} ${MONTH_NAMES[jm - 1]} ${toPersian(jy)}`
}

function isToday(isoDate: string): boolean {
  const d   = new Date(isoDate)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth()    === now.getMonth()    &&
         d.getDate()     === now.getDate()
}

function minutesUntilSession(isoDate: string, time: string): number {
  const d = new Date(isoDate)
  const [h, m] = time.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return (d.getTime() - Date.now()) / 60000
}

// ── Status badge ──────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; pulse?: boolean }> = {
  pending:             { label: 'در انتظار',    bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B' },
  confirmed:           { label: 'تأیید شده',    bg: 'rgba(59,130,246,0.15)',  color: '#3B82F6' },
  in_progress:         { label: 'در جریان 🔴',  bg: 'rgba(16,185,129,0.15)',  color: '#10B981', pulse: true },
  completed:           { label: 'برگزار شده',   bg: 'rgba(148,163,184,0.15)', color: '#94A3B8' },
  disputed:            { label: 'اختلاف',        bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  cancelled_by_coach:  { label: 'لغو (شما)',     bg: 'rgba(239,68,68,0.15)',   color: '#EF4444' },
  cancelled_by_user:   { label: 'لغو (رهجو)',    bg: 'rgba(239,68,68,0.15)',   color: '#EF4444' },
  no_show:             { label: 'غیبت',           bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
}

function StatusBadge({ booking, session }: { booking: BookingStatus; session: SessionStatus | null }) {
  // session in-progress takes priority over booking confirmed
  const key = session === 'in_progress' ? 'in_progress'
            : session === 'disputed'    ? 'disputed'
            : booking
  const cfg = STATUS_CONFIG[key] ?? STATUS_CONFIG['confirmed']
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.pulse ? 'animate-pulse' : ''}`}
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

// ── Session Card ──────────────────────────────────────────

function SessionCard({ item, highlight }: { item: SessionItem; highlight?: boolean }) {
  const router    = useRouter()
  const minsUntil = minutesUntilSession(item.sessionDate, item.sessionTime)
  const canJoin   = minsUntil <= 30 && minsUntil >= -120 && item.status === 'confirmed'
  const initials  = item.client.name.charAt(0)

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background:  highlight ? 'rgba(16,185,129,0.05)' : 'var(--surface-card)',
        border:      `1px solid ${highlight ? 'rgba(16,185,129,0.25)' : 'var(--border-color)'}`,
      }}
    >
      <div className="flex items-start gap-3">

        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
        >
          {item.client.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.client.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
              {item.client.name}
            </p>
            <StatusBadge booking={item.status} session={item.sessionStatus} />
          </div>

          <p className="text-xs mb-1" style={{ color: 'var(--content-secondary)' }}>
            {item.package.name} · جلسه {toPersian(item.sessionNumber)} از {toPersian(item.package.sessionCount)}
          </p>

          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--content-tertiary)' }}>
            <span>📅 {formatShortDate(item.sessionDate)}</span>
            <span>⏰ {toPersian(item.sessionTime)}</span>
            <span>⏱ {toPersian(item.package.durationMinutes)} دق</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {(item.status === 'confirmed' || item.status === 'pending') && (
        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          {item.status === 'confirmed' && (
            <button
              disabled={!canJoin}
              onClick={() => router.push(`/coach-sessions/${item.id}`)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: canJoin ? '#10B981' : 'var(--surface-secondary)',
                color:      canJoin ? 'white' : 'var(--content-tertiary)',
                opacity:    canJoin ? 1 : 0.7,
              }}
            >
              {canJoin ? '🎥 شروع جلسه' : `🎥 شروع جلسه (${minsUntil > 0 ? `${toPersian(Math.ceil(minsUntil))} دقیقه دیگر` : 'تمام شد'})`}
            </button>
          )}
          <button
            onClick={() => router.push(`/coach-messages/${item.client.id}`)}
            className="px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
          >
            💬 پیام
          </button>
        </div>
      )}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────

function EmptyState({ tab }: { tab: FilterTab }) {
  const MESSAGES: Record<FilterTab, { icon: string; title: string; sub: string }> = {
    upcoming:  { icon: '📅', title: 'جلسه پیش‌رویی ندارید', sub: 'وقتی رهجو رزرو کند اینجا نشان داده می‌شود' },
    completed: { icon: '✅', title: 'هنوز جلسه‌ای برگزار نشده', sub: 'جلسات تأیید‌شده اینجا می‌آیند' },
    cancelled: { icon: '🚫', title: 'جلسه لغو‌شده‌ای ندارید', sub: 'جلسات لغو‌شده یا غیبت اینجا ثبت می‌شوند' },
  }
  const m = MESSAGES[tab]
  return (
    <div
      className="rounded-2xl p-10 text-center"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
    >
      <p className="text-4xl mb-3">{m.icon}</p>
      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--content-primary)' }}>{m.title}</p>
      <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{m.sub}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'upcoming',  label: 'آینده'        },
  { key: 'completed', label: 'برگزار شده'  },
  { key: 'cancelled', label: 'لغو شده'     },
]

export default function CoachSessionsPage() {
  const [tab,        setTab]      = useState<FilterTab>('upcoming')
  const [sessions,   setSessions] = useState<SessionItem[]>([])
  const [loading,    setLoading]  = useState(true)

  const load = useCallback(async (t: FilterTab) => {
    const token = localStorage.getItem('mg_token')
    if (!token) return
    setLoading(true)
    const res  = await fetch(`/api/coaches/me/sessions?filter=${t}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.success) setSessions(json.data.sessions)
    setLoading(false)
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  // Split upcoming into today vs future
  const todaySessions  = tab === 'upcoming' ? sessions.filter((s) => isToday(s.sessionDate))   : []
  const futureSessions = tab === 'upcoming' ? sessions.filter((s) => !isToday(s.sessionDate))  : sessions

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-8">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>📅 جلسات</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
          مدیریت جلسات با رهجوها
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="flex rounded-xl p-1 mb-5 gap-1"
        style={{ background: 'var(--surface-secondary)' }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: tab === key ? 'var(--surface-card)' : 'transparent',
              color:      tab === key ? 'var(--content-primary)' : 'var(--content-tertiary)',
              boxShadow:  tab === key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--surface-secondary)' }} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-5">

          {/* Today's sessions (only for upcoming tab) */}
          {todaySessions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
                <h2 className="text-xs font-bold" style={{ color: '#10B981' }}>
                  جلسات امروز — {formatShortDate(new Date().toISOString())}
                </h2>
              </div>
              <div className="space-y-3">
                {todaySessions.map((s) => (
                  <SessionCard key={s.id} item={s} highlight />
                ))}
              </div>
            </section>
          )}

          {/* Future / other sessions */}
          {futureSessions.length > 0 && (
            <section>
              {tab === 'upcoming' && todaySessions.length > 0 && (
                <h2 className="text-xs font-semibold mb-3 px-1" style={{ color: 'var(--content-tertiary)' }}>
                  جلسات پیش‌رو
                </h2>
              )}

              {/* Group by date for upcoming tab */}
              {tab === 'upcoming' ? (
                <DateGroupedList sessions={futureSessions} />
              ) : (
                <div className="space-y-3">
                  {futureSessions.map((s) => (
                    <SessionCard key={s.id} item={s} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

// ── Date grouped list (for upcoming) ─────────────────────

function DateGroupedList({ sessions }: { sessions: SessionItem[] }) {
  const groups: { date: string; items: SessionItem[] }[] = []
  sessions.forEach((s) => {
    const d = s.sessionDate.slice(0, 10)
    const g = groups.find((g) => g.date === d)
    if (g) g.items.push(s)
    else groups.push({ date: d, items: [s] })
  })

  return (
    <div className="space-y-5">
      {groups.map(({ date, items }) => (
        <div key={date}>
          <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--content-tertiary)' }}>
            {formatFullDate(date)}
          </p>
          <div className="space-y-3">
            {items.map((s) => (
              <SessionCard key={s.id} item={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
