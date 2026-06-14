'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/layout/ThemeToggle'

interface Notif {
  id:       string
  category: string
  title:    string
  body:     string
  isRead:   boolean
  sentAt:   string
}

interface Grouped {
  today:    Notif[]
  thisWeek: Notif[]
  older:    Notif[]
}

const CATEGORY_ICONS: Record<string, string> = {
  session_reminder: '🔔',
  booking_confirmed: '✅',
  payout:           '💰',
  challenge:        '🏆',
  streak_alert:     '🔥',
  new_message:      '💬',
  support_reply:    '🛟',
  system:           '🔔',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'الان'
  if (mins < 60) return `${String(mins).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])} دقیقه پیش`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${String(hrs).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])} ساعت پیش`
  const days = Math.floor(hrs / 24)
  return `${String(days).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])} روز پیش`
}

function NotifItem({
  notif,
  onRead,
}: {
  notif:  Notif
  onRead: (id: string) => void
}) {
  return (
    <button
      onClick={() => !notif.isRead && onRead(notif.id)}
      className="w-full flex items-start gap-3 p-4 text-right transition-all"
      style={{
        background: notif.isRead ? 'transparent' : 'rgba(16,185,129,0.04)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
        style={{ background: 'var(--surface-secondary)' }}
      >
        {CATEGORY_ICONS[notif.category] ?? '🔔'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>{notif.title}</p>
          {!notif.isRead && (
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10B981' }} />
          )}
        </div>
        <p className="text-xs leading-relaxed mb-1" style={{ color: 'var(--content-secondary)' }}>{notif.body}</p>
        <p className="text-[10px]" style={{ color: 'var(--content-tertiary)' }}>{timeAgo(notif.sentAt)}</p>
      </div>
    </button>
  )
}

function GroupSection({ title, items, onRead }: { title: string; items: Notif[]; onRead: (id: string) => void }) {
  if (items.length === 0) return null
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold px-1 mb-2" style={{ color: 'var(--content-tertiary)' }}>{title}</p>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
        {items.map((n) => <NotifItem key={n.id} notif={n} onRead={onRead} />)}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [grouped,     setGrouped]     = useState<Grouped>({ today: [], thisWeek: [], older: [] })
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('mg_token')
      if (!token) { router.push('/login'); return }
      const res  = await fetch('/api/notifications/me', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) {
        setGrouped(json.data.grouped)
        setUnreadCount(json.data.unreadCount)
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function markRead(id: string) {
    const token = localStorage.getItem('mg_token')
    if (!token) return
    // Optimistic
    const mark = (list: Notif[]) => list.map((n) => n.id === id ? { ...n, isRead: true } : n)
    setGrouped((prev) => ({ today: mark(prev.today), thisWeek: mark(prev.thisWeek), older: mark(prev.older) }))
    setUnreadCount((c) => Math.max(0, c - 1))
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
  }

  async function markAllRead() {
    const token = localStorage.getItem('mg_token')
    if (!token) return
    const markAll = (list: Notif[]) => list.map((n) => ({ ...n, isRead: true }))
    setGrouped((prev) => ({ today: markAll(prev.today), thisWeek: markAll(prev.thisWeek), older: markAll(prev.older) }))
    setUnreadCount(0)
    await fetch('/api/notifications/read-all', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
  }

  const total = grouped.today.length + grouped.thisWeek.length + grouped.older.length

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">

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
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>
            🔔 اعلان‌ها
            {unreadCount > 0 && (
              <span
                className="inline-flex items-center justify-center text-xs font-bold px-2 py-0.5 rounded-full mr-2"
                style={{ background: '#EF4444', color: 'white', fontSize: 11 }}
              >
                {String(unreadCount).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
            >
              همه خوانده شد
            </button>
          )}
          <ThemeToggle compact />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--surface-secondary)' }} />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔕</p>
          <p className="font-semibold mb-1" style={{ color: 'var(--content-primary)' }}>اعلانی نداری</p>
          <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>وقتی اتفاقی بیفته اینجا میاد</p>
        </div>
      ) : (
        <>
          <GroupSection title="امروز"       items={grouped.today}    onRead={markRead} />
          <GroupSection title="این هفته"   items={grouped.thisWeek} onRead={markRead} />
          <GroupSection title="قدیمی‌تر"   items={grouped.older}    onRead={markRead} />
        </>
      )}
    </div>
  )
}
