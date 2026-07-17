'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FileUpload from '@/components/ui/FileUpload'

type FeedbackType = 'bug' | 'suggestion' | 'comment'

const TYPES: { key: FeedbackType; icon: string; label: string }[] = [
  { key: 'bug',        icon: '🐛', label: 'گزارش باگ' },
  { key: 'suggestion', icon: '💡', label: 'پیشنهاد' },
  { key: 'comment',    icon: '💬', label: 'نظر' },
]

// Reusable feedback form used by both rehjoo and coach panels.
// `backTo` is where the back button + post-success navigation goes.
export default function FeedbackForm({ backTo = '/dashboard' }: { backTo?: string }) {
  const router = useRouter()

  const [type,        setType]        = useState<FeedbackType>('bug')
  const [content,     setContent]     = useState('')
  const [screenshot,  setScreenshot]  = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [pageUrl,     setPageUrl]     = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [done,       setDone]       = useState(false)

  // Auto-capture the page the user came from.
  useEffect(() => {
    if (typeof document !== 'undefined' && document.referrer) setPageUrl(document.referrer)
  }, [])

  async function submit() {
    if (content.trim().length < 10) { setError('متن بازخورد باید حداقل ۱۰ کاراکتر باشد'); return }
    setSubmitting(true)
    setError('')
    try {
      const token = localStorage.getItem('mg_token')
      const res = await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          type,
          content: content.trim(),
          screenshotUrl: screenshot || undefined,
          pageUrl: pageUrl || undefined,
          isAnonymous,
        }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error?.message ?? 'خطا در ارسال بازخورد'); setSubmitting(false); return }
      setDone(true)
    } catch {
      setError('خطا در اتصال به سرور')
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 flex flex-col items-center text-center" style={{ direction: 'rtl' }}>
        <div className="text-6xl mb-5">🙏</div>
        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--content-primary)' }}>ممنون از بازخوردت!</h1>
        <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: 'var(--content-secondary)' }}>
          بازخورد تو ثبت شد و به تیم Mindgo رسید. کمک بزرگی به بهتر شدن محصول کردی.
        </p>
        <button
          onClick={() => router.push(backTo)}
          className="w-full py-3.5 rounded-xl font-bold text-white"
          style={{ background: '#10B981' }}
        >
          بازگشت
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
          style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)' }}
        >
          ›
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>📝 ارسال بازخورد</h1>
          <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>نظرت برامون مهمه</p>
        </div>
      </div>

      {/* Type selector */}
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>نوع بازخورد</p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {TYPES.map((t) => {
          const sel = type === t.key
          return (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
              style={{
                background: sel ? 'rgba(16,185,129,0.1)' : 'var(--surface-card)',
                border:     `1.5px solid ${sel ? '#10B981' : 'var(--border-color)'}`,
                color:      sel ? '#10B981' : 'var(--content-secondary)',
              }}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--content-secondary)' }}>
        متن بازخورد <span style={{ color: '#EF4444' }}>*</span>
      </p>
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setError('') }}
        placeholder="بازخورد شما..."
        rows={5}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none mb-1"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
      />
      <p className="text-xs mb-5" style={{ color: content.trim().length >= 10 ? 'var(--content-tertiary)' : '#F59E0B' }}>
        حداقل ۱۰ کاراکتر
      </p>

      {/* Screenshot upload */}
      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--content-secondary)' }}>
        تصویر (اختیاری)
      </p>
      <div className="mb-5">
        <FileUpload
          folder="feedback"
          acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
          onUploadComplete={(url) => setScreenshot(url)}
          label="آپلود اسکرین‌شات"
        />
      </div>

      {/* Anonymous toggle */}
      <div
        className="flex items-center justify-between rounded-xl p-4 mb-6"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>ارسال ناشناس</p>
          <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>اطلاعات حساب شما پیوست نمی‌شود</p>
        </div>
        <button
          onClick={() => setIsAnonymous((v) => !v)}
          className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
          style={{ background: isAnonymous ? '#10B981' : 'var(--surface-secondary)' }}
          aria-label="ارسال ناشناس"
        >
          <div
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
            style={{ right: isAnonymous ? '2px' : 'auto', left: isAnonymous ? 'auto' : '2px' }}
          />
        </button>
      </div>

      {error && <p className="text-sm text-center mb-3" style={{ color: '#EF4444' }}>{error}</p>}

      <button
        onClick={submit}
        disabled={submitting || content.trim().length < 10}
        className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all active:scale-[0.99]"
        style={{ background: (submitting || content.trim().length < 10) ? 'var(--surface-tertiary)' : '#10B981' }}
      >
        {submitting ? 'در حال ارسال...' : 'ارسال بازخورد'}
      </button>
    </div>
  )
}
