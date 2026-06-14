'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/layout/ThemeToggle'

type ContentType = 'podcast' | 'video' | 'book_summary'

interface ContentItem {
  id:              string
  title:           string
  description:     string | null
  type:            ContentType
  durationMinutes: number
  category:        string
  thumbnailUrl:    string | null
  mediaUrl:        string | null
  author:          string | null
  viewCount:       number
  isBookmarked:    boolean
}

const TYPE_LABELS: Record<ContentType | 'all', string> = {
  all:          'همه',
  podcast:      'پادکست',
  video:        'ویدیو',
  book_summary: 'خلاصه کتاب',
}

const TYPE_ICONS: Record<ContentType, string> = {
  podcast:      '🎧',
  video:        '🎬',
  book_summary: '📚',
}

const CATEGORY_COLORS: Record<string, string> = {
  'لایف کوچینگ':    '#10B981',
  'بیزینس':          '#3B82F6',
  'سلامت':           '#8B5CF6',
  'مدیریت زمان':    '#F59E0B',
  'روابط':          '#EF4444',
}

function toPersian(n: number) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatDuration(mins: number) {
  if (mins < 60) return `${toPersian(mins)} دقیقه`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${toPersian(h)} ساعت ${toPersian(m)} دقیقه` : `${toPersian(h)} ساعت`
}

export default function LearnPage() {
  const router = useRouter()
  const [items,     setItems]     = useState<ContentItem[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<ContentType | 'all'>('all')
  const [bookmarks, setBookmarks] = useState<boolean>(false)
  const [selected,  setSelected]  = useState<ContentItem | null>(null)

  const load = useCallback(async () => {
    const token = localStorage.getItem('mg_token')
    if (!token) { router.push('/login'); return }
    setLoading(true)
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('type', filter)
    if (bookmarks) params.set('bookmarked', 'true')
    const res  = await fetch(`/api/content?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.success) setItems(json.data)
    setLoading(false)
  }, [router, filter, bookmarks])

  useEffect(() => { load() }, [load])

  async function toggleBookmark(item: ContentItem, e: React.MouseEvent) {
    e.stopPropagation()
    const token = localStorage.getItem('mg_token')
    if (!token) return
    // Optimistic
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isBookmarked: !i.isBookmarked } : i))
    if (selected?.id === item.id) setSelected({ ...item, isBookmarked: !item.isBookmarked })
    await fetch(`/api/content/${item.id}/bookmark`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {
      // Revert on failure
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isBookmarked: item.isBookmarked } : i))
    })
  }

  const FILTERS: (ContentType | 'all')[] = ['all', 'podcast', 'video', 'book_summary']

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8" style={{ minHeight: '100vh' }}>

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
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>📖 دوز آگاهی</h1>
        </div>
        <ThemeToggle compact />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setBookmarks(false) }}
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
            style={{
              background: filter === f && !bookmarks ? '#10B981' : 'var(--surface-secondary)',
              color:      filter === f && !bookmarks ? 'white' : 'var(--content-secondary)',
            }}
          >
            {f !== 'all' && TYPE_ICONS[f as ContentType]} {TYPE_LABELS[f]}
          </button>
        ))}
        <button
          onClick={() => { setBookmarks(!bookmarks); setFilter('all') }}
          className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
          style={{
            background: bookmarks ? '#F59E0B' : 'var(--surface-secondary)',
            color:      bookmarks ? 'white' : 'var(--content-secondary)',
          }}
        >
          🔖 ذخیره‌ها
        </button>
      </div>

      {/* Content feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--surface-secondary)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>
            {bookmarks ? 'هیچ محتوایی ذخیره نکردی' : 'محتوایی موجود نیست'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="w-full rounded-2xl p-4 text-right transition-all active:scale-[0.99]"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail / icon */}
                <div
                  className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
                  style={{ background: 'var(--surface-secondary)' }}
                >
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    TYPE_ICONS[item.type]
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: `${CATEGORY_COLORS[item.category] ?? '#10B981'}22`,
                        color:      CATEGORY_COLORS[item.category] ?? '#10B981',
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-tight mb-1 text-right" style={{ color: 'var(--content-primary)' }}>
                    {item.title}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                      ⏱ {formatDuration(item.durationMinutes)}
                    </span>
                    {item.author && (
                      <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                        · {item.author}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => toggleBookmark(item, e)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-lg transition-all"
                  style={{ background: item.isBookmarked ? 'rgba(245,158,11,0.15)' : 'var(--surface-secondary)' }}
                >
                  {item.isBookmarked ? '🔖' : '📌'}
                </button>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl p-6 pb-10"
            style={{ background: 'var(--surface-card)', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--border-color)' }} />

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl"
                style={{ background: 'var(--surface-secondary)' }}
              >
                {selected.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.thumbnailUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  TYPE_ICONS[selected.type]
                )}
              </div>
              <div className="flex-1">
                <span
                  className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1"
                  style={{
                    background: `${CATEGORY_COLORS[selected.category] ?? '#10B981'}22`,
                    color:      CATEGORY_COLORS[selected.category] ?? '#10B981',
                  }}
                >
                  {selected.category}
                </span>
                <h2 className="text-base font-bold" style={{ color: 'var(--content-primary)' }}>{selected.title}</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
                  {selected.author && `${selected.author} · `}{formatDuration(selected.durationMinutes)}
                </p>
              </div>
            </div>

            {selected.description && (
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--content-secondary)' }}>
                {selected.description}
              </p>
            )}

            {/* Player placeholder */}
            {selected.mediaUrl ? (
              <div className="mb-4">
                {selected.type === 'podcast' || selected.type === 'book_summary' ? (
                  <audio controls className="w-full" src={selected.mediaUrl} style={{ borderRadius: 12 }} />
                ) : (
                  <video controls className="w-full rounded-xl" src={selected.mediaUrl} style={{ maxHeight: 240 }} />
                )}
              </div>
            ) : (
              <div
                className="rounded-xl p-4 mb-4 text-center"
                style={{ background: 'var(--surface-secondary)' }}
              >
                <p className="text-3xl mb-2">{TYPE_ICONS[selected.type]}</p>
                <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>لینک رسانه هنوز اضافه نشده</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={(e) => { toggleBookmark(selected, e) }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: selected.isBookmarked ? 'rgba(245,158,11,0.15)' : 'var(--surface-secondary)',
                  color:      selected.isBookmarked ? '#F59E0B' : 'var(--content-secondary)',
                }}
              >
                {selected.isBookmarked ? '🔖 ذخیره شد' : '📌 ذخیره در کتابخانه'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
