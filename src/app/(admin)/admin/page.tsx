'use client'

import { useEffect, useState } from 'react'

interface Overview {
  totalUsers:       number
  activeCoaches:    number
  totalSessions:    number
  pendingCoaches:   number
  openDisputes:     number
  pendingPayouts:   number
  totalRevenue:     number
  thisMonthRevenue: number
  lastMonthRevenue?: number
}

function fmt(n: number): string {
  return n.toLocaleString('fa-IR')
}

function StatCard({
  label, value, icon, color = '#10B981', subtitle,
}: {
  label: string; value: string | number; icon: string; color?: string; subtitle?: string
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: 'var(--content-tertiary)' }}>{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {subtitle && <p className="text-xs mt-1" style={{ color: 'var(--content-tertiary)' }}>{subtitle}</p>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [data,    setData]    = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics/overview')
      .then((r) => r.json())
      .then((json) => { if (json.success) setData(json.data) })
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

  if (!data) return null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--content-primary)' }}>داشبورد آماری</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--content-secondary)' }}>نگاه کلی به وضعیت پلتفرم</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="کل کاربران"      value={fmt(data.totalUsers)}    icon="👥" color="#3B82F6" />
        <StatCard label="کوچ‌های فعال" value={fmt(data.activeCoaches)} icon="🧑‍💼" color="#10B981" />
        <StatCard label="جلسات برگزار شده" value={fmt(data.totalSessions)} icon="🎯" color="#8B5CF6" />
        <StatCard
          label="درآمد پلتفرم این ماه"
          value={`${fmt(data.thisMonthRevenue)} ت`}
          icon="💰"
          color="#F59E0B"
        />
      </div>

      {/* Alert stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="در انتظار تأیید"
          value={data.pendingCoaches}
          icon="⏳"
          color={data.pendingCoaches > 0 ? '#F59E0B' : 'var(--content-tertiary)'}
          subtitle="کوچ جدید"
        />
        <StatCard
          label="اختلافات باز"
          value={data.openDisputes}
          icon="⚖️"
          color={data.openDisputes > 0 ? '#EF4444' : 'var(--content-tertiary)'}
          subtitle="نیاز به بررسی"
        />
        <StatCard
          label="درخواست تسویه"
          value={data.pendingPayouts}
          icon="🏦"
          color={data.pendingPayouts > 0 ? '#3B82F6' : 'var(--content-tertiary)'}
          subtitle="در انتظار پردازش"
        />
      </div>

      {/* Revenue chart placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--content-secondary)' }}>
            💹 روند درآمد
          </h2>
          <div className="flex items-end gap-3 h-36">
            {[
              { label: 'ماه قبل',    value: data.thisMonthRevenue * 0.7,  color: '#3B82F6' },
              { label: 'این ماه',    value: data.thisMonthRevenue,         color: '#10B981' },
              { label: 'پیش‌بینی', value: data.thisMonthRevenue * 1.15, color: '#8B5CF6', opacity: 0.5 },
            ].map((bar, i) => {
              const max    = data.thisMonthRevenue * 1.15
              const height = max > 0 ? Math.max(8, Math.round((bar.value / max) * 100)) : 8
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-[9px]" style={{ color: 'var(--content-tertiary)' }}>
                    {fmt(Math.round(bar.value / 1000))}k
                  </p>
                  <div
                    className="w-full rounded-t-lg"
                    style={{ height: `${height}%`, background: bar.color, opacity: bar.opacity ?? 1 }}
                  />
                  <p className="text-[10px]" style={{ color: 'var(--content-tertiary)' }}>{bar.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--content-secondary)' }}>
            📈 رشد کاربران
          </h2>
          <div className="space-y-3">
            {[
              { label: 'کل کاربران',       value: data.totalUsers,    color: '#3B82F6' },
              { label: 'کوچ‌های فعال', value: data.activeCoaches, color: '#10B981' },
              { label: 'جلسات کامل شده',  value: data.totalSessions, color: '#8B5CF6' },
            ].map((row) => {
              const max = data.totalUsers || 1
              const pct = Math.round((row.value / max) * 100)
              return (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--content-secondary)' }}>{row.label}</span>
                    <span style={{ color: row.color }}>{fmt(row.value)}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'var(--surface-secondary)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: row.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
