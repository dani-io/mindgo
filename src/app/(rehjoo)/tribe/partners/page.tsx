'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/layout/ThemeToggle'

interface Partner {
  id:        string
  name:      string | null
  avatarUrl: string | null
  streakCount: number
}

interface PartnershipData {
  id:                  string
  sharedGoal:          string | null
  createdAt:           string
  partner:             Partner
  myCheckinToday:      boolean
  partnerCheckinToday: boolean
}

function toPersian(n: number) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function Avatar({ user }: { user: Partner | null }) {
  if (!user) return null
  const initials = user.name ? user.name.charAt(0) : '؟'
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
      style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
      ) : initials}
    </div>
  )
}

export default function PartnersPage() {
  const router  = useRouter()
  const [data,     setData]     = useState<PartnershipData | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [waiting,  setWaiting]  = useState(false)
  const [checking, setChecking] = useState(false)
  const [goal,     setGoal]     = useState('')
  const [showFind, setShowFind] = useState(false)

  async function load() {
    const token = localStorage.getItem('mg_token')
    if (!token) { router.push('/login'); return }
    const res  = await fetch('/api/partners/me', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.success && json.data) setData(json.data)
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFind() {
    const token = localStorage.getItem('mg_token')
    if (!token) return
    setChecking(true)
    const res  = await fetch('/api/partners/find', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ sharedGoal: goal.trim() }),
    })
    const json = await res.json()
    setChecking(false)
    setShowFind(false)
    if (json.success) {
      if (json.data.waiting) {
        setWaiting(true)
      } else {
        await load()
      }
    }
  }

  async function handleCheckin() {
    if (!data) return
    const token = localStorage.getItem('mg_token')
    if (!token) return
    setChecking(true)
    const res = await fetch(`/api/partners/${data.id}/checkin`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      setData((prev) => prev ? { ...prev, myCheckinToday: true } : prev)
    }
    setChecking(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--surface-primary)' }}>
        <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: 'var(--surface-secondary)' }} />
      </div>
    )
  }

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
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>🤝 پارتنر پاسخگویی</h1>
        </div>
        <ThemeToggle compact />
      </div>

      {/* What is this? */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--content-secondary)' }}>
          پارتنر پاسخگویی یک هم‌مسیر است که با هم تعهد می‌دید، روزانه چک‌این می‌کنید و از پیشرفت هم خبر دارید. تنها ماندنی‌ترین راه رشد.
        </p>
      </div>

      {waiting ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse"
            style={{ background: 'rgba(245,158,11,0.15)' }}>
            ⏳
          </div>
          <h2 className="font-bold text-base mb-2" style={{ color: 'var(--content-primary)' }}>در حال پیدا کردن پارتنر...</h2>
          <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>
            به محض اینکه هم‌مسیر مناسبی پیدا شد، اطلاع می‌دیم.
          </p>
        </div>
      ) : data ? (
        <div className="space-y-4">

          {/* Partner card */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
          >
            <p className="text-xs font-semibold mb-4" style={{ color: 'var(--content-secondary)' }}>پارتنر فعال</p>
            <div className="flex items-center gap-4">
              <Avatar user={data.partner} />
              <div className="flex-1">
                <p className="font-bold" style={{ color: 'var(--content-primary)' }}>
                  {data.partner.name ?? 'هم‌مسیر'}
                </p>
                <p className="text-sm" style={{ color: '#F59E0B' }}>
                  🔥 {toPersian(data.partner.streakCount)} روز زنجیره
                </p>
              </div>
              {data.partnerCheckinToday ? (
                <span
                  className="text-xs px-3 py-1.5 rounded-full font-bold"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                >
                  ✅ امروز
                </span>
              ) : (
                <span
                  className="text-xs px-3 py-1.5 rounded-full font-bold"
                  style={{ background: 'var(--surface-secondary)', color: 'var(--content-tertiary)' }}
                >
                  ⏳ منتظر
                </span>
              )}
            </div>

            {data.sharedGoal && (
              <div
                className="mt-4 rounded-xl p-3"
                style={{ background: 'var(--surface-secondary)' }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--content-tertiary)' }}>هدف مشترک</p>
                <p className="text-sm" style={{ color: 'var(--content-primary)' }}>{data.sharedGoal}</p>
              </div>
            )}
          </div>

          {/* My check-in */}
          <button
            onClick={handleCheckin}
            disabled={data.myCheckinToday || checking}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.99]"
            style={{
              background: data.myCheckinToday ? 'rgba(16,185,129,0.1)' : '#10B981',
              color:      data.myCheckinToday ? '#10B981' : 'white',
              opacity:    checking ? 0.7 : 1,
            }}
          >
            {data.myCheckinToday ? '✅ امروز انجام دادم — ثبت شد' : '✅ امروز انجام دادم'}
          </button>

          {/* Chat link */}
          <button
            onClick={() => router.push('/messages')}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
          >
            💬 گفتگو با پارتنر
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-5xl mb-4">🤝</p>
          <h2 className="font-bold text-base mb-2" style={{ color: 'var(--content-primary)' }}>هنوز پارتنر نداری</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--content-tertiary)' }}>
            سیستم به صورت خودکار یک هم‌مسیر با اهداف مشابه برایت پیدا می‌کند.
          </p>
          <button
            onClick={() => setShowFind(true)}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: '#10B981' }}
          >
            🔍 پیدا کردن پارتنر
          </button>
        </div>
      )}

      {/* Find partner modal */}
      {showFind && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowFind(false)}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl p-6 pb-10"
            style={{ background: 'var(--surface-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border-color)' }} />
            <h2 className="font-bold text-base mb-4 text-center" style={{ color: 'var(--content-primary)' }}>
              🎯 هدف مشترک
            </h2>
            <p className="text-sm mb-4 text-center" style={{ color: 'var(--content-tertiary)' }}>
              هدفت رو بنویس تا با کسی که هدف مشابهی داره جور بشی (اختیاری)
            </p>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="مثلاً: هر روز صبح ورزش کنم"
              rows={3}
              className="w-full rounded-xl p-3 text-sm resize-none mb-4"
              style={{
                background: 'var(--surface-secondary)',
                border:     '1px solid var(--border-color)',
                color:      'var(--content-primary)',
                outline:    'none',
              }}
            />
            <button
              onClick={handleFind}
              disabled={checking}
              className="w-full py-3 rounded-xl font-bold text-white transition-all"
              style={{ background: checking ? '#6B7280' : '#10B981' }}
            >
              {checking ? 'در حال جستجو...' : 'شروع جستجو'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
