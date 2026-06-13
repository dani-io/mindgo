'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ── Helpers ───────────────────────────────────────────────

function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatPrice(toman: number): string {
  const s = toman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return toPersian(s) + ' تومان'
}

type Method = 'zarinpal' | 'snappay'

// ── Page ──────────────────────────────────────────────────

export default function PaymentPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const bookingId  = searchParams.get('booking_id') ?? ''
  const coachName  = searchParams.get('coach_name') ?? ''
  const pkgName    = searchParams.get('pkg_name')   ?? ''
  const date       = searchParams.get('date')       ?? ''
  const dateLabel  = searchParams.get('date_label') ?? date
  const time       = searchParams.get('time')       ?? ''
  const amountRaw  = Number(searchParams.get('amount') ?? 0)

  const [method,        setMethod]        = useState<Method>('zarinpal')
  const [discountInput, setDiscountInput] = useState('')
  const [discountApplied, setDiscountApplied] = useState<{ code: string; amount: number } | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discountLoading, setDiscountLoading] = useState(false)
  const [paying,        setPaying]        = useState(false)
  const [payError,      setPayError]      = useState<string | null>(null)

  const finalAmount = amountRaw - (discountApplied?.amount ?? 0)
  const installmentAmount = Math.ceil(finalAmount / 4)

  async function handleApplyDiscount() {
    if (!discountInput.trim()) return
    setDiscountLoading(true)
    setDiscountError(null)
    try {
      const res  = await fetch('/api/payments/discount/validate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountInput.trim(), amount: amountRaw }),
      })
      const json = await res.json()
      if (json.success) {
        setDiscountApplied({ code: json.data.code, amount: json.data.discount_amount })
      } else {
        setDiscountError(json.error?.message ?? 'کد نامعتبر است')
      }
    } catch {
      setDiscountError('خطا در اتصال به سرور')
    } finally {
      setDiscountLoading(false)
    }
  }

  function removeDiscount() {
    setDiscountApplied(null)
    setDiscountInput('')
    setDiscountError(null)
  }

  async function handlePay() {
    if (!bookingId) return
    setPaying(true)
    setPayError(null)
    try {
      const res  = await fetch('/api/payments/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id:    bookingId,
          method,
          discount_code: discountApplied?.code ?? undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setPayError(json.error?.message ?? 'خطایی در پرداخت رخ داد')
        return
      }

      const qs = new URLSearchParams({
        payment_id: json.data.payment_id,
        booking_id: bookingId,
        coach_name: coachName,
        pkg_name:   pkgName,
        date_label: dateLabel,
        time,
        amount:     String(json.data.amount_final),
        method,
      })
      router.push(`/payment/success?${qs}`)
    } catch {
      setPayError('خطا در ارتباط با سرور')
    } finally {
      setPaying(false)
    }
  }

  if (!bookingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4" style={{ color: 'var(--content-secondary)' }}>
        <p className="text-4xl mb-3">⚠️</p>
        <p className="mb-4">اطلاعات رزرو یافت نشد</p>
        <button onClick={() => router.push('/coaches')} style={{ color: '#10B981' }}>بازگشت به راه‌بلدها</button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-36">

      {/* Back */}
      <div className="px-4 pt-5 mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--content-secondary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4l4 4-4 4M3 8h11" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          انتخاب زمان
        </button>
      </div>

      <h1 className="px-4 text-xl font-bold mb-5" style={{ color: 'var(--content-primary)' }}>
        پرداخت
      </h1>

      {/* Order summary */}
      <section className="px-4 mb-5">
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
            خلاصه سفارش
          </p>
          <div className="flex flex-col gap-2.5">
            <Row label="راه‌بلد"  value={coachName} />
            <Row label="پکیج"     value={pkgName} />
            <Row label="تاریخ"    value={dateLabel} />
            <Row label="ساعت"     value={toPersian(time)} />
            <div className="border-t pt-2.5 mt-1" style={{ borderColor: 'var(--border-color)' }}>
              <Row label="مبلغ پکیج" value={formatPrice(amountRaw)} bold />
            </div>
          </div>
        </div>
      </section>

      {/* Discount code */}
      <section className="px-4 mb-5">
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
          کد تخفیف
        </p>

        {discountApplied ? (
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: '#10B981' }}>
                کد {discountApplied.code} اعمال شد ✓
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#10B981' }}>
                تخفیف: {formatPrice(discountApplied.amount)}
              </p>
            </div>
            <button
              onClick={removeDiscount}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
            >
              حذف
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="کد تخفیف را وارد کنید"
                value={discountInput}
                onChange={(e) => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError(null) }}
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: 'var(--surface-card)',
                  border:     '1px solid var(--border-color)',
                  color:      'var(--content-primary)',
                }}
              />
              <button
                onClick={handleApplyDiscount}
                disabled={!discountInput.trim() || discountLoading}
                className="px-4 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: discountInput.trim() ? '#10B981' : 'var(--surface-tertiary)',
                  color:      discountInput.trim() ? '#fff'     : 'var(--content-tertiary)',
                }}
              >
                {discountLoading ? '...' : 'اعمال'}
              </button>
            </div>
            {discountError && (
              <p className="text-xs mt-2" style={{ color: '#EF4444' }}>{discountError}</p>
            )}
          </>
        )}
      </section>

      {/* Payment method */}
      <section className="px-4 mb-5">
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
          روش پرداخت
        </p>

        <div className="flex flex-col gap-3">
          {/* ZarinPal */}
          <MethodCard
            id="zarinpal"
            active={method === 'zarinpal'}
            onSelect={() => setMethod('zarinpal')}
            icon="💳"
            title="پرداخت نقدی"
            subtitle="زرین‌پال — پرداخت آنی و امن"
          />

          {/* SnappPay */}
          <MethodCard
            id="snappay"
            active={method === 'snappay'}
            onSelect={() => setMethod('snappay')}
            icon="🛍️"
            title="اقساطی اسنپ‌پی"
            subtitle={`۴ قسط ${formatPrice(installmentAmount)} — بدون کارمزد برای شما`}
          />
        </div>

        {method === 'snappay' && (
          <div
            className="mt-3 rounded-xl px-4 py-3"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <p className="text-xs leading-relaxed" style={{ color: '#3B82F6' }}>
              ℹ️ با اسنپ‌پی، کل مبلغ همان ابتدا به صورت خودکار به ۴ قسط تقسیم می‌شود. پکیج فوراً فعال می‌گردد و شما فقط {formatPrice(installmentAmount)} اول را پرداخت می‌کنید.
            </p>
          </div>
        )}
      </section>

      {/* Final price */}
      <section className="px-4 mb-5">
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          {discountApplied && (
            <>
              <Row label="قیمت اصلی"   value={formatPrice(amountRaw)} />
              <Row label="تخفیف"        value={`— ${formatPrice(discountApplied.amount)}`} color="#10B981" />
              <div className="border-t mt-2 pt-2" style={{ borderColor: 'var(--border-color)' }} />
            </>
          )}
          <Row
            label={method === 'snappay' ? `قسط اول (۱ از ۴)` : 'مبلغ قابل پرداخت'}
            value={method === 'snappay' ? formatPrice(installmentAmount) : formatPrice(finalAmount)}
            bold
            color="#10B981"
          />
        </div>
      </section>

      {/* Error */}
      {payError && (
        <div className="px-4 mb-4">
          <p className="text-sm text-center py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
            {payError}
          </p>
        </div>
      )}

      {/* Sticky pay button */}
      <div
        className="fixed inset-x-0 px-4 py-4"
        style={{
          bottom:     68,
          zIndex:     45,
          background: 'var(--surface-card)',
          borderTop:  '1px solid var(--border-color)',
        }}
      >
        <div className="max-w-lg mx-auto">
          <button
            disabled={paying}
            onClick={handlePay}
            className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all active:scale-95"
            style={{ background: paying ? 'var(--surface-tertiary)' : '#10B981' }}
          >
            {paying
              ? 'در حال پردازش...'
              : method === 'snappay'
                ? `پرداخت ${formatPrice(installmentAmount)} (قسط اول)`
                : `پرداخت ${formatPrice(finalAmount)}`}
          </button>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--content-tertiary)' }}>
            {method === 'zarinpal' ? 'درگاه امن زرین‌پال 🔒' : 'سرویس اقساطی اسنپ‌پی 🔒'}
          </p>
        </div>
      </div>

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────

function Row({
  label,
  value,
  bold = false,
  color,
}: {
  label: string
  value: string
  bold?: boolean
  color?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{label}</span>
      <span
        className={`text-sm ${bold ? 'font-bold' : 'font-medium'}`}
        style={{ color: color ?? 'var(--content-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}

function MethodCard({
  id,
  active,
  onSelect,
  icon,
  title,
  subtitle,
}: {
  id: string
  active: boolean
  onSelect: () => void
  icon: string
  title: string
  subtitle: string
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-right rounded-xl p-4 transition-all active:scale-[0.98]"
      style={{
        background: active ? 'rgba(16,185,129,0.08)' : 'var(--surface-card)',
        border:     `2px solid ${active ? '#10B981' : 'var(--border-color)'}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'var(--surface-secondary)' }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>
            {title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--content-secondary)' }}>
            {subtitle}
          </p>
        </div>
        <div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
          style={{
            borderColor:     active ? '#10B981' : 'var(--border-color)',
            backgroundColor: active ? '#10B981' : 'transparent',
          }}
        >
          {active && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
      </div>
    </button>
  )
}
