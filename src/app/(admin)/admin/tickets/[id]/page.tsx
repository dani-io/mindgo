'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface Ticket {
  id:         string
  status:     TicketStatus
  category:   string
  priority:   string
  subject:    string
  createdAt:  string
  resolvedAt: string | null
  user:       { id: string; name: string | null; phone: string }
  agent:      { id: string; name: string | null } | null
}

interface Msg {
  id:         string
  content:    string
  senderId:   string
  createdAt:  string
  isFromUser: boolean
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open:        'باز',
  in_progress: 'در جریان',
  resolved:    'حل شده',
  closed:      'بسته شده',
}
const STATUS_COLORS: Record<TicketStatus, string> = {
  open:        '#3B82F6',
  in_progress: '#F59E0B',
  resolved:    '#10B981',
  closed:      '#94A3B8',
}

function formatTime(iso: string): string {
  const d    = new Date(iso)
  const now  = new Date()
  const same = d.toDateString() === now.toDateString()
  if (same) return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
}

export default function AdminTicketDetailPage() {
  const router  = useRouter()
  const { id }  = useParams<{ id: string }>()

  const [ticket,     setTicket]     = useState<Ticket | null>(null)
  const [messages,   setMessages]   = useState<Msg[]>([])
  const [loading,    setLoading]    = useState(true)
  const [replyText,  setReplyText]  = useState('')
  const [sending,    setSending]    = useState(false)
  const [updating,   setUpdating]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const res  = await fetch(`/api/admin/tickets/${id}`)
    const json = await res.json()
    if (json.success) {
      setTicket(json.data.ticket)
      setMessages(json.data.messages)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 5000)
    return () => clearInterval(iv)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendReply() {
    if (!replyText.trim() || sending) return
    setSending(true)
    const text = replyText.trim()
    setReplyText('')

    // Optimistic
    const tempMsg: Msg = {
      id: `temp-${Date.now()}`, content: text, senderId: 'admin',
      createdAt: new Date().toISOString(), isFromUser: false,
    }
    setMessages((prev) => [...prev, tempMsg])

    const res  = await fetch(`/api/admin/tickets/${id}/reply`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content: text }),
    })
    const json = await res.json()
    if (json.success) {
      setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? { ...tempMsg, id: json.data.id } : m))
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      setReplyText(text)
    }
    setSending(false)
  }

  async function updateStatus(newStatus: TicketStatus) {
    if (!ticket || updating) return
    setUpdating(true)
    const res  = await fetch(`/api/admin/tickets/${id}/status`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
    })
    const json = await res.json()
    if (json.success) setTicket((t) => t ? { ...t, status: newStatus } : t)
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-3">
        {[80, 300, 60].map((h, i) => (
          <div key={i} className="rounded-2xl animate-pulse" style={{ height: h, background: 'var(--surface-card)' }} />
        ))}
      </div>
    )
  }

  if (!ticket) return (
    <div className="text-center py-20">
      <p className="text-4xl mb-3">🔍</p>
      <p style={{ color: 'var(--content-secondary)' }}>تیکت یافت نشد</p>
      <button onClick={() => router.back()} className="mt-4 text-sm" style={{ color: '#10B981' }}>بازگشت</button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--surface-secondary)' }}
          >
            ›
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>
              {ticket.user.name ?? ticket.user.phone}
            </h1>
            <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
              {ticket.user.phone} · {ticket.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${STATUS_COLORS[ticket.status]}22`, color: STATUS_COLORS[ticket.status] }}
          >
            {STATUS_LABELS[ticket.status]}
          </span>
        </div>
      </div>

      {/* Status actions */}
      <div
        className="rounded-2xl p-4 flex items-center gap-3 flex-wrap"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>تغییر وضعیت:</span>
        {(['open', 'in_progress', 'resolved', 'closed'] as TicketStatus[]).map((s) => (
          <button
            key={s}
            disabled={ticket.status === s || updating}
            onClick={() => updateStatus(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: ticket.status === s ? `${STATUS_COLORS[s]}22` : 'var(--surface-secondary)',
              color:      ticket.status === s ? STATUS_COLORS[s] : 'var(--content-tertiary)',
              opacity:    updating ? 0.6 : 1,
            }}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Chat thread */}
      <div
        className="rounded-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', minHeight: 400, maxHeight: '60vh' }}
      >
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ direction: 'rtl' }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <p className="text-3xl">💬</p>
              <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>هنوز پیامی وجود ندارد</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="flex"
                style={{ justifyContent: msg.isFromUser ? 'flex-start' : 'flex-end' }}
              >
                <div
                  className="max-w-[70%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl"
                  style={{
                    background:   msg.isFromUser ? 'var(--surface-secondary)' : '#10B981',
                    color:        msg.isFromUser ? 'var(--content-primary)'   : 'white',
                    borderRadius: msg.isFromUser ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                  }}
                >
                  <p>{msg.content}</p>
                  <p
                    className="text-[10px] mt-1 opacity-70"
                    style={{ textAlign: msg.isFromUser ? 'right' : 'left' }}
                  >
                    {msg.isFromUser ? '👤 کاربر' : '🛟 پشتیبانی'} · {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply input */}
        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
          <div
            className="flex gap-2 p-3"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <textarea
              rows={2}
              placeholder="پاسخ پشتیبانی..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
              className="flex-1 rounded-xl px-3 py-2 text-sm outline-none resize-none"
              style={{
                background: 'var(--surface-secondary)',
                border:     '1px solid var(--border-color)',
                color:      'var(--content-primary)',
                direction:  'rtl',
              }}
            />
            <button
              onClick={sendReply}
              disabled={!replyText.trim() || sending}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: replyText.trim() && !sending ? '#10B981' : 'var(--surface-secondary)',
                color:      replyText.trim() && !sending ? 'white' : 'var(--content-tertiary)',
              }}
            >
              {sending ? '...' : 'ارسال'}
            </button>
          </div>
        )}

        {(ticket.status === 'resolved' || ticket.status === 'closed') && (
          <div
            className="px-4 py-3 text-sm text-center"
            style={{ borderTop: '1px solid var(--border-color)', color: 'var(--content-tertiary)' }}
          >
            این تیکت {ticket.status === 'resolved' ? 'حل شده' : 'بسته'} است
          </div>
        )}
      </div>

    </div>
  )
}
