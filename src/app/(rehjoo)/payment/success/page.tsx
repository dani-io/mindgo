'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatPrice(toman: number): string {
  const s = toman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return toPersian(s) + ' تومان'
}

export default function PaymentSuccessPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const coachName = searchParams.get('coach_name') ?? ''
  const pkgName   = searchParams.get('pkg_name')   ?? ''
  const dateLabel = searchParams.get('date_label') ?? ''
  const time      = searchParams.get('time')       ?? ''
  const amount    = Number(searchParams.get('amount') ?? 0)
  const method    = searchParams.get('method')     ?? 'zarinpal'

  const [show, setShow] = useState(false)

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setShow(true), 80)
    return () => clearTimeout(t)
  }, [])

  const isSnappay = method === 'snappay'
  const installment = Math.ceil(amount / 4)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 pb-24"
      style={{ background: 'var(--surface-primary)' }}
    >
      {/* Success icon */}
      <div
        className="transition-all duration-500"
        style={{
          opacity:   show ? 1 : 0,
          transform: show ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(20px)',
        }}
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{
            background: 'rgba(16,185,129,0.15)',
            boxShadow:  '0 0 0 16px rgba(16,185,129,0.06)',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="rgba(16,185,129,0.2)" />
            <path
              d="M14 24l7 7 13-13"
              stroke="#10B981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div
        className="text-center transition-all duration-500 delay-100"
        style={{
          opacity:   show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--content-primary)' }}>
          پرداخت موفق ✓
        </h1>
        <p className="text-sm" style={{ color: 'var(--content-secondary)' }}>
          جلسه‌ات با موفقیت رزرو شد
        </p>
      </div>

      {/* Session details card */}
      {(coachName || dateLabel) && (
        <div
          className="w-full max-w-sm mt-8 rounded-2xl p-5 transition-all duration-500 delay-200"
          style={{
            background: 'var(--surface-card)',
            border:     '1px solid var(--border-color)',
            opacity:    show ? 1 : 0,
            transform:  show ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          <p className="text-xs font-semibold mb-4" style={{ color: 'var(--content-tertiary)' }}>
            جزئیات جلسه
          </p>

          <div className="flex flex-col gap-3">
            {coachName && <DetailRow icon="🧭" label="کوچ"  value={coachName} />}
            {pkgName   && <DetailRow icon="📦" label="پکیج"    value={pkgName} />}
            {dateLabel && <DetailRow icon="📅" label="تاریخ"   value={dateLabel} />}
            {time      && <DetailRow icon="⏰" label="ساعت"    value={toPersian(time)} />}
            {amount > 0 && (
              <div
                className="mt-1 pt-3 border-t"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {isSnappay ? (
                  <>
                    <DetailRow
                      icon="💳"
                      label="قسط اول پرداخت شد"
                      value={formatPrice(installment)}
                      color="#10B981"
                      bold
                    />
                    <p className="text-xs mt-2 mr-7" style={{ color: 'var(--content-tertiary)' }}>
                      ۳ قسط {formatPrice(installment)} در ماه‌های آینده
                    </p>
                  </>
                ) : (
                  <DetailRow
                    icon="💳"
                    label="مبلغ پرداخت شده"
                    value={formatPrice(amount)}
                    color="#10B981"
                    bold
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info banner */}
      <div
        className="w-full max-w-sm mt-4 rounded-xl px-4 py-3 transition-all duration-500 delay-300"
        style={{
          background: 'rgba(59,130,246,0.08)',
          border:     '1px solid rgba(59,130,246,0.2)',
          opacity:    show ? 1 : 0,
        }}
      >
        <p className="text-xs leading-relaxed text-center" style={{ color: '#3B82F6' }}>
          📩 اطلاعات جلسه به شماره موبایلت ارسال شد. ۳۰ دقیقه قبل از جلسه لینک اتاق گفتگو فعال می‌شود.
        </p>
      </div>

      {/* Actions */}
      <div
        className="w-full max-w-sm mt-6 flex flex-col gap-3 transition-all duration-500 delay-[400ms]"
        style={{
          opacity:   show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all active:scale-95"
          style={{ background: '#10B981' }}
        >
          بازگشت به داشبورد
        </button>
        <button
          onClick={() => router.push('/coaches')}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
          style={{
            background: 'var(--surface-card)',
            color:      'var(--content-secondary)',
            border:     '1px solid var(--border-color)',
          }}
        >
          مشاهده کوچ‌های دیگر
        </button>
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
  color,
  bold = false,
}: {
  icon: string
  label: string
  value: string
  color?: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-base flex-shrink-0">{icon}</span>
      <div className="flex items-center justify-between flex-1 min-w-0">
        <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{label}</span>
        <span
          className={`text-sm ${bold ? 'font-bold' : 'font-medium'} truncate mr-2`}
          style={{ color: color ?? 'var(--content-primary)' }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}
