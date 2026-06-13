'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    phoneRef.current?.focus()
  }, [])

  useEffect(() => {
    if (step === 'otp') otpRefs.current[0]?.focus()
  }, [step])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleSendOtp() {
    setError('')
    const cleaned = phone.replace(/\D/g, '')
    if (!/^09[0-9]{9}$/.test(cleaned)) {
      setError('شماره موبایل را به فرمت ۰۹xxxxxxxxx وارد کنید')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.message ?? 'خطا در ارسال کد')
        return
      }
      setStep('otp')
      setCountdown(data.data.expires_in ?? 120)
    } catch {
      setError('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  // `codeArg` lets callers pass the code directly to avoid stale closure reads.
  // When called from handleOtpInput/Paste via setTimeout, React may not have
  // re-rendered yet, so reading `otp` state here would give the old value.
  async function handleVerifyOtp(codeArg?: string) {
    const code = codeArg ?? otp.join('')
    console.log('[verify] code:', code, '| phone:', phone.replace(/\D/g, ''))
    if (code.length !== 5) { console.log('[verify] skipped — code not 5 digits'); return }
    if (loading) { console.log('[verify] skipped — already loading'); return }
    setError('')
    setLoading(true)
    try {
      const body = { phone: phone.replace(/\D/g, ''), code }
      console.log('[verify] → POST /api/auth/otp/verify', body)
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      console.log('[verify] ← status:', res.status, 'data:', data)
      if (!res.ok) {
        setError(data.error?.message ?? 'کد اشتباه است')
        setOtp(['', '', '', '', ''])
        otpRefs.current[0]?.focus()
        return
      }
      console.log('[verify] success — saving token, redirecting')
      // Save to localStorage for client-side auth checks (rehjoo layout)
      localStorage.setItem('mg_token', data.data.token)
      // Cookie is already set by the verify API response (for middleware).
      // Use window.location.href (full navigation) so the browser sends
      // the fresh cookie on the next request and middleware can read it.
      const dest = data.data.user.role === 'rahbalad' ? '/coach-dashboard' : '/dashboard'
      window.location.href = dest
    } catch (err) {
      console.error('[verify] network error:', err)
      setError('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpInput(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 4) otpRefs.current[index + 1]?.focus()
    if (next.every((d) => d !== '')) {
      // Pass next.join('') explicitly — do NOT rely on otp state here (stale closure)
      setTimeout(() => handleVerifyOtp(next.join('')), 50)
    }
  }

  function handleOtpKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5)
    const next = ['', '', '', '', '']
    text.split('').forEach((d, i) => { next[i] = d })
    setOtp(next)
    if (text.length === 5) setTimeout(() => handleVerifyOtp(text), 50)
    else otpRefs.current[text.length]?.focus()
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--surface-primary)' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-sm rounded-xl p-8 shadow-lg"
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <span
            className="text-3xl font-bold"
            style={{ color: '#10B981', fontFamily: 'IRANSansX, system-ui' }}
          >
            🧠 Mindgo
          </span>
          <p className="mt-2 text-sm" style={{ color: 'var(--content-secondary)' }}>
            همراه شما در مسیر رشد
          </p>
        </div>

        {/* Step transition */}
        <div
          key={step}
          style={{
            animation: 'fadeSlideIn 0.25s ease',
          }}
        >
          {step === 'phone' ? (
            <>
              <h1
                className="text-lg font-semibold mb-1"
                style={{ color: 'var(--content-primary)' }}
              >
                ورود به حساب کاربری
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--content-secondary)' }}>
                شماره موبایل خود را وارد کنید
              </p>

              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--content-primary)' }}
              >
                شماره موبایل
              </label>
              <input
                ref={phoneRef}
                type="tel"
                inputMode="numeric"
                dir="ltr"
                placeholder="09xxxxxxxxx"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                maxLength={11}
                className="w-full rounded-md px-4 py-3 text-base outline-none transition-all"
                style={{
                  background: 'var(--surface-secondary)',
                  color: 'var(--content-primary)',
                  border: `1.5px solid ${error ? '#EF4444' : 'var(--border-color)'}`,
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}
              />

              {error && (
                <p className="mt-2 text-sm text-center" style={{ color: '#EF4444' }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full mt-5 py-3 rounded-md text-white font-semibold text-base transition-all active:scale-95"
                style={{
                  background: loading ? '#6EE7B7' : '#10B981',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'در حال ارسال...' : 'دریافت کد تأیید'}
              </button>
            </>
          ) : (
            <>
              <h1
                className="text-lg font-semibold mb-1"
                style={{ color: 'var(--content-primary)' }}
              >
                کد تأیید را وارد کنید
              </h1>
              <p className="text-sm mb-1" style={{ color: 'var(--content-secondary)' }}>
                کد ۵ رقمی ارسال‌شده به{' '}
                <span dir="ltr" style={{ fontFamily: 'monospace' }}>
                  {phone}
                </span>
              </p>

              {/* OTP boxes */}
              <div
                className="flex gap-3 justify-center my-6"
                dir="ltr"
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-md outline-none transition-all"
                    style={{
                      background: 'var(--surface-secondary)',
                      color: 'var(--content-primary)',
                      border: `2px solid ${
                        digit
                          ? '#10B981'
                          : error
                          ? '#EF4444'
                          : 'var(--border-color)'
                      }`,
                      fontFamily: 'monospace',
                    }}
                  />
                ))}
              </div>

              {error && (
                <p className="text-sm text-center mb-3" style={{ color: '#EF4444' }}>
                  {error}
                </p>
              )}

              <button
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.some((d) => !d)}
                className="w-full py-3 rounded-md text-white font-semibold text-base transition-all active:scale-95"
                style={{
                  background:
                    loading || otp.some((d) => !d) ? '#6EE7B7' : '#10B981',
                  cursor:
                    loading || otp.some((d) => !d) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'در حال تأیید...' : 'ورود'}
              </button>

              {/* Resend */}
              <div className="mt-4 text-center text-sm" style={{ color: 'var(--content-secondary)' }}>
                {countdown > 0 ? (
                  <span>
                    ارسال مجدد تا{' '}
                    <span dir="ltr" style={{ fontFamily: 'monospace' }}>
                      {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                      {String(countdown % 60).padStart(2, '0')}
                    </span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setOtp(['', '', '', '', ''])
                      setError('')
                      setStep('phone')
                    }}
                    style={{ color: '#10B981', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ارسال مجدد کد
                  </button>
                )}
              </div>

              <button
                onClick={() => { setStep('phone'); setError(''); setOtp(['', '', '', '', '']) }}
                className="w-full mt-2 text-sm text-center"
                style={{ color: 'var(--content-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ویرایش شماره موبایل
              </button>
            </>
          )}
        </div>
      </div>

      {/* Animation keyframes injected inline */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
