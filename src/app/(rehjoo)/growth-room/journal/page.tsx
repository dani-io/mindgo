'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type JournalType = 'gratitude' | 'reflection' | 'freewrite'

interface JournalEntry {
  id:         string
  type:       JournalType
  content:    string
  loggedDate: string
  createdAt:  string
}

const TYPE_META: Record<JournalType, { label: string; placeholder: string; color: string; bg: string }> = {
  gratitude:  { label: 'شکرگزاری',    placeholder: 'امروز برای چه چیزهایی سپاسگزارم...', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  reflection: { label: 'تأمل',        placeholder: 'امروز چه چیزی یاد گرفتم و چه احساسی دارم...', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  freewrite:  { label: 'نوشتار آزاد', placeholder: 'هر چیزی که به ذهنم می‌رسه، بدون قضاوت...', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
}

const TYPES: JournalType[] = ['gratitude', 'reflection', 'freewrite']
const DRAFT_KEY = 'journal_draft_v1'

function toPersian(s: string | number) {
  return String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' })
}

// ── Share icon ────────────────────────────────────────────

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 1l3 3-3 3" />
      <path d="M13 4H5a4 4 0 000 8h1" />
    </svg>
  )
}

// ── Save icon ─────────────────────────────────────────────

function SaveDraftIcon({ saved }: { saved: boolean }) {
  if (saved) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 8l4 4 8-8" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="1" width="12" height="14" rx="1.5" />
      <path d="M5 1v5h6V1" />
      <rect x="5" y="10" width="6" height="4" rx="0.5" />
    </svg>
  )
}

