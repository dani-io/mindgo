'use client'

import { useEffect, useState } from 'react'
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
  gratitude:  { label: 'شکرگزاری', placeholder: 'امروز برای چه چیزهایی سپاسگزارم...', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  reflection: { label: 'تأمل',     placeholder: 'امروز چه چیزی یاد گرفتم و چه احساسی دارم...', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  freewrite:  { label: 'نوشتار آزاد', placeholder: 'هر چیزی که به ذهنم می‌رسه، بدون قضاوت...', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
}

const TYPES: JournalType[] = ['gratitude', 'reflection', 'freewrite']

function toPersian(s: string | number) {
  return String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' })
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

  useEffect(() => {
    fetchEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchEntries() {
    setLoading(true)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/journal?limit=200', { headers: { Authorization: `Bearer ${token}` } })
      const json  = await res.json()
      if (json.success) setEntries(json.data)
    } finally {
      setLoading(false)
    }
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
        setSuccessMsg('یادداشت ثبت شد! 🌱')
        setTimeout(() => setSuccessMsg(''), 3000)
        await fetchEntries()
      }
    } finally {
      setSaving(false)
    }
  }

  // Calendar: last 30 days
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const entryDates = new Set(entries.map((e) => new Date(e.loggedDate).toISOString().slice(0, 10)))

  const calDays: { date: string; hasEntry: boolean }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
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
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)' }}
        >
          ›
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>📓 دفترچه افکار</h1>
          <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
            {toPersian(entries.length)} یادداشت ثبت شده
          </p>
        </div>
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
              <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                {toPersian(content.length)} کاراکتر
              </span>
              <button
                onClick={handleSave}
                disabled={saving || !content.trim()}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                style={{ background: saving || !content.trim() ? '#374151' : meta.color }}
              >
                {saving ? 'در حال ثبت...' : 'ثبت یادداشت'}
              </button>
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
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color:    'var(--content-primary)',
                    display:  expanded === entry.id ? 'block' : '-webkit-box',
                    WebkitLineClamp: expanded === entry.id ? undefined : 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: expanded === entry.id ? 'visible' : 'hidden',
                  }}
                >
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
