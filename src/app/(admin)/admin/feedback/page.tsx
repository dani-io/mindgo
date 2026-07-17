'use client'

import { useCallback, useEffect, useState } from 'react'

interface FeedbackItem {
  id:            string
  type:          'bug' | 'suggestion' | 'comment'
  content:       string
  screenshotUrl: string | null
  pageUrl:       string | null
  isAnonymous:   boolean
  status:        'new' | 'reviewed' | 'resolved'
  adminNotes:    string | null
  createdAt:     string
  userName:      string | null
  userPhone:     string | null
}

interface Counts { all: number; new: number; reviewed: number; resolved: number }

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  bug:        { label: 'باگ',     icon: '🐛', color: '#EF4444' },
  suggestion: { label: 'پیشنهاد', icon: '💡', color: '#F59E0B' },
  comment:    { label: 'نظر',     icon: '💬', color: '#3B82F6' },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  new:      { label: 'جدید',      color: '#8B5CF6' },
  reviewed: { label: 'بررسی شده', color: '#3B82F6' },
  resolved: { label: 'حل شده',    color: '#10B981' },
}

const FILTER_TABS: { key: string; label: string }[] = [
  { key: 'all',      label: 'همه' },
  { key: 'new',      label: 'جدید' },
  { key: 'reviewed', label: 'بررسی شده' },
  { key: 'resolved', label: 'حل شده' },
]

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

export default function AdminFeedbackPage() {
  const [items,    setItems]    = useState<FeedbackItem[]>([])
  const [counts,   setCounts]   = useState<Counts>({ all: 0, new: 0, reviewed: 0, resolved: 0 })
  const [filter,   setFilter]   = useState('all')
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async (f: string) => {
    setLoading(true)
    try {
      const qs = f === 'all' ? '' : `?status=${f}`
      const res  = await fetch(`/api/admin/feedback${qs}`)
      const json = await res.json()
      if (json.success) { setItems(json.data); setCounts(json.counts) }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  async function patch(id: string, body: { status?: string; adminNotes?: string }) {
    setSavingId(id)
    try {
      const res  = await fetch(`/api/admin/feedback/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...json.data } : it))
        load(filter) // refresh counts
      }
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div style={{ direction: 'rtl' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--content-primary)' }}>📝 بازخوردها</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--content-secondary)' }}>گزارش باگ، پیشنهاد و نظرات کاربران</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTER_TABS.map((t) => {
          const active = filter === t.key
          const n = counts[t.key as keyof Counts]
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: active ? '#10B981' : 'var(--surface-card)',
                color:      active ? '#fff' : 'var(--content-secondary)',
                border:     `1px solid ${active ? '#10B981' : 'var(--border-color)'}`,
              }}
            >
              {t.label} {typeof n === 'number' ? `(${n.toLocaleString('fa-IR')})` : ''}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>بازخوردی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((f) => {
            const tm = TYPE_META[f.type]
            const sm = STATUS_META[f.status]
            const isOpen = expanded === f.id
            return (
              <div
                key={f.id}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                {/* Row */}
                <button
                  onClick={() => { setExpanded(isOpen ? null : f.id); setNotesDraft((d) => ({ ...d, [f.id]: f.adminNotes ?? '' })) }}
                  className="w-full text-right p-4 flex items-start gap-3"
                >
                  <span className="text-xl flex-shrink-0">{tm.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${tm.color}20`, color: tm.color }}>{tm.label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${sm.color}20`, color: sm.color }}>{sm.label}</span>
                    </div>
                    <p className="text-sm truncate" style={{ color: 'var(--content-primary)' }}>{f.content}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--content-tertiary)' }}>
                      {f.isAnonymous ? 'ناشناس' : (f.userName ?? f.userPhone ?? 'کاربر')} · {fmtDate(f.createdAt)}
                    </p>
                  </div>
                  <span style={{ color: 'var(--content-tertiary)' }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--content-primary)' }}>{f.content}</p>

                    {f.pageUrl && (
                      <p className="text-xs" style={{ color: 'var(--content-tertiary)', direction: 'ltr', textAlign: 'right', wordBreak: 'break-all' }}>
                        🔗 {f.pageUrl}
                      </p>
                    )}

                    {f.screenshotUrl && (
                      <a href={f.screenshotUrl} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.screenshotUrl} alt="screenshot" className="rounded-lg max-h-60 border" style={{ borderColor: 'var(--border-color)' }} />
                      </a>
                    )}

                    {/* Admin notes */}
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: 'var(--content-tertiary)' }}>یادداشت ادمین</label>
                      <textarea
                        rows={2}
                        value={notesDraft[f.id] ?? ''}
                        onChange={(e) => setNotesDraft((d) => ({ ...d, [f.id]: e.target.value }))}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
                        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
                      />
                      <button
                        onClick={() => patch(f.id, { adminNotes: notesDraft[f.id] ?? '' })}
                        disabled={savingId === f.id}
                        className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
                      >
                        ذخیره یادداشت
                      </button>
                    </div>

                    {/* Status buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => patch(f.id, { status: 'reviewed' })}
                        disabled={savingId === f.id || f.status === 'reviewed'}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={{ background: f.status === 'reviewed' ? 'rgba(59,130,246,0.15)' : 'var(--surface-secondary)', color: '#3B82F6', opacity: f.status === 'reviewed' ? 0.6 : 1 }}
                      >
                        بررسی شده ✅
                      </button>
                      <button
                        onClick={() => patch(f.id, { status: 'resolved' })}
                        disabled={savingId === f.id || f.status === 'resolved'}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                        style={{ background: '#10B981', opacity: f.status === 'resolved' ? 0.6 : 1 }}
                      >
                        حل شده ✅✅
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
