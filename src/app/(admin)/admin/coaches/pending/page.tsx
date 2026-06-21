'use client'

import { useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────

interface PendingCoach {
  id:              string
  name:            string | null
  phone:           string
  shortBio:        string | null
  fullBio:         string | null
  genderAccept:    string
  voiceIntroUrl:   string | null
  commissionRate:  number
  specializations: string[]
  certificates: {
    id:       string
    title:    string
    issuer:   string
    year:     number
    imageUrl: string | null
  }[]
  appliedAt: string
}

// ── Helpers ───────────────────────────────────────────────

const GENDER_LABELS: Record<string, string> = {
  all:         'همه',
  female_only: 'اختصاصی خانم‌ها',
  male_only:   'اختصاصی آقایان',
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fa-IR')
}

// ── Reject Modal ──────────────────────────────────────────

function RejectModal({
  coach, onClose, onReject,
}: {
  coach: PendingCoach
  onClose: () => void
  onReject: (reason: string) => Promise<void>
}) {
  const [reason,  setReason]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function submit() {
    if (!reason.trim()) { setError('دلیل رد الزامی است'); return }
    setLoading(true)
    try { await onReject(reason.trim()) } catch { setError('خطا در ارسال') } finally { setLoading(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <h3 className="text-base font-bold mb-1" style={{ color: 'var(--content-primary)' }}>رد درخواست</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--content-secondary)' }}>{coach.name ?? coach.phone}</p>
        <textarea
          rows={3}
          placeholder="دلیل رد را بنویسید (برای کوچ ارسال می‌شود)..."
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError('') }}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
        />
        {error && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{error}</p>}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)' }}
          >
            انصراف
          </button>
          <button
            onClick={submit}
            disabled={loading || !reason.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: '#EF4444' }}
          >
            {loading ? '...' : 'رد کردن'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Coach Card ────────────────────────────────────────────

function CoachCard({
  coach, onApprove, onRejectClick,
}: {
  coach: PendingCoach
  onApprove: () => void
  onRejectClick: () => void
}) {
  const [expanded,  setExpanded]  = useState(false)
  const [approving, setApproving] = useState(false)

  async function handleApprove() {
    setApproving(true)
    try { onApprove() } finally { setApproving(false) }
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
          >
            {(coach.name || '?').charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>
              {coach.name ?? '—'} <span className="font-normal" style={{ color: 'var(--content-tertiary)' }}>({coach.phone})</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--content-secondary)' }}>
              {coach.shortBio ?? 'بدون معرفی کوتاه'}
            </p>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {coach.specializations.map((s) => (
                <span
                  key={s}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{fmtDate(coach.appliedAt)}</span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
          >
            {expanded ? 'بستن' : 'جزئیات'}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left col */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--content-tertiary)' }}>بیوگرافی کامل</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--content-secondary)' }}>
                  {coach.fullBio ?? '—'}
                </p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>پذیرش</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>
                    {GENDER_LABELS[coach.genderAccept]}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>کمیسیون</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>
                    {Math.round(coach.commissionRate * 100)}٪
                  </p>
                </div>
              </div>
              {coach.voiceIntroUrl && (
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--content-tertiary)' }}>🎙️ صدای کوچ</p>
                  <audio controls className="w-full h-9" src={coach.voiceIntroUrl} />
                </div>
              )}
            </div>

            {/* Right col — certificates */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--content-tertiary)' }}>
                📋 مدارک ({coach.certificates.length})
              </p>
              {coach.certificates.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>بدون مدرک</p>
              ) : (
                <div className="space-y-2">
                  {coach.certificates.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                      style={{ background: 'var(--surface-secondary)' }}
                    >
                      <span className="text-lg">📜</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--content-primary)' }}>{c.title}</p>
                        <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{c.issuer} · {c.year}</p>
                      </div>
                      {c.imageUrl && (
                        <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: '#3B82F6' }}>
                          مشاهده
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action row */}
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderTop: '1px solid var(--border-color)', background: 'var(--surface-secondary)' }}
      >
        <button
          onClick={onRejectClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          ❌ رد درخواست
        </button>
        <button
          onClick={handleApprove}
          disabled={approving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
          style={{ background: '#10B981' }}
        >
          {approving ? '...' : '✅ تأیید و اعطای تیک سبز'}
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

export default function PendingCoachesPage() {
  const [coaches, setCoaches]  = useState<PendingCoach[]>([])
  const [loading, setLoading]  = useState(true)
  const [rejectTarget, setRejectTarget] = useState<PendingCoach | null>(null)

  async function loadCoaches() {
    const res  = await fetch('/api/admin/coaches/pending')
    const json = await res.json()
    if (json.success) setCoaches(json.data)
  }

  useEffect(() => { loadCoaches().finally(() => setLoading(false)) }, [])

  async function handleApprove(coach: PendingCoach) {
    const res  = await fetch(`/api/admin/coaches/${coach.id}/approve`, { method: 'PATCH' })
    const json = await res.json()
    if (json.success) setCoaches((prev) => prev.filter((c) => c.id !== coach.id))
  }

  async function handleReject(coach: PendingCoach, reason: string) {
    const res  = await fetch(`/api/admin/coaches/${coach.id}/reject`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason }),
    })
    const json = await res.json()
    if (json.success) {
      setCoaches((prev) => prev.filter((c) => c.id !== coach.id))
      setRejectTarget(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--content-primary)' }}>صف تأیید کوچ‌ها</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--content-secondary)' }}>
          {loading ? '...' : `${coaches.length} درخواست در انتظار بررسی`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />
          ))}
        </div>
      ) : coaches.length === 0 ? (
        <div
          className="rounded-xl p-16 text-center"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-4xl mb-3">✅</p>
          <p className="text-base font-semibold" style={{ color: 'var(--content-primary)' }}>همه درخواست‌ها بررسی شده‌اند</p>
          <p className="text-sm mt-1" style={{ color: 'var(--content-tertiary)' }}>درخواست جدیدی در صف نیست</p>
        </div>
      ) : (
        <div className="space-y-4">
          {coaches.map((coach) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              onApprove={() => handleApprove(coach)}
              onRejectClick={() => setRejectTarget(coach)}
            />
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          coach={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onReject={(reason) => handleReject(rejectTarget, reason)}
        />
      )}
    </div>
  )
}
