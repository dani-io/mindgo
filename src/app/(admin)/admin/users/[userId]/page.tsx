'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface UserDetail {
  id:               string
  name:             string | null
  phone:            string
  role:             string
  avatarUrl:        string | null
  isActive:         boolean
  streakCount:      number
  xpPoints:         number
  level:            number
  badges:           unknown
  onboardingAnswers:unknown
  createdAt:        string
}

interface PaymentItem {
  id:            string
  amountToman:   number
  method:        string
  status:        string
  isInstallment: boolean
  discountAmount:number
  paidAt:        string | null
  createdAt:     string
  packageName:   string | null
}

interface SessionItem {
  id:          string
  sessionDate: string
  sessionTime: string
  status:      string
  coachName:   string | null
}

interface Stats { habitsCount: number; goalsCount: number }

interface DiscountResult { code: string; type: string; value: number; expiresAt: string }

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending:  'در انتظار',
  paid:     'پرداخت شده',
  failed:   'ناموفق',
  refunded: 'بازگشت',
}
const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending:            'در انتظار',
  confirmed:          'تأیید شده',
  completed:          'برگزار شده',
  cancelled_by_coach: 'لغو توسط کوچ',
  cancelled_by_user:  'لغو توسط کاربر',
  no_show:            'غیبت',
}
const METHOD_LABELS: Record<string, string> = { zarinpal: 'زرین‌پال', snappay: 'اسنپ‌پی' }

function toPersian(n: number | string) { return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]) }
function fmtDate(iso: string)  { return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }) }
function fmtMoney(v: number)   { return toPersian(v.toLocaleString()) + ' تومان' }
function getToken()            { return typeof window !== 'undefined' ? localStorage.getItem('mg_token') : null }
function parseBadges(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[]
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
  return []
}

