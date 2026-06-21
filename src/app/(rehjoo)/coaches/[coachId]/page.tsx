'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────

interface Spec        { id: string; name: string; slug: string; icon: string | null }
interface Certificate { id: string; title: string; issuer: string; year: number; verified: boolean }
interface Package     { id: string; name: string; description: string | null; sessionCount: number; durationMinutes: number; priceToman: number; includesChat: boolean; isIntro: boolean }
interface Review      { id: string; rating: number; comment: string | null; isAnonymous: boolean; reviewerName: string | null; createdAt: string }

interface CoachDetail {
  id:            string
  userId:        string
  name:          string
  shortBio:      string | null
  fullBio:       string | null
  genderAccept:  'all' | 'female_only' | 'male_only'
  voiceIntroUrl: string | null
  totalSessions: number
  avgRating:     number
  specializations: Spec[]
  certificates:    Certificate[]
  packages:        Package[]
  reviews:         Review[]
}

// ── Helpers ───────────────────────────────────────────────

function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatPrice(toman: number): string {
  if (toman === 0) return 'رایگان'
  return toPersian(toman.toLocaleString()) + ' تومان'
}

const GENDER_LABEL: Record<string, string> = {
  all:         'پذیرش: خانم‌ها و آقایان',
  female_only: 'پذیرش: اختصاصی خانم‌ها',
  male_only:   'پذیرش: اختصاصی آقایان',
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

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const filled = Math.round(rating)
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ fontSize: size === 'lg' ? 18 : 13, opacity: i <= filled ? 1 : 0.25 }}>⭐</span>
      ))}
    </span>
  )
}

// ── Voice Player ──────────────────────────────────────────

