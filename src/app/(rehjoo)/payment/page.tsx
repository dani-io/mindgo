'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FileUpload from '@/components/ui/FileUpload'

// ── Helpers ───────────────────────────────────────────────

function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatPrice(toman: number): string {
  const s = toman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return toPersian(s) + ' تومان'
}

type Method = 'card_to_card' | 'snappay' | 'digipay' | 'zarinpal'

interface CardInfo {
  cardNumber:     string
  cardNumberFmt:  string
  cardHolderName: string
  coachName:      string
  amount:         number
}

// ── Page ──────────────────────────────────────────────────

export default function PaymentPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const bookingId  = searchParams.get('booking_id') ?? ''
  const coachName  = searchParams.get('coach_name') ?? ''
  const pkgName    = searchParams.get('pkg_name')   ?? ''
  const dateLabel  = searchParams.get('date_label') ?? searchParams.get('date') ?? ''
  const time       = searchParams.get('time')       ?? ''
  const amountRaw  = Number(searchParams.get('amount') ?? 0)

  const [method, setMethod] = useState<Method>('card_to_card')

  // Card-to-card
  const [cardInfo,     setCardInfo]     = useState<CardInfo | null>(null)
  const [cardError,    setCardError]    = useState<string | null>(null)
  const [trackingCode, setTrackingCode] = useState('')
  const [receiptUrl,   setReceiptUrl]   = useState('')
  const [copied,       setCopied]       = useState(false)
  const [submitted,    setSubmitted]    = useState(false)

  // SnappPay + discount
  const [discountInput,   setDiscountInput]   = useState('')
  const [discountApplied, setDiscountApplied] = useState<{ code: string; amount: number } | null>(null)
  const [discountError,   setDiscountError]   = useState<string | null>(null)
  const [discountLoading, setDiscountLoading] = useState(false)

  const [paying,   setPaying]   = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  // Load coach card details (owner-scoped) for the card-to-card option.
  useEffect(() => {
    if (!bookingId) return
    fetch(`/api/payments/card-to-card?booking_id=${encodeURIComponent(bookingId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCardInfo(json.data)
        else setCardError(json.error?.message ?? 'شماره کارت کوچ در دسترس نیست')
      })
      .catch(() => setCardError('خطا در دریافت اطلاعات کارت'))
  }, [bookingId])

  const cardAmount        = cardInfo?.amount ?? amountRaw
  const snappFinal        = amountRaw - (discountApplied?.amount ?? 0)
  const installmentAmount = Math.ceil(snappFinal / 4)

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
      if (json.success) setDiscountApplied({ code: json.data.code, amount: json.data.discount_amount })
      else setDiscountError(json.error?.message ?? 'کد نامعتبر است')
    } catch {
      setDiscountError('خطا در اتصال به سرور')
    } finally {
      setDiscountLoading(false)
    }
  }

  async function copyCard() {
    if (!cardInfo) return
    try {
      await navigator.clipboard.writeText(cardInfo.cardNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  // Card-to-card submit → creates a pending_verification payment.
  async function submitCardToCard() {
    if (!trackingCode.trim()) { setPayError('کد رهگیری تراکنش را وارد کنید'); return }
    setPaying(true)
    setPayError(null)
    try {
      const res = await fetch('/api/payments/card-to-card', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id:        bookingId,
          tracking_code:     trackingCode.trim(),
          receipt_image_url: receiptUrl || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) { setPayError(json.error?.message ?? 'خطا در ثبت پرداخت'); return }
      setSubmitted(true)
    } catch {
      setPayError('خطا در ارتباط با سرور')
    } finally {
      setPaying(false)
    }
  }

  // SnappPay submit → existing initiate flow.
  async function submitSnappPay() {
    setPaying(true)
    setPayError(null)
    try {
      const res = await fetch('/api/payments/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, method: 'snappay', discount_code: discountApplied?.code ?? undefined }),
      })
      const json = await res.json()
      if (!json.success) { setPayError(json.error?.message ?? 'خطایی در پرداخت رخ داد'); return }
      const qs = new URLSearchParams({
        payment_id: json.data.payment_id, booking_id: bookingId,
        coach_name: coachName, pkg_name: pkgName, date_label: dateLabel, time,
        amount: String(json.data.amount_final), method: 'snappay',
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
        <button onClick={() => router.push('/coaches')} style={{ color: '#10B981' }}>بازگشت به کوچ‌ها</button>
      </div>
    )
  }

  // ── Submitted (card-to-card) confirmation state ──────────
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 flex flex-col items-center text-center" style={{ direction: 'rtl' }}>
        <div className="text-6xl mb-5">⏳</div>
        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--content-primary)' }}>
          پرداخت شما ثبت شد
        </h1>
        <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: 'var(--content-secondary)' }}>
          کد رهگیری برای کوچ ارسال شد. به‌محض تأیید دریافت وجه توسط کوچ، رزرو شما نهایی و جلسه ایجاد می‌شود.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3.5 rounded-xl font-bold text-white"
          style={{ background: '#10B981' }}
        >
          بازگشت به داشبورد
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-40" style={{ direction: 'rtl' }}>

      {/* Back */}
      <div className="px-4 pt-5 mb-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm" style={{ color: 'var(--content-secondary)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4l4 4-4 4M3 8h11" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          انتخاب زمان
        </button>
      </div>

      <h1 className="px-4 text-xl font-bold mb-5" style={{ color: 'var(--content-primary)' }}>پرداخت</h1>

      {/* Order summary */}
      <section className="px-4 mb-5">
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>خلاصه سفارش</p>
          <div className="flex flex-col gap-2.5">
            <Row label="کوچ"  value={coachName} />
            <Row label="پکیج" value={pkgName} />
            <Row label="تاریخ" value={dateLabel} />
            <Row label="ساعت"  value={toPersian(time)} />
            <div className="border-t pt-2.5 mt-1" style={{ borderColor: 'var(--border-color)' }}>
              <Row label="مبلغ پکیج" value={formatPrice(amountRaw)} bold />
            </div>
          </div>
        </div>
      </section>

      {/* Payment method */}
      <section className="px-4 mb-5">
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>روش پرداخت</p>

        <div className="flex flex-col gap-3">
          <MethodCard
            active={method === 'card_to_card'}
            onSelect={() => setMethod('card_to_card')}
            icon="💳"
            title="کارت به کارت"
            subtitle="واریز مستقیم به کارت کوچ — بدون کارمزد"
            badge="پیشنهادی"
            badgeColor="#10B981"
          />
          <MethodCard
            active={method === 'snappay'}
            onSelect={() => setMethod('snappay')}
            icon="🛍️"
            title="اسنپ‌پی"
            subtitle={`۴ قسط ${formatPrice(installmentAmount)}`}
            badge="پرداخت اقساطی"
            badgeColor="#8B5CF6"
          />
          <MethodCard
            active={false}
            disabled
            icon="💠"
            title="دیجی‌پی"
            subtitle="پرداخت آنلاین با دیجی‌پی"
            badge="به‌زودی"
            badgeColor="var(--content-tertiary)"
          />
          <MethodCard
            active={false}
            disabled
            icon="🏛️"
            title="درگاه پرداخت مستقیم"
            subtitle="پرداخت آنلاین با درگاه بانکی (زرین‌پال)"
            badge="به‌زودی"
            badgeColor="var(--content-tertiary)"
          />
        </div>
      </section>

      {/* ── Card-to-card panel ─────────────────────────────── */}
      {method === 'card_to_card' && (
        <section className="px-4 mb-5">
          {cardError ? (
            <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
              {cardError}
            </div>
          ) : !cardInfo ? (
            <div className="rounded-xl p-4 animate-pulse" style={{ height: 180, background: 'var(--surface-card)' }} />
          ) : (
            <div className="flex flex-col gap-4">
              {/* Instructions */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--content-primary)' }}>
                  ۱. مبلغ <b style={{ color: '#10B981' }}>{formatPrice(cardAmount)}</b> را به شماره کارت زیر واریز کنید
                </p>
                <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--content-primary)' }}>
                  ۲. کد رهگیری/پیگیری تراکنش را در کادر زیر وارد کنید
                </p>
              </div>

              {/* Card display */}
              <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #065F46, #10B981)' }}>
                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>شماره کارت کوچ</p>
                <p className="text-xl font-bold tracking-wider mb-4" style={{ color: '#fff', direction: 'ltr', textAlign: 'left', fontFamily: 'monospace' }}>
                  {toPersian(cardInfo.cardNumberFmt)}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.7)' }}>صاحب کارت</p>
                    <p className="text-sm font-semibold" style={{ color: '#fff' }}>{cardInfo.cardHolderName || cardInfo.coachName}</p>
                  </div>
                  <button
                    onClick={copyCard}
                    className="text-xs font-semibold px-3 py-2 rounded-lg active:scale-95 transition-all"
                    style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
                  >
                    {copied ? '✓ کپی شد' : '📋 کپی شماره کارت'}
                  </button>
                </div>
              </div>

              {/* Tracking code */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--content-primary)' }}>
                  کد رهگیری تراکنش <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => { setTrackingCode(e.target.value); setPayError(null) }}
                  placeholder="کد پیگیری واریز را وارد کنید"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
                />
              </div>

              {/* Receipt upload (optional) */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--content-primary)' }}>
                  آپلود تصویر رسید <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>(اختیاری)</span>
                </label>
                <FileUpload
                  folder="receipts"
                  acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                  onUploadComplete={(url) => setReceiptUrl(url)}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── SnappPay panel (discount + info) ───────────────── */}
      {method === 'snappay' && (
        <>
          <section className="px-4 mb-5">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>کد تخفیف</p>
            {discountApplied ? (
              <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#10B981' }}>کد {discountApplied.code} اعمال شد ✓</p>
                  <p className="text-xs mt-0.5" style={{ color: '#10B981' }}>تخفیف: {formatPrice(discountApplied.amount)}</p>
                </div>
                <button onClick={() => { setDiscountApplied(null); setDiscountInput('') }} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>حذف</button>
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
                    style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
                  />
                  <button onClick={handleApplyDiscount} disabled={!discountInput.trim() || discountLoading}
                    className="px-4 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    style={{ background: discountInput.trim() ? '#10B981' : 'var(--surface-tertiary)', color: discountInput.trim() ? '#fff' : 'var(--content-tertiary)' }}>
                    {discountLoading ? '...' : 'اعمال'}
                  </button>
                </div>
                {discountError && <p className="text-xs mt-2" style={{ color: '#EF4444' }}>{discountError}</p>}
              </>
            )}
          </section>

          <section className="px-4 mb-5">
            <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#8B5CF6' }}>
                ℹ️ با اسنپ‌پی کل مبلغ به ۴ قسط تقسیم می‌شود. پکیج فوراً فعال می‌گردد و شما فقط {formatPrice(installmentAmount)} اول را پرداخت می‌کنید.
              </p>
            </div>
          </section>
        </>
      )}

      {/* Error */}
      {payError && (
        <div className="px-4 mb-4">
          <p className="text-sm text-center py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>{payError}</p>
        </div>
      )}

      {/* Sticky action button */}
      <div className="fixed inset-x-0 px-4 py-4" style={{ bottom: 68, zIndex: 45, background: 'var(--surface-card)', borderTop: '1px solid var(--border-color)' }}>
        <div className="max-w-lg mx-auto">
          {method === 'card_to_card' ? (
            <button
              disabled={paying || !cardInfo || !trackingCode.trim()}
              onClick={submitCardToCard}
              className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all active:scale-95"
              style={{ background: (paying || !cardInfo || !trackingCode.trim()) ? 'var(--surface-tertiary)' : '#10B981' }}
            >
              {paying ? 'در حال ثبت...' : 'تأیید پرداخت'}
            </button>
          ) : method === 'snappay' ? (
            <button
              disabled={paying}
              onClick={submitSnappPay}
              className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all active:scale-95"
              style={{ background: paying ? 'var(--surface-tertiary)' : '#10B981' }}
            >
              {paying ? 'در حال پردازش...' : `پرداخت ${formatPrice(installmentAmount)} (قسط اول)`}
            </button>
          ) : (
            <button disabled className="w-full py-3.5 rounded-xl font-bold text-base transition-all" style={{ background: 'var(--surface-tertiary)', color: 'var(--content-tertiary)' }}>
              این روش به‌زودی فعال می‌شود
            </button>
          )}
          <p className="text-xs text-center mt-2" style={{ color: 'var(--content-tertiary)' }}>
            {method === 'card_to_card' ? 'پس از تأیید کوچ، رزرو نهایی می‌شود 🔒' : method === 'snappay' ? 'سرویس اقساطی اسنپ‌پی 🔒' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────

function Row({ label, value, bold = false, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'}`} style={{ color: color ?? 'var(--content-primary)' }}>{value}</span>
    </div>
  )
}

function MethodCard({
  active, onSelect, icon, title, subtitle, badge, badgeColor, disabled = false,
}: {
  active: boolean
  onSelect?: () => void
  icon: string
  title: string
  subtitle: string
  badge?: string
  badgeColor?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className="w-full text-right rounded-xl p-4 transition-all"
      style={{
        background: active ? 'rgba(16,185,129,0.08)' : 'var(--surface-card)',
        border:     `2px solid ${active ? '#10B981' : 'var(--border-color)'}`,
        opacity:    disabled ? 0.5 : 1,
        cursor:     disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'var(--surface-secondary)' }}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>{title}</p>
            {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${badgeColor}20`, color: badgeColor }}>{badge}</span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--content-secondary)' }}>{subtitle}</p>
        </div>
        {!disabled && (
          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            style={{ borderColor: active ? '#10B981' : 'var(--border-color)', backgroundColor: active ? '#10B981' : 'transparent' }}>
            {active && <div className="w-2 h-2 bg-white rounded-full" />}
          </div>
        )}
      </div>
    </button>
  )
}
