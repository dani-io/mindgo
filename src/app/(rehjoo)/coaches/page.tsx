'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────

interface Spec { id: string; name: string; slug: string; icon: string | null }

interface Coach {
  id:            string
  name:          string
  shortBio:      string | null
  genderAccept:  'all' | 'female_only' | 'male_only'
  totalSessions: number
  avgRating:     number
  specializations: Spec[]
}

// ── Helpers ───────────────────────────────────────────────

function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

const GENDER_LABEL: Record<string, string> = {
  all:         'خانم‌ها و آقایان',
  female_only: 'اختصاصی خانم‌ها',
  male_only:   'اختصاصی آقایان',
}
const GENDER_COLOR: Record<string, string> = {
  all:         'rgba(59,130,246,0.15)',
  female_only: 'rgba(236,72,153,0.15)',
  male_only:   'rgba(99,102,241,0.15)',
}
const GENDER_TEXT: Record<string, string> = {
  all:         '#3B82F6',
  female_only: '#EC4899',
  male_only:   '#6366F1',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      <span style={{ color: '#F59E0B' }}>⭐</span>
      <span className="text-xs font-bold" style={{ color: 'var(--content-primary)' }}>
        {rating.toFixed(1)}
      </span>
    </span>
  )
}

// ── Coach Card ────────────────────────────────────────────

function CoachCard({ coach, onClick }: { coach: Coach; onClick: () => void }) {
  const initial = coach.name.charAt(0)

  return (
    <button
      onClick={onClick}
      className="w-full text-right rounded-xl p-4 transition-all active:scale-[0.98]"
      style={{
        background: 'var(--surface-card)',
        border:     '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
        >
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + gender badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base" style={{ color: 'var(--content-primary)' }}>
              {coach.name}
            </span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: GENDER_COLOR[coach.genderAccept],
                color:      GENDER_TEXT[coach.genderAccept],
              }}
            >
              {GENDER_LABEL[coach.genderAccept]}
            </span>
          </div>

          {/* Short bio */}
          {coach.shortBio && (
            <p
              className="text-sm mt-1 leading-relaxed line-clamp-2"
              style={{ color: 'var(--content-secondary)' }}
            >
              {coach.shortBio}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-2">
            <StarRating rating={coach.avgRating} />
            <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
              {toPersian(coach.totalSessions)} جلسه
            </span>
          </div>

          {/* Spec tags */}
          {coach.specializations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {coach.specializations.slice(0, 3).map((s) => (
                <span
                  key={s.id}
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface-tertiary)', color: 'var(--content-secondary)' }}
                >
                  {s.icon} {s.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────

export default function CoachesPage() {
  const router = useRouter()

  const [coaches,   setCoaches]   = useState<Coach[]>([])
  const [specs,     setSpecs]     = useState<Spec[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [activeSpec, setActiveSpec] = useState('')
  const [genderFilter, setGenderFilter] = useState<'' | 'female_only'>('')

  const fetchSpecs = useCallback(async () => {
    try {
      const res  = await fetch('/api/marketplace/specializations')
      const json = await res.json()
      if (json.success) setSpecs(json.data)
    } catch { /* silent */ }
  }, [])

  const fetchCoaches = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)        params.set('search',         search)
      if (activeSpec)    params.set('specialization', activeSpec)
      if (genderFilter)  params.set('gender_accept',  genderFilter)
      const res  = await fetch(`/api/marketplace/coaches?${params}`)
      const json = await res.json()
      if (json.success) setCoaches(json.data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [search, activeSpec, genderFilter])

  useEffect(() => { fetchSpecs() }, [fetchSpecs])
  useEffect(() => { fetchCoaches() }, [fetchCoaches])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchCoaches(), 300)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">

      {/* Header */}
      <h1 className="text-2xl font-bold mb-5" style={{ color: 'var(--content-primary)' }}>
        راه‌بلدها
      </h1>

      {/* Search */}
      <div className="relative mb-4">
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none"
          style={{ color: 'var(--content-tertiary)' }}
        >
          🔍
        </span>
        <input
          type="search"
          placeholder="جستجو بر اساس نام یا تخصص..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl py-3 pr-10 pl-4 text-sm outline-none"
          style={{
            background: 'var(--surface-card)',
            border:     '1px solid var(--border-color)',
            color:      'var(--content-primary)',
          }}
        />
      </div>

      {/* Gender filter chips */}
      <div className="flex gap-2 mb-3">
        {([ ['', 'همه'], ['female_only', 'اختصاصی خانم‌ها'] ] as [string, string][]).map(([val, label]) => {
          const active = genderFilter === val
          return (
            <button
              key={val}
              onClick={() => setGenderFilter(val as '' | 'female_only')}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: active ? '#10B981' : 'var(--surface-card)',
                color:      active ? '#fff'     : 'var(--content-secondary)',
                border:     `1px solid ${active ? '#10B981' : 'var(--border-color)'}`,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Specialization chips — horizontal scroll */}
      {specs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveSpec('')}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: !activeSpec ? '#10B981' : 'var(--surface-card)',
              color:      !activeSpec ? '#fff'     : 'var(--content-secondary)',
              border:     `1px solid ${!activeSpec ? '#10B981' : 'var(--border-color)'}`,
            }}
          >
            همه تخصص‌ها
          </button>
          {specs.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSpec(activeSpec === s.slug ? '' : s.slug)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: activeSpec === s.slug ? '#10B981' : 'var(--surface-card)',
                color:      activeSpec === s.slug ? '#fff'     : 'var(--content-secondary)',
                border:     `1px solid ${activeSpec === s.slug ? '#10B981' : 'var(--border-color)'}`,
              }}
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl animate-pulse"
              style={{ background: 'var(--surface-card)' }}
            />
          ))}
        </div>
      ) : coaches.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--content-tertiary)' }}>
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">راه‌بلدی با این مشخصات یافت نشد</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs mb-1" style={{ color: 'var(--content-tertiary)' }}>
            {toPersian(coaches.length)} راه‌بلد یافت شد
          </p>
          {coaches.map((c) => (
            <CoachCard
              key={c.id}
              coach={c}
              onClick={() => router.push(`/coaches/${c.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