function VoicePlayer({ url }: { url: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else         { a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)) }
  }

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime = () => setProgress(a.currentTime / (a.duration || 1))
    const onMeta = () => setDuration(a.duration)
    const onEnd  = () => { setPlaying(false); setProgress(0) }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnd)
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('loadedmetadata', onMeta); a.removeEventListener('ended', onEnd) }
  }, [])

  function fmt(s: number) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return `${toPersian(m)}:${toPersian(String(sec).padStart(2, '0'))}`
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: 'var(--surface-secondary)' }}
    >
      {url && <audio ref={audioRef} src={url} preload="metadata" />}

      {/* RTL layout: time | seek bar | play button */}
      <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--content-tertiary)' }}>
        {duration ? fmt(duration * (1 - progress)) : '۲:۰۰'}
      </span>

      <div className="flex-1">
        <div
          className="h-1.5 rounded-full overflow-hidden cursor-pointer"
          style={{ background: 'var(--surface-tertiary)' }}
          onClick={(e) => {
            if (!audioRef.current) return
            const rect = e.currentTarget.getBoundingClientRect()
            const pct  = (e.clientX - rect.left) / rect.width
            audioRef.current.currentTime = pct * audioRef.current.duration
          }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress * 100}%`, background: '#10B981' }}
          />
        </div>
      </div>

      <button
        onClick={toggle}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
        style={{ background: '#10B981' }}
        aria-label={playing ? 'توقف' : 'پخش'}
      >
        {playing
          ? <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><rect x="2" y="2" width="4" height="10" rx="1"/><rect x="8" y="2" width="4" height="10" rx="1"/></svg>
          : <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><path d="M3 2l9 5-9 5V2z"/></svg>
        }
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

export default function CoachProfilePage() {
  const router  = useRouter()
  const params  = useParams()
  const coachId = params?.coachId as string

  const [coach,          setCoach]          = useState<CoachDetail | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [notFound,       setNotFound]       = useState(false)
  const [selectedPkg,    setSelectedPkg]    = useState<string | null>(null)
  const [bioExpanded,    setBioExpanded]    = useState(false)

  useEffect(() => {
    if (!coachId) return
    fetch(`/api/marketplace/coaches/${coachId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setCoach(json.data)
          // pre-select the intro package if available
          const intro = json.data.packages.find((p: Package) => p.isIntro)
          setSelectedPkg(intro?.id ?? json.data.packages[0]?.id ?? null)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [coachId])

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        {[120, 80, 160, 120].map((h, i) => (
          <div key={i} className="rounded-xl mb-4 animate-pulse" style={{ height: h, background: 'var(--surface-card)' }} />
        ))}
      </div>
    )
  }

  if (notFound || !coach) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ color: 'var(--content-secondary)' }}>
        <p className="text-4xl mb-3">🧭</p>
        <p>کوچ یافت نشد</p>
        <button onClick={() => router.back()} className="mt-4 text-sm" style={{ color: '#10B981' }}>بازگشت</button>
      </div>
    )
  }

  const selectedPackage = coach.packages.find((p) => p.id === selectedPkg)

  return (
    <div className="max-w-lg mx-auto pb-40">

      {/* Back button */}
      <div className="px-4 pt-5 mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm transition-opacity"
          style={{ color: 'var(--content-secondary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4l4 4-4 4M3 8h11" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          کوچ‌ها
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="px-4 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar + verified badge */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
            >
              {coach.name.charAt(0)}
            </div>
            <span
              className="absolute -bottom-1 -left-1 text-lg"
              title="تأیید شده"
            >
              ✅
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>
              {coach.name}
            </h1>

            {/* Gender badge */}
            <span
              className="inline-block text-xs font-medium px-2.5 py-1 rounded-full mt-1"
              style={{
                background: GENDER_COLOR[coach.genderAccept],
                color:      GENDER_TEXT[coach.genderAccept],
              }}
            >
              {GENDER_LABEL[coach.genderAccept]}
            </span>

            {/* Stats */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <StarRow rating={coach.avgRating} />
                <span className="text-sm font-bold" style={{ color: 'var(--content-primary)' }}>
                  {coach.avgRating.toFixed(1)}
                </span>
              </div>
              <span style={{ color: 'var(--content-tertiary)' }}>·</span>
              <span className="text-sm" style={{ color: 'var(--content-tertiary)' }}>
                {toPersian(coach.totalSessions)} جلسه
              </span>
            </div>
          </div>
        </div>

        {/* Short bio */}
        {coach.shortBio && (
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--content-secondary)' }}>
            {coach.shortBio}
          </p>
        )}

        {/* Spec tags */}
        {coach.specializations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {coach.specializations.map((s) => (
              <span
                key={s.id}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: 'var(--surface-tertiary)', color: 'var(--content-secondary)' }}
              >
                {s.icon} {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Voice Intro ── */}
      <section className="px-4 mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
          🎧 صدای کوچ
        </h2>
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-xs mb-3" style={{ color: 'var(--content-tertiary)' }}>
            با صدای {coach.name} آشنا شو — معرفی شخصی و خوش‌آمدگویی
          </p>
          <VoicePlayer url={coach.voiceIntroUrl} />
          {!coach.voiceIntroUrl && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--content-tertiary)' }}>
              فایل صوتی به زودی اضافه می‌شود
            </p>
          )}
        </div>
      </section>

      {/* ── Full Bio ── */}
      {coach.fullBio && (
        <section className="px-4 mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
            درباره من
          </h2>
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
          >
            <p
              className="text-sm leading-loose"
              style={{
                color:            'var(--content-secondary)',
                display:          '-webkit-box',
                WebkitLineClamp:  bioExpanded ? 'unset' : 3,
                WebkitBoxOrient:  'vertical',
                overflow:         'hidden',
              }}
            >
              {coach.fullBio}
            </p>
            {coach.fullBio.length > 120 && (
              <button
                onClick={() => setBioExpanded(!bioExpanded)}
                className="mt-2 text-xs font-medium"
                style={{ color: '#10B981', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {bioExpanded ? 'کمتر ببین' : 'بیشتر بخوان'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* ── Trust Box (Certificates) ── */}
      {coach.certificates.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
            🏅 جعبه ابزار اعتماد
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border-color)' }}
          >
            {coach.certificates.map((cert, i) => (
              <div
                key={cert.id}
                className="flex items-start gap-3 px-4 py-3"
                style={{
                  background:   'var(--surface-card)',
                  borderTop:    i > 0 ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">📜</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>
                    {cert.title}
                    {cert.verified && (
                      <span className="mr-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                        تأیید شده ✓
                      </span>
                    )}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
                    {cert.issuer} · {toPersian(cert.year)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Reviews ── */}
      {coach.reviews.length > 0 && (
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>
              نظرات رهجوها
            </h2>
            <div className="flex items-center gap-1.5">
              <StarRow rating={coach.avgRating} />
              <span className="text-sm font-bold" style={{ color: 'var(--content-primary)' }}>
                {coach.avgRating.toFixed(1)}
              </span>
              <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                ({toPersian(coach.reviews.length)} نظر)
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {coach.reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl p-4"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>
                    {rev.isAnonymous ? 'یک هم‌سفر' : (rev.reviewerName ?? 'رهجو')}
                  </span>
                  <StarRow rating={rev.rating} />
                </div>
                {rev.comment && (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--content-secondary)' }}>
                    «{rev.comment}»
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Packages ── */}
      <section className="px-4 mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
          پکیج‌های مشاوره
        </h2>
        <div className="flex flex-col gap-3">
          {coach.packages.map((pkg) => {
            const active = selectedPkg === pkg.id
            return (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg.id)}
                className="w-full text-right rounded-xl p-4 transition-all"
                style={{
                  background: active ? 'rgba(16,185,129,0.08)' : 'var(--surface-card)',
                  border:     `2px solid ${active ? '#10B981' : 'var(--border-color)'}`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>
                        {pkg.name}
                      </p>
                      {pkg.isIntro && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
                        >
                          شروع آسان
                        </span>
                      )}
                    </div>
                    {pkg.description && (
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--content-tertiary)' }}>
                        {pkg.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                        {toPersian(pkg.sessionCount)} جلسه · {toPersian(pkg.durationMinutes)} دقیقه
                      </span>
                      {pkg.includesChat && (
                        <span className="text-xs" style={{ color: '#3B82F6' }}>· 💬 چت</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-left">
                    <p className="font-bold text-sm" style={{ color: active ? '#10B981' : 'var(--content-primary)' }}>
                      {formatPrice(pkg.priceToman)}
                    </p>
                    {active && (
                      <span className="text-xs" style={{ color: '#10B981' }}>✓ انتخاب شده</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Sticky CTA ── */}
      <div
        className="fixed inset-x-0 px-4 py-4"
        style={{
          bottom:        68,
          zIndex:        45,
          background:    'var(--surface-card)',
          borderTop:     '1px solid var(--border-color)',
        }}
      >
        <div className="max-w-lg mx-auto">
          {selectedPackage && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: 'var(--content-secondary)' }}>
                {selectedPackage.name}
              </span>
              <span className="text-sm font-bold" style={{ color: '#10B981' }}>
                {formatPrice(selectedPackage.priceToman)}
              </span>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/messages/${coach.userId}`)}
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90"
              style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)' }}
              aria-label="ارسال پیام"
              title="ارسال پیام"
            >
              💬
            </button>
            <button
              disabled={!selectedPkg}
              onClick={() => router.push(`/coaches/${coach.id}/book?package=${selectedPkg}`)}
              className="flex-1 py-3.5 rounded-xl text-white font-bold text-base transition-all active:scale-95"
              style={{
                background: selectedPkg ? '#10B981' : 'var(--surface-tertiary)',
                color:      selectedPkg ? '#fff'     : 'var(--content-tertiary)',
                cursor:     selectedPkg ? 'pointer'  : 'not-allowed',
              }}
            >
              رزرو جلسه 🧭
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
