'use client'

import { useEffect, useState } from 'react'

interface FinanceOverview {
  totalRevenue:       number
  totalPlatformShare: number
  totalCoachShare:    number
  totalDiscounts:     number
  totalTransactions:  number
  thisMonthRevenue:   number
  thisMonthPlatform:  number
  lastMonthRevenue:   number
  lastMonthPlatform:  number
  approvedCoachCount: number
  methodBreakdown: {
    method: string
    total:  number
    count:  number
  }[]
}

interface WalletRow {
  id:              string
  coachName:       string | null
  coachPhone:      string
  totalEarned:     number
  lockedAmount:    number
  availableAmount: number
  shebaNumber:     string | null
  accountHolder:   string | null
}

function fmt(n: number): string {
  return n.toLocaleString('fa-IR')
}

function MetricCard({
  label, value, sub, icon, color = '#10B981',
}: {
  label: string; value: string; sub?: string; icon: string; color?: string
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--content-tertiary)' }}>{sub}</p>}
    </div>
  )
}

export default function AdminFinancePage() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null)
  const [wallets,  setWallets]  = useState<WalletRow[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/finance/overview').then((r) => r.json()),
      fetch('/api/admin/finance/wallets').then((r) => r.json()),
    ])
      .then(([ov, wl]) => {
        if (ov.success) setOverview(ov.data)
        if (wl.success) setWallets(wl.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />
        ))}
      </div>
    )
  }

  const METHOD_LABELS: Record<string, string> = { zarinpal: 'زرین‌پال', snappay: 'اسنپ‌پی' }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--content-primary)' }}>مدیریت مالی</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--content-secondary)' }}>داشبورد درآمد و کمیسیون پلتفرم</p>
      </div>

      {overview && (
        <>
          {/* Top metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              label="کل درآمد پلتفرم"
              value={`${fmt(overview.totalPlatformShare)} ت`}
              icon="💰"
              color="#10B981"
            />
            <MetricCard
              label="کل پرداخت رهجوها"
              value={`${fmt(overview.totalRevenue)} ت`}
              icon="💳"
              color="#3B82F6"
            />
            <MetricCard
              label="سهم کوچ‌ها"
              value={`${fmt(overview.totalCoachShare)} ت`}
              icon="🧑‍💼"
              color="#8B5CF6"
              sub="(قفل + آزاد)"
            />
            <MetricCard
              label="کل تخفیف‌ها"
              value={`${fmt(overview.totalDiscounts)} ت`}
              icon="🏷️"
              color="#F59E0B"
            />
          </div>

          {/* Month comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div
              className="rounded-xl p-5"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--content-secondary)' }}>
                📆 مقایسه ماهانه
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'این ماه — کل',        value: overview.thisMonthRevenue  },
                  { label: 'این ماه — سهم پلتفرم', value: overview.thisMonthPlatform },
                  { label: 'ماه قبل — کل',         value: overview.lastMonthRevenue  },
                  { label: 'ماه قبل — سهم پلتفرم', value: overview.lastMonthPlatform },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--content-secondary)' }}>{row.label}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
                      {fmt(row.value)} ت
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-5"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--content-secondary)' }}>
                💳 تراکنش‌ها به تفکیک روش
              </h2>
              <div className="space-y-3">
                {overview.methodBreakdown.map((m) => (
                  <div key={m.method} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--content-secondary)' }}>
                      {METHOD_LABELS[m.method] ?? m.method}
                    </span>
                    <div className="text-left">
                      <span className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
                        {fmt(m.total)} ت
                      </span>
                      <span className="text-xs mr-2" style={{ color: 'var(--content-tertiary)' }}>
                        ({fmt(m.count)} تراکنش)
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>کل</span>
                    <span className="text-sm font-bold" style={{ color: '#10B981' }}>
                      {fmt(overview.totalTransactions)} تراکنش
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Wallet table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
            💼 کیف پول کوچ‌ها ({wallets.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface-secondary)' }}>
                {['کوچ', 'کل درآمد', 'قفل شده', 'قابل برداشت', 'شبا'].map((h) => (
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
              {wallets.map((w, i) => (
                <tr
                  key={w.id}
                  style={{ borderTop: i > 0 ? '1px solid var(--border-color)' : 'none' }}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--content-primary)' }}>{w.coachName ?? '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{w.coachPhone}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#3B82F6' }}>{fmt(w.totalEarned)} ت</td>
                  <td className="px-4 py-3" style={{ color: '#F59E0B' }}>{fmt(w.lockedAmount)} ت</td>
                  <td className="px-4 py-3" style={{ color: '#10B981' }}>{fmt(w.availableAmount)} ت</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--content-tertiary)', direction: 'ltr' }}>
                    {w.shebaNumber ? (
                      <span title={w.accountHolder ?? ''}>
                        {w.shebaNumber.slice(0, 8)}…
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
              {wallets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--content-tertiary)' }}>
                    هیچ کیف پولی یافت نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
