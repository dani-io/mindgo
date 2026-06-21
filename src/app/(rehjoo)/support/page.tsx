'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FAQ = [
  {
    q: 'تفاوت کوچ با روانپزشک چیست؟',
    a: 'کوچ یک کوچ حرفه‌ای است که روی رشد، اهداف و مهارت‌های زندگی کار می‌کند. روانپزشک پزشک متخصص است که اختلالات روانی را تشخیص و درمان می‌کند. اگر نشانه‌های بالینی داری، پیش روانپزشک برو؛ برای رشد شخصی، کوچ انتخاب بهتری‌ست.',
  },
  {
    q: 'آیا جلسه اول رایگان است؟',
    a: 'بله! بیشتر کوچ‌ها یک جلسه آشنایی کوتاه (معمولاً ۲۰ دقیقه) رایگان ارائه می‌دهند. پکیج‌های دارای برچسب «شروع آسان» را ببین.',
  },
  {
    q: 'اگر از جلسه راضی نبودم چه کنم؟',
    a: 'در صورت نارضایتی از جلسه اول، می‌توانی از طریق همین پشتیبانی درخواست بررسی بدی. تیم ما ظرف ۲۴ ساعت پاسخ می‌دهد.',
  },
  {
    q: 'نحوه لغو جلسه و بازگشت وجه',
    a: 'لغو تا ۲۴ ساعت قبل از جلسه → استرداد کامل. بین ۲۴-۶ ساعت → ۵۰٪ استرداد. کمتر از ۶ ساعت → استرداد وجه امکان‌پذیر نیست. درخواست لغو از پروفایل → سابقه جلسات قابل ثبت است.',
  },
  {
    q: 'آیا اطلاعاتم محرمانه می‌ماند؟',
    a: 'بله. تمام مکالمات و اطلاعات شخصی شما تحت پروتکل محرمانگی Mindgo کاملاً محفوظ است. کوچ‌ها نیز قرارداد عدم افشا امضا کرده‌اند.',
  },
]

export default function SupportPage() {
  const router = useRouter()
  const [openIdx,   setOpenIdx]   = useState<number | null>(null)
  const [starting,  setStarting]  = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function startChat() {
    setStarting(true)
    setError(null)
    try {
      const res  = await fetch('/api/support/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: 'general' }) })
      const json = await res.json()
      if (json.success) {
        router.push(`/support/chat?uid=${json.data.supportUserId}`)
      } else {
        setError('خطا در شروع گفتگو. دوباره امتحان کن.')
      }
    } catch {
      setError('اتصال به سرور برقرار نشد.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          ›
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>پشتیبانی</h1>
          <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>اینجاییم که کمک کنیم</p>
        </div>
      </div>

      {/* FAQ */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
          🙋 سوالات متداول
        </h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-4 text-right"
                style={{ background: openIdx === i ? 'rgba(16,185,129,0.04)' : 'var(--surface-card)' }}
              >
                <span className="text-sm font-medium flex-1 text-right" style={{ color: 'var(--content-primary)' }}>
                  {item.q}
                </span>
                <span
                  className="text-base flex-shrink-0 transition-transform"
                  style={{
                    color:     '#10B981',
                    transform: openIdx === i ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  +
                </span>
              </button>
              {openIdx === i && (
                <div className="px-4 pb-4" style={{ background: 'var(--surface-card)' }}>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--content-secondary)' }}>
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="rounded-2xl p-6 text-center"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-2xl mb-2">💬</p>
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--content-primary)' }}>
          جواب سوالت رو پیدا نکردی؟
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--content-tertiary)' }}>
          تیم پشتیبانی معمولاً در کمتر از ۲ ساعت جواب می‌ده
        </p>

        {error && (
          <p className="text-xs mb-3 text-center" style={{ color: '#EF4444' }}>{error}</p>
        )}

        <button
          onClick={startChat}
          disabled={starting}
          className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
          style={{
            background: starting ? 'rgba(16,185,129,0.5)' : '#10B981',
            opacity:    starting ? 0.8 : 1,
          }}
        >
          {starting ? 'در حال اتصال...' : 'گفتگو با پشتیبانی 💬'}
        </button>
      </section>

    </div>
  )
}
