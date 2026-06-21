'use client'

import { useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────

interface DisputeRow {
  id:          string
  bookingId:   string
  status:      string
  sessionDate: string
  sessionTime: string
  clientName:  string | null
  clientPhone: string
  coachName:   string | null
  packageName: string
  amount:      number
  jitsiRoomId: string | null
}

type Ruling = 'refund_client' | 'release_coach' | 'partial_refund'

// ── Helpers ───────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('fa-IR')
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fa-IR')
}

// ── Resolve Modal ─────────────────────────────────────────

function ResolveModal({
  dispute, onClose, onResolve,
}: {
  dispute: DisputeRow
  onClose: () => void
  onResolve: (ruling: Ruling, reason: string, refundAmount?: number) => Promise<void>
}) {
  const [ruling,        setRuling]       = useState<Ruling>('refund_client')
  const [reason,        setReason]       = useState('')
  const [refundAmount,  setRefundAmount] = useState('')
  const [loading,       setLoading]      = useState(false)
  const [error,         setError]        = useState('')

  async function submit() {
    if (!reason.trim()) { setError('دلیل حکم الزامی است'); return }
    setLoading(true)
    try {
      await onResolve(ruling, reason.trim(), ruling === 'partial_refund' ? Number(refundAmount) : undefined)
    } catch {
      setError('خطا در ثبت حکم')
    } finally {
      setLoading(false)
    }
  }

  const RULING_OPTIONS: { value: Ruling; label: string; desc: string; color: string }[] = [
    {
      value: 'refund_client',
      label: 'حکم به نفع رهجو (بازگشت وجه)',
      desc:  'سهم قفل‌شده کوچ سوزانده می‌شود و مبلغ به رهجو بازگردانده می‌شود',
      color: '#EF4444',
    },
    {
      value: 'release_coach',
      label: 'حکم به نفع کوچ (آزادسازی سهم)',
      desc:  'سهم قفل‌شده کوچ آزاد و به موجودی قابل برداشت منتقل می‌شود',
      color: '#10B981',
    },
    {
      value: 'partial_refund',
      label: 'حکم جزئی (تقسیم)',
      desc:  'بخشی از مبلغ به رهجو برگشت داده می‌شود و مابقی به کوچ آزاد می‌شود',
      color: '#F59E0B',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <h3 className="text-base font-bold mb-1" style={{ color: 'var(--content-primary)' }}>صدور حکم داوری</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--content-secondary)' }}>
          {dispute.clientName ?? dispute.clientPhone} ← {dispute.coachName ?? '—'}
          <span className="mr-2 text-xs" style={{ color: 'var(--content-tertiary)' }}>
            ({fmtDate(dispute.sessionDate)} · {dispute.sessionTime})
          </span>
        </p>

        {/* Ruling options */}
        <div className="space-y-2 mb-4">
          {RULING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRuling(opt.value)}
              className="w-full text-right px-4 py-3 rounded-xl transition-all"
              style={{
                background: ruling === opt.value ? `${opt.color}10` : 'var(--surface-secondary)',
                border:     `1px solid ${ruling === opt.value ? `${opt.color}50` : 'var(--border-color)'}`,
              }}
            >
              <p className="text-sm font-semibold" style={{ color: ruling === opt.value ? opt.color : 'var(--content-primary)' }}>
                {opt.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>{opt.desc}</p>
            </button>
          ))}
        </div>

        {ruling === 'partial_refund' && (
          <div className="mb-3">
            <label className="block text-xs mb-1.5" style={{ color: 'var(--content-tertiary)' }}>
              مبلغ بازگشت به رهجو (تومان) — حداکثر {fmt(dispute.amount)}
            </label>
            <input
              type="number"
              placeholder="مثال: 350000"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)', direction: 'ltr' }}
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs mb-1.5" style={{ color: 'var(--content-tertiary)' }}>
            دلیل حکم (ثبت در سیستم)
          </label>
          <textarea
            rows={3}
            placeholder="توضیحات داوری..."
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError('') }}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
          />
          {error && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{error}</p>}
        </div>

        <div className="flex gap-3">
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
            style={{ background: '#10B981' }}
          >
            {loading ? '...' : '⚖️ صدور حکم'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

export default function AdminDisputesPage() {
  const [disputes,  setDisputes]  = useState<DisputeRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [target,    setTarget]    = useState<DisputeRow | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function load() {
    const res  = await fetch('/api/admin/disputes')
    const json = await res.json()
    if (json.success) setDisputes(json.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleResolve(ruling: Ruling, reason: string, refundAmount?: number) {
    if (!target) return
    const res  = await fetch(`/api/admin/disputes/${target.id}/resolve`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ruling, reason, refund_amount: refundAmount }),
    })
    const json = await res.json()
    if (json.success) {
      setDisputes((prev) => prev.filter((d) => d.id !== target.id))
      setTarget(null)
      setSuccessMsg(json.message)
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--content-primary)' }}>اتاق داوری</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--content-secondary)' }}>
          {loading ? '...' : `${disputes.length} اختلاف باز`}
        </p>
      </div>

      {successMsg && (
        <div
          className="mb-4 px-5 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
        >
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div
          className="rounded-xl p-16 text-center"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-4xl mb-3">⚖️</p>
          <p className="text-base font-semibold" style={{ color: 'var(--content-primary)' }}>هیچ اختلافی برای بررسی نیست</p>
          <p className="text-sm mt-1" style={{ color: 'var(--content-tertiary)' }}>همه جلسات بدون مشکل برگزار شده‌اند</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div
              key={d.id}
              className="rounded-xl p-5"
              style={{ background: 'var(--surface-card)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                    >
                      ⚠️ اختلاف
                    </span>
                    <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                      {fmtDate(d.sessionDate)} · {d.sessionTime}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>رهجو</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>
                        {d.clientName ?? '—'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{d.clientPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>کوچ</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>
                        {d.coachName ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>پکیج / مبلغ</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>{d.packageName}</p>
                      <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>{fmt(d.amount)} ت</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {d.jitsiRoomId && (
                    <a
                      href={`https://meet.jit.si/${d.jitsiRoomId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-xl text-center"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}
                    >
                      🎥 اتاق جلسه
                    </a>
                  )}
                  <button
                    onClick={() => setTarget(d)}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                    style={{ background: '#10B981' }}
                  >
                    ⚖️ صدور حکم
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {target && (
        <ResolveModal
          dispute={target}
          onClose={() => setTarget(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  )
}
