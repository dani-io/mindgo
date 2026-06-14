'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import JitsiRoom from '@/components/booking/JitsiRoom'

interface SessionData {
  id:              string
  status:          string
  confirmedByUser: boolean
  startedAt:       string | null
  endedAt:         string | null
  autoConfirmAt:   string | null
  booking: {
    id:          string
    sessionDate: string
    sessionTime: string
    jitsiRoomId: string | null
    user:        { id: string; name: string }
    coach:       { id: string; userId: string; name: string }
    package:     { name: string; durationMinutes: number; priceToman: number }
  }
}

type ViewState = 'loading' | 'waiting' | 'in_session' | 'post_session' | 'error'

function toPersian(s: string | number) {
  return String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export default function RehjooSessionPage() {
  const { sessionId } = useParams() as { sessionId: string }
  const router        = useRouter()

  const [session,   setSession]   = useState<SessionData | null>(null)
  const [view,      setView]      = useState<ViewState>('loading')
  const [userName,  setUserName]  = useState('رهجو')
  const [submitting, setSubmitting] = useState(false)
  const [feedback,  setFeedback]  = useState<string | null>(null)
  const [error,     setError]     = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`)
    if (!res.ok) {
      setView('error')
      setError('جلسه یافت نشد')
      return null
    }
    const json = await res.json()
    if (!json.success) {
      setView('error')
      setError(json.error?.message ?? 'خطا')
      return null
    }
    return json.data as SessionData
  }, [sessionId])

  useEffect(() => {
    const token = localStorage.getItem('mg_token')
    if (!token) { router.push('/login'); return }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.name) setUserName(payload.name)
    } catch { /* ignore */ }

    fetchSession().then((data) => {
      if (!data) return
      setSession(data)
      resolveView(data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resolveView(data: SessionData) {
    if (data.status === 'completed' || data.status === 'disputed') {
      setView('post_session')
      return
    }

    const sessionDateTime = new Date(
      `${data.booking.sessionDate.slice(0, 10)}T${data.booking.sessionTime}`,
    )
    const minsUntil = (sessionDateTime.getTime() - Date.now()) / 60_000

    // Allow entry up to 5 min early, or if already in_progress
    if (minsUntil > 30) {
      setView('waiting')
    } else {
      setView('in_session')
    }
  }

  async function handleConfirm() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/confirm`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setFeedback('جلسه تأیید شد. سهم راه‌بلد آزاد شد. ممنون از اعتمادت! 🌱')
      } else {
        setFeedback(json.error?.message ?? 'خطا در تأیید')
      }
    } catch {
      setFeedback('خطای شبکه. لطفاً دوباره امتحان کنید.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDispute() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/dispute`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setFeedback('شکایت ثبت شد. تیم Mindgo به زودی بررسی خواهد کرد.')
      } else {
        setFeedback(json.error?.message ?? 'خطا در ثبت شکایت')
      }
    } catch {
      setFeedback('خطای شبکه. لطفاً دوباره امتحان کنید.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full animate-pulse mx-auto" style={{ background: 'rgba(16,185,129,0.2)' }} />
          <p style={{ color: 'var(--text-muted)' }}>در حال بارگذاری جلسه...</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────
  if (view === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="text-center space-y-4">
          <p className="text-3xl">⚠️</p>
          <p style={{ color: 'var(--text-muted)' }}>{error ?? 'خطا در بارگذاری جلسه'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            بازگشت به داشبورد
          </button>
        </div>
      </div>
    )
  }

  // ── Waiting Room ──────────────────────────────────────────
  if (view === 'waiting' && session) {
    const dt = new Date(
      `${session.booking.sessionDate.slice(0, 10)}T${session.booking.sessionTime}`,
    )
    const minsUntil = Math.max(0, Math.ceil((dt.getTime() - Date.now()) / 60_000))

    return (
      <div className="flex items-center justify-center min-h-screen px-4" style={{ background: 'var(--background)' }}>
        <div
          className="w-full max-w-sm rounded-2xl p-6 space-y-6 text-center"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <span className="text-2xl">⏳</span>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              اتاق انتظار
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              جلسه با <span className="font-semibold" style={{ color: 'var(--primary)' }}>{session.booking.coach.name}</span> در{' '}
              {toPersian(minsUntil)} دقیقه دیگر شروع می‌شود
            </p>
          </div>

          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: 'var(--surface-elevated)' }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>بسته</span>
              <span style={{ color: 'var(--text-primary)' }}>{session.booking.package.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>مدت</span>
              <span style={{ color: 'var(--text-primary)' }}>{toPersian(session.booking.package.durationMinutes)} دقیقه</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>ساعت</span>
              <span style={{ color: 'var(--text-primary)' }}>{toPersian(session.booking.sessionTime)}</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}
          >
            بازگشت به داشبورد
          </button>
        </div>
      </div>
    )
  }

  // ── In Session (Jitsi) ────────────────────────────────────
  if (view === 'in_session' && session && session.booking.jitsiRoomId) {
    return (
      <JitsiRoom
        jitsiRoomId={session.booking.jitsiRoomId}
        userName={userName}
        sessionId={sessionId}
        durationMins={session.booking.package.durationMinutes}
        onEnd={() => setView('post_session')}
      />
    )
  }

  // ── Post Session ──────────────────────────────────────────
  if (view === 'post_session' && session) {
    const alreadyActed = session.status === 'completed' || session.status === 'disputed'

    return (
      <div className="flex items-center justify-center min-h-screen px-4" style={{ background: 'var(--background)' }}>
        <div
          className="w-full max-w-sm rounded-2xl p-6 space-y-6"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <span className="text-2xl">{session.status === 'disputed' ? '⚖️' : '✅'}</span>
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {session.status === 'disputed' ? 'جلسه در حال بررسی' : 'جلسه پایان یافت'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              با {session.booking.coach.name}
            </p>
          </div>

          {feedback ? (
            <div
              className="rounded-xl p-4 text-center text-sm"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
            >
              {feedback}
            </div>
          ) : alreadyActed ? (
            <div
              className="rounded-xl p-4 text-center text-sm"
              style={{ background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}
            >
              {session.status === 'disputed'
                ? 'شکایت شما در حال بررسی است. تیم Mindgo اطلاع‌رسانی خواهد کرد.'
                : 'جلسه قبلاً تأیید شده است.'}
            </div>
          ) : (
            <>
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                آیا جلسه به خوبی برگزار شد؟
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                  style={{ background: submitting ? '#374151' : '#10B981' }}
                >
                  {submitting ? 'در حال ثبت...' : '✅ تأیید جلسه و آزادسازی وجه'}
                </button>

                <button
                  onClick={handleDispute}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  ⚠️ ثبت شکایت
                </button>
              </div>

              <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
                در صورت عدم تأیید تا {toPersian('24')} ساعت، وجه به صورت خودکار آزاد می‌شود.
              </p>
            </>
          )}

          {(feedback || alreadyActed) && (
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              بازگشت به داشبورد
            </button>
          )}
        </div>
      </div>
    )
  }

  // fallback
  return null
}