export default function AdminUserDetailPage() {
  const router          = useRouter()
  const { userId }      = useParams<{ userId: string }>()

  const [user,     setUser]     = useState<UserDetail | null>(null)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState(false)

  // Discount modal
  const [showDiscount,   setShowDiscount]   = useState(false)
  const [discountType,   setDiscountType]   = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue,  setDiscountValue]  = useState('20')
  const [discountCode,   setDiscountCode]   = useState('')
  const [discountExpiry, setDiscountExpiry] = useState('30')
  const [creatingCode,   setCreatingCode]   = useState(false)
  const [createdCode,    setCreatedCode]    = useState<DiscountResult | null>(null)

  useEffect(() => {
    const token = getToken()
    fetch(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setUser(j.data.user)
          setPayments(j.data.payments)
          setSessions(j.data.sessions)
          setStats(j.data.stats)
        }
      })
      .finally(() => setLoading(false))
  }, [userId])

  async function toggleActive() {
    if (!user) return
    setToggling(true)
    const token = getToken()
    const res  = await fetch(`/api/admin/users/${userId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ isActive: !user.isActive }),
    })
    const json = await res.json()
    if (json.success) setUser((u) => u ? { ...u, isActive: !u.isActive } : u)
    setToggling(false)
  }

  async function createDiscount() {
    setCreatingCode(true)
    const token = getToken()
    const res  = await fetch(`/api/admin/users/${userId}/discount`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({
        type:          discountType,
        value:         parseInt(discountValue) || 20,
        code:          discountCode.trim() || undefined,
        expiresInDays: parseInt(discountExpiry) || 30,
      }),
    })
    const json = await res.json()
    if (json.success) setCreatedCode(json.data)
    setCreatingCode(false)
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-secondary)', border: '1px solid var(--border-color)',
    color: 'var(--content-primary)', borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%',
  }

  if (loading) return (
    <div className="space-y-4 max-w-3xl">
      {[100, 200, 200].map((h, i) => <div key={i} className="rounded-2xl animate-pulse" style={{ height: h, background: 'var(--surface-card)' }} />)}
    </div>
  )

  if (!user) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">👤</p>
      <p style={{ color: 'var(--content-tertiary)' }}>کاربر یافت نشد</p>
      <button onClick={() => router.back()} className="mt-4 text-sm" style={{ color: '#10B981' }}>بازگشت</button>
    </div>
  )

  const onboarding = user.onboardingAnswers as Record<string, string> | null
  const badges     = parseBadges(user.badges)

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '20px',
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)' }}
        >›</button>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
          >
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> // eslint-disable-line @next/next/no-img-element
              : (user.name ?? user.phone).charAt(0)
            }
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>{user.name ?? '—'}</h1>
            <p className="text-sm" style={{ color: 'var(--content-tertiary)', direction: 'ltr', textAlign: 'right' }}>{user.phone}</p>
          </div>
        </div>
        <button
          onClick={toggleActive}
          disabled={toggling}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: user.isActive ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            color:      user.isActive ? '#EF4444' : '#10B981',
          }}
        >
          {user.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: '🔥', label: 'زنجیره',  value: toPersian(user.streakCount) + ' روز' },
          { icon: '⭐', label: 'سطح',     value: toPersian(user.level)                 },
          { icon: '✨', label: 'XP',       value: toPersian(user.xpPoints)              },
          { icon: '🏅', label: 'مدال',     value: toPersian(badges.length)              },
        ].map(({ icon, label, value }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={cardStyle}>
            <p className="text-2xl">{icon}</p>
            <p className="text-lg font-bold mt-1" style={{ color: 'var(--content-primary)' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Onboarding answers */}
      {onboarding && Object.keys(onboarding).length > 0 && (
        <div style={cardStyle}>
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--content-primary)' }}>📝 پاسخ‌های ۳ سوال طلایی</h2>
          <div className="space-y-3">
            {Object.entries(onboarding).map(([q, a]) => (
              <div key={q} className="rounded-xl p-3" style={{ background: 'var(--surface-secondary)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--content-tertiary)' }}>{q}</p>
                <p className="text-sm" style={{ color: 'var(--content-primary)' }}>{String(a)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 flex items-center gap-3" style={cardStyle}>
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>{toPersian(stats.habitsCount)}</p>
              <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>عادت فعال</p>
            </div>
          </div>
          <div className="rounded-xl p-4 flex items-center gap-3" style={cardStyle}>
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>{toPersian(stats.goalsCount)}</p>
              <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>هدف در جریان</p>
            </div>
          </div>
        </div>
      )}

      {/* Discount code */}
      <div style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: 'var(--content-primary)' }}>🎟️ کد تخفیف اختصاصی</h2>
          {!showDiscount && (
            <button
              onClick={() => { setShowDiscount(true); setCreatedCode(null) }}
              className="text-sm px-4 py-2 rounded-xl font-semibold"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}
            >
              + ساخت کد تخفیف
            </button>
          )}
        </div>

        {showDiscount && !createdCode && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--content-secondary)' }}>نوع</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as typeof discountType)} style={inputStyle}>
                  <option value="percentage">درصدی</option>
                  <option value="fixed">مقداری (تومان)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--content-secondary)' }}>
                  مقدار {discountType === 'percentage' ? '(٪)' : '(تومان)'}
                </label>
                <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--content-secondary)' }}>کد (اختیاری)</label>
                <input
                  placeholder="خودکار تولید می‌شود"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  style={{ ...inputStyle, direction: 'ltr' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--content-secondary)' }}>اعتبار (روز)</label>
                <input type="number" value={discountExpiry} onChange={(e) => setDiscountExpiry(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createDiscount}
                disabled={creatingCode}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: creatingCode ? '#6B7280' : '#10B981' }}
              >
                {creatingCode ? 'در حال ساخت...' : 'ساخت کد'}
              </button>
              <button
                onClick={() => setShowDiscount(false)}
                className="py-2 px-4 rounded-xl text-sm"
                style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
              >
                لغو
              </button>
            </div>
          </div>
        )}

        {createdCode && (
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--content-tertiary)' }}>کد تخفیف ساخته شد:</p>
            <p className="text-2xl font-bold mb-1" style={{ color: '#10B981', direction: 'ltr' }}>{createdCode.code}</p>
            <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
              {createdCode.type === 'percentage' ? `${createdCode.value}٪` : fmtMoney(createdCode.value)} تخفیف ·
              تا {fmtDate(createdCode.expiresAt)}
            </p>
            <button
              onClick={() => { setCreatedCode(null); setShowDiscount(false) }}
              className="mt-3 text-xs"
              style={{ color: 'var(--content-tertiary)' }}
            >
              بستن
            </button>
          </div>
        )}
      </div>

      {/* Payment history */}
      <div style={cardStyle}>
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--content-primary)' }}>💳 تاریخچه پرداخت‌ها ({toPersian(payments.length)})</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--content-tertiary)' }}>پرداختی ثبت نشده</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
                    {p.packageName ?? '—'}
                    {p.isInstallment && <span className="mr-1 text-xs" style={{ color: '#F59E0B' }}>اقساطی</span>}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                    {METHOD_LABELS[p.method] ?? p.method} · {p.paidAt ? fmtDate(p.paidAt) : fmtDate(p.createdAt)}
                    {p.discountAmount > 0 && ` · تخفیف ${fmtMoney(p.discountAmount)}`}
                  </p>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--content-primary)' }}>{fmtMoney(p.amountToman)}</p>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: p.status === 'paid' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color:      p.status === 'paid' ? '#10B981' : '#EF4444',
                    }}
                  >
                    {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sessions history */}
      <div style={cardStyle}>
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--content-primary)' }}>🎙️ تاریخچه جلسات ({toPersian(sessions.length)})</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--content-tertiary)' }}>جلسه‌ای ثبت نشده</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>{s.coachName ?? '—'}</p>
                  <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                    {fmtDate(s.sessionDate)} · {s.sessionTime}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{
                    background: s.status === 'completed' ? 'rgba(16,185,129,0.12)' : s.status === 'confirmed' ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.12)',
                    color:      s.status === 'completed' ? '#10B981' : s.status === 'confirmed' ? '#3B82F6' : '#EF4444',
                  }}
                >
                  {BOOKING_STATUS_LABELS[s.status] ?? s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--content-tertiary)' }}>
        عضو از {fmtDate(user.createdAt)}
      </p>
    </div>
  )
}
