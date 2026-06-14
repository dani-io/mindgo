'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type TicketStatus   = 'open' | 'in_progress' | 'resolved' | 'closed'
type TicketCategory = 'technical' | 'financial' | 'general'
type TicketPriority = 'low' | 'medium' | 'high'

interface Ticket {
  id:          string
  status:      TicketStatus
  category:    TicketCategory
  priority:    TicketPriority
  subject:     string
  createdAt:   string
  resolvedAt:  string | null
  user:        { id: string; name: string | null; phone: string }
  agent:       { id: string; name: string | null } | null
  lastMessage: { content: string; sentAt: string; isFromUser: boolean } | null
  unreadCount: number
}

type Filter = 'open' | 'in_progress' | 'resolved' | 'all'

const STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; color: string }> = {
  open:        { label: 'باز',        bg: 'rgba(59,130,246,0.15)',  color: '#3B82F6' },
  in_progress: { label: 'در جریان',  bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B' },
  resolved:    { label: 'حل شده',    bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
  closed:      { label: 'بسته شده', bg: 'rgba(148,163,184,0.15)', color: '#94A3B8' },
}

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low:    { label: 'کم',   color: '#94A3B8' },
  medium: { label: 'متوسط', color: '#F59E0B' },
  high:   { label: 'زیاد', color: '#EF4444' },
}

function formatTime(iso: string): string {
  const d    = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'الان'
  if (mins < 60) return `${mins} دق پیش`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs} س پیش`
  return `${Math.floor(hrs / 24)} روز پیش`
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'open',        label: 'باز' },
  { key: 'in_progress', label: 'در جریان' },
  { key: 'resolved',    label: 'حل شده' },
  { key: 'all',         label: 'همه' },
]

export default function AdminTicketsPage() {
  const router  = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<Filter>('open')

  async function load(f: Filter) {
    setLoading(true)
    const res  = await fetch(`/api/admin/tickets?status=${f}`)
    const json = await res.json()
    if (json.success) setTickets(json.data)
    setLoading(false)
  }

  useEffect(() => { load(filter) }, [filter])

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>🎫 تیکت‌های پشتیبانی</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
            {tickets.length} تیکت
          </p>
        </div>
        <button
          onClick={() => load(filter)}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
        >
          🔄 بارگذاری مجدد
        </button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex rounded-xl p-1 mb-5 gap-1"
        style={{ background: 'var(--surface-secondary)', width: 'fit-content' }}
      >
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: filter === key ? 'var(--surface-card)' : 'transparent',
              color:      filter === key ? 'var(--content-primary)' : 'var(--content-tertiary)',
              boxShadow:  filter === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--surface-card)' }} />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-semibold" style={{ color: 'var(--content-primary)' }}>تیکتی در این دسته نیست</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const sc = STATUS_CONFIG[t.status]
            const pc = PRIORITY_CONFIG[t.priority]
            return (
              <button
                key={t.id}
                onClick={() => router.push(`/admin/tickets/${t.id}`)}
                className="w-full rounded-2xl p-4 text-right transition-all hover:shadow-md active:scale-[0.99]"
                style={{ background: 'var(--surface-card)', border: `1px solid ${t.unreadCount > 0 ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}` }}
              >
                <div className="flex items-start gap-3">
                  {/* Unread dot + avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                    >
                      {(t.user.name || t.user.phone).charAt(0)}
                    </div>
                    {t.unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{ background: '#EF4444', color: 'white' }}
                      >
                        {t.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
                        {t.user.name ?? t.user.phone}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {sc.label}
                      </span>
                      {t.priority !== 'medium' && (
                        <span className="text-[10px] font-bold" style={{ color: pc.color }}>
                          ● {pc.label}
                        </span>
                      )}
                      {t.agent && (
                        <span className="text-[10px]" style={{ color: 'var(--content-tertiary)' }}>
                          👤 {t.agent.name}
                        </span>
                      )}
                    </div>
                    {t.lastMessage ? (
                      <p className="text-xs truncate" style={{ color: 'var(--content-secondary)' }}>
                        {t.lastMessage.isFromUser ? '👤 ' : '🛟 '}
                        {t.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>پیامی ارسال نشده</p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px]" style={{ color: 'var(--content-tertiary)' }}>
                      {formatTime(t.lastMessage?.sentAt ?? t.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