export default function JournalPage() {
  const router = useRouter()

  const [entries,     setEntries]     = useState<JournalEntry[]>([])
  const [activeType,  setActiveType]  = useState<JournalType>('gratitude')
  const [content,     setContent]     = useState('')
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [successMsg,  setSuccessMsg]  = useState('')
  const [draftSaved,  setDraftSaved]  = useState(false)

  // Share state
  const [coachUserId, setCoachUserId] = useState<string | null | undefined>(undefined) // undefined = not loaded
  const [sharingId,   setSharingId]   = useState<string | null>(null)
  const [shareToast,  setShareToast]  = useState<{ text: string; ok: boolean } | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/journal?limit=200', { headers: { Authorization: `Bearer ${token}` } })
      const json  = await res.json()
      if (json.success) setEntries(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Restore draft
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const { content: c, type: t } = JSON.parse(raw)
        if (c) setContent(c)
        if (t && (TYPES as string[]).includes(t)) setActiveType(t as JournalType)
      }
    } catch { /* ignore */ }

    fetchEntries()

    // Load coach for share feature
    ;(async () => {
      const token = localStorage.getItem('mg_token')
      if (!token) { setCoachUserId(null); return }
      try {
        const res  = await fetch('/api/bookings/me', { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        setCoachUserId(json.success && json.data ? json.data.coach.userId : null)
      } catch {
        setCoachUserId(null)
      }
    })()
  }, [fetchEntries])

  function saveDraft() {
    if (!content.trim()) return
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, type: activeType }))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }

  async function handleSave() {
    if (!content.trim()) return
    setSaving(true)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/journal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ type: activeType, content }),
      })
      const json = await res.json()
      if (json.success) {
        setContent('')
        localStorage.removeItem(DRAFT_KEY)
        setSuccessMsg('یادداشت ثبت شد! 🌱')
        setTimeout(() => setSuccessMsg(''), 3000)
        await fetchEntries()
      }
    } finally {
      setSaving(false)
    }
  }

  async function shareWithCoach(entry: JournalEntry) {
    if (coachUserId === undefined) return
    if (!coachUserId) {
      showShareToast('ابتدا یک کوچ انتخاب کنید', false)
      return
    }
    setSharingId(entry.id)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ receiver_id: coachUserId, content: entry.content }),
      })
      const json = await res.json()
      showShareToast(
        json.success ? 'یادداشت با کوچ به اشتراک گذاشته شد ✓' : (json.error?.message ?? 'خطا در ارسال'),
        json.success,
      )
    } catch {
      showShareToast('خطا در ارسال پیام', false)
    } finally {
      setSharingId(null)
    }
  }

  function showShareToast(text: string, ok: boolean) {
    setShareToast({ text, ok })
    setTimeout(() => setShareToast(null), 3500)
  }

  // Calendar: last 30 days
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const entryDates = new Set(entries.map((e) => new Date(e.loggedDate).toISOString().slice(0, 10)))

  const calDays: { date: string; hasEntry: boolean }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayDate)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    calDays.push({ date: ds, hasEntry: entryDates.has(ds) })
  }

  const filtered = entries.filter((e) => e.type === activeType)
  const meta     = TYPE_META[activeType]

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {/* Draft save — physical RIGHT in RTL (first in flex row = RTL start) */}
        <button
          onClick={saveDraft}
          disabled={!content.trim()}
          title="ذخیره موقت"
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{
            background: draftSaved ? 'rgba(16,185,129,0.12)' : 'var(--surface-secondary)',
            color:       draftSaved ? '#10B981' : content.trim() ? 'var(--content-secondary)' : 'var(--content-tertiary)',
            opacity:     content.trim() ? 1 : 0.45,
          }}
        >
          <SaveDraftIcon saved={draftSaved} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>📓 دفترچه افکار</h1>
          <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
            {toPersian(entries.length)} یادداشت ثبت شده
          </p>
        </div>

        {/* Back button — physical LEFT in RTL (last in flex row = RTL end) */}
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)' }}
        >
          ‹
        </button>
      </div>

      {/* Type tabs */}
      <div
        className="flex rounded-xl p-1 mb-5 gap-1"
        style={{ background: 'var(--surface-secondary)' }}
      >
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeType === t ? TYPE_META[t].bg : 'transparent',
              color:      activeType === t ? TYPE_META[t].color : 'var(--content-tertiary)',
            }}
          >
            {TYPE_META[t].label}
          </button>
        ))}
      </div>

      {/* Write area */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        {successMsg ? (
          <p className="text-sm text-center py-3" style={{ color: '#10B981' }}>{successMsg}</p>
        ) : (
          <>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={meta.placeholder}
              rows={4}
              className="w-full text-sm resize-none outline-none bg-transparent leading-relaxed"
              style={{ color: 'var(--content-primary)', direction: 'rtl' }}
            />
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              {/* Submit button — physical LEFT in RTL (last in flex row) */}
              <button
                onClick={handleSave}
                disabled={saving || !content.trim()}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                style={{ background: saving || !content.trim() ? '#374151' : meta.color }}
              >
                {saving ? 'در حال ثبت...' : 'ثبت یادداشت'}
              </button>
              <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                {toPersian(content.length)} کاراکتر
              </span>
            </div>
          </>
        )}
      </div>

      {/* Calendar */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
          ۳۰ روز گذشته
        </p>
        <div className="grid grid-cols-10 gap-1">
          {calDays.map(({ date, hasEntry }) => (
            <div
              key={date}
              className="aspect-square rounded"
              style={{ background: hasEntry ? '#10B981' : 'var(--surface-secondary)' }}
              title={new Date(date).toLocaleDateString('fa-IR')}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 text-[10px]" style={{ color: 'var(--content-tertiary)' }}>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded" style={{ background: '#10B981', display: 'inline-block' }} />
            یادداشت ثبت شده
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded" style={{ background: 'var(--surface-secondary)', display: 'inline-block' }} />
            بدون یادداشت
          </span>
        </div>
      </div>

      {/* Past entries */}
      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
          یادداشت‌های {meta.label}
        </p>
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 rounded-full animate-pulse mx-auto" style={{ background: 'var(--surface-secondary)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
          >
            <p className="text-2xl mb-2">{activeType === 'gratitude' ? '🙏' : activeType === 'reflection' ? '🪞' : '✍️'}</p>
            <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>
              هنوز یادداشتی ثبت نشده
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl p-4 cursor-pointer"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
              >
                {/* Card header: date + type badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--content-tertiary)' }}>
                    {formatDate(entry.loggedDate)}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>

                {/* Content */}
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color:           'var(--content-primary)',
                    display:         expanded === entry.id ? 'block' : '-webkit-box',
                    WebkitLineClamp: expanded === entry.id ? undefined : 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow:        expanded === entry.id ? 'visible' : 'hidden',
                  }}
                >
                  {entry.content}
                </p>

                {/* Share with coach button */}
                <div
                  className="flex items-center justify-end mt-3 pt-2"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); shareWithCoach(entry) }}
                    disabled={sharingId === entry.id || coachUserId === undefined}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all active:scale-95"
                    style={{
                      background: 'transparent',
                      color:      'var(--content-tertiary)',
                      border:     '1px solid var(--border-color)',
                      opacity:    sharingId === entry.id ? 0.6 : 1,
                    }}
                  >
                    {sharingId === entry.id ? (
                      <span>در حال ارسال...</span>
                    ) : (
                      <>
                        <ShareIcon />
                        <span>اشتراک با کوچ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share toast */}
      {shareToast && (
        <div
          className="fixed bottom-24 inset-x-4 mx-auto max-w-sm rounded-xl px-4 py-3 text-center text-sm font-medium shadow-lg z-50 transition-all"
          style={{
            background: shareToast.ok ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
            color:      '#fff',
          }}
        >
          {shareToast.text}
        </div>
      )}
    </div>
  )
}
