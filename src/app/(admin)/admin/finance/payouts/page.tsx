'use client'

import { useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────

interface PayoutRow {
  id:            string
  amount:        number
  status:        'pending' | 'approved' | 'transferred' | 'rejected'
  payaRef:       string | null
  requestedAt:   string
  transferredAt: string | null
  coachName:     string | null
  coachPhone:    string
  shebaNumber:   string | null
  accountHolder: string | null
}

// ── Helpers ───────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('fa-IR')
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fa-IR')
}

const STATUS_LABELS: Record<string, string> = {
  pending:     'در انتظار',
  approved:    'تأیید شده',
  transferred: 'واریز شده',
  rejected:    'رد شده',
}

const STATUS_COLORS: Record<string, string> = {
  pending:     '#F59E0B',
  approved:    '#10B981',
  transferred: '#3B82F6',
  rejected:    '#EF4444',
}

// ── Page ──────────────────────────────────────────────────

export default function AdminPayoutsPage() {
  const [payouts,    setPayouts]   = useState<PayoutRow[]>([])
  const [loading,    setLoading]   = useState(true)
  const [filter,     setFilter]    = useState<'pending' | 'approved' | 'all'>('pending')
  const [selected,   setSelected]  = useState<Set<string>>(new Set())
  const [payaRef,    setPayaRef]   = useState('')
  const [actionMsg,  setActionMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [working,    setWorking]   = useState(false)

  async function load() {
    setLoading(true)
    setSelected(new Set())
    const res  = await fetch(`/api/admin/finance/payouts?status=${filter}`)
    const json = await res.json()
    if (json.success) setPayouts(json.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function handleApprove(id: string) {
    const res  = await fetch(`/api/admin/finance/payouts/${id}/approve`, { method: 'PATCH' })
    const json = await res.json()
    setActionMsg({ text: json.message ?? (json.success ? 'تأیید شد' : json.error?.message), ok: json.success })
    if (json.success) load()
  }

  async function handleReject(id: string) {
    if (!confirm('آیا از رد این درخواست مطمئنید؟')) return
    const res  = await fetch(`/api/admin/finance/payouts/${id}/reject`, { method: 'PATCH' })
    const json = await res.json()
    setActionMsg({ text: json.message ?? (json.success ? 'رد شد' : json.error?.message), ok: json.success })
    if (json.success) load()
  }

  async function handleMarkTransferred() {
    if (!selected.size) return
    setWorking(true)
    const res  = await fetch('/api/admin/finance/payouts/mark-transferred', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ payout_ids: Array.from(selected), paya_ref: payaRef.trim() || undefined }),
    })
    const json = await res.json()
    setActionMsg({ text: json.message ?? (json.success ? 'علامت‌گذاری شد' : json.error?.message), ok: json.success })
    setWorking(false)
    if (json.success) { setSelected(new Set()); load() }
  }

  async function handleExport() {
    const res = await fetch('/api/admin/finance/payouts/export-paya', { method: 'POST' })
    if (!res.ok) {
      const json = await res.json()
      setActionMsg({ text: json.error?.message ?? 'خطا در خروجی', ok: false })
      return
    }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `paya-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    if (selected.size === payouts.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(payouts.map((p) => p.id)))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--content-primary)' }}>مدیریت تسویه‌حساب</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--content-secondary)' }}>درخواست‌های برداشت کوچ‌ها</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Export PAYA */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            📥 خروجی پایا (Excel)
          </button>

          {/* Filter tabs */}
          {(['pending', 'approved', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: filter === f ? '#10B981' : 'var(--surface-card)',
                color:      filter === f ? 'white'  : 'var(--content-secondary)',
                border:     '1px solid var(--border-color)',
              }}
            >
              {f === 'pending' ? 'در انتظار' : f === 'approved' ? 'تأیید شده' : 'همه'}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div
          className="flex items-center gap-4 px-5 py-3 rounded-xl mb-4"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <span className="text-sm font-medium" style={{ color: '#10B981' }}>
            {selected.size} مورد انتخاب شده
          </span>
          <input
            type="text"
            placeholder="شماره مرجع پایا (اختیاری)"
            value={payaRef}
            onChange={(e) => setPayaRef(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--content-primary)', maxWidth: 280 }}
          />
          <button
            onClick={handleMarkTransferred}
            disabled={working}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: '#10B981' }}
          >
            {working ? '...' : '✅ علامت‌گذاری واریز شده'}
          </button>
        </div>
      )}

      {/* Action message */}
      {actionMsg && (
        <div
          className="mb-4 px-5 py-3 rounded-xl text-sm"
          style={{
            background: actionMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color:      actionMsg.ok ? '#10B981'               : '#EF4444',
          }}
        >
          {actionMsg.text}
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface-secondary)' }}>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={payouts.length > 0 && selected.size === payouts.length}
                    onChange={selectAll}
                    disabled={payouts.length === 0}
                  />
                </th>
                {['کوچ', 'مبلغ', 'شبا', 'تاریخ درخواست', 'وضعیت', 'عملیات'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-right text-xs font-semibold"
                    style={{ color: 'var(--content-tertiary)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center" style={{ color: 'var(--content-tertiary)' }}>
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center" style={{ color: 'var(--content-tertiary)' }}>
                    هیچ درخواستی یافت نشد
                  </td>
                </tr>
              ) : payouts.map((p, i) => (
                <tr
                  key={p.id}
                  style={{
                    borderTop:  i > 0 ? '1px solid var(--border-color)' : 'none',
                    background: selected.has(p.id) ? 'rgba(16,185,129,0.05)' : 'transparent',
                  }}
                >
                  <td className="px-4 py-3">
                    {p.status === 'approved' && (
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--content-primary)' }}>{p.coachName ?? '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{p.coachPhone}</p>
                    {p.accountHolder && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>{p.accountHolder}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#10B981' }}>
                    {fmt(p.amount)} ت
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--content-tertiary)', direction: 'ltr' }}>
                    {p.shebaNumber ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--content-tertiary)' }}>
                    {fmtDate(p.requestedAt)}
                    {p.transferredAt && <> · {fmtDate(p.transferredAt)}</>}
                    {p.payaRef && <p className="mt-0.5" style={{ color: '#3B82F6' }}>پایا: {p.payaRef}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: `${STATUS_COLORS[p.status]}20`,
                        color:       STATUS_COLORS[p.status],
                      }}
                    >
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                          style={{ background: '#10B981' }}
                        >
                          تأیید
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                        >
                          رد
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
