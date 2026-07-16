'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageCropper from '@/components/ui/ImageCropper'

// ── Option sets ──────────────────────────────────────────────
const FOCUS_AREAS: { key: string; label: string; icon: string }[] = [
  { key: 'career',        label: 'شغلی',  icon: '💼' },
  { key: 'relationships', label: 'روابط', icon: '❤️' },
  { key: 'health',        label: 'سلامت', icon: '🌿' },
  { key: 'financial',     label: 'مالی',  icon: '💰' },
  { key: 'mental',        label: 'ذهنی',  icon: '🧠' },
  { key: 'spiritual',     label: 'معنوی', icon: '🕊️' },
]

const EXPERIENCE: { key: string; label: string }[] = [
  { key: 'none',         label: 'هیچ تجربه‌ای ندارم' },
  { key: 'some',         label: 'کمی آشنا هستم' },
  { key: 'experienced',  label: 'بله، تجربه دارم' },
]

const GENDER_PREF: { key: string; label: string }[] = [
  { key: 'any',    label: 'فرقی نداره' },
  { key: 'female', label: 'ترجیحاً خانم' },
  { key: 'male',   label: 'ترجیحاً آقا' },
]

const MARITAL: { key: string; label: string }[] = [
  { key: 'single',  label: 'مجرد' },
  { key: 'married', label: 'متأهل' },
]

const GREEN  = '#10B981'
const PURPLE = '#8B5CF6'
const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [ready, setReady] = useState(false)

  // Answers
  const [name, setName]                           = useState('')
  const [avatarUrl, setAvatarUrl]                 = useState('')
  const [focusAreas, setFocusAreas]               = useState<string[]>([])
  const [goal, setGoal]                           = useState('')
  const [coachingExperience, setCoachingExperience] = useState('')
  const [coachGenderPref, setCoachGenderPref]     = useState('any')
  const [maritalStatus, setMaritalStatus]         = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  // Guard: need a token; skip if already onboarded. Prefill existing name/avatar.
  useEffect(() => {
    const token = localStorage.getItem('mg_token')
    if (!token) { router.replace('/login'); return }

    fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          if (json.data.onboardingCompleted) { router.replace('/dashboard'); return }
          if (json.data.name) setName(json.data.name)
          if (json.data.avatarUrl) setAvatarUrl(json.data.avatarUrl)
        }
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [router])

  function toggleFocus(key: string) {
    setFocusAreas((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }

  function next() { setError(''); setStep((s) => Math.min(s + 1, TOTAL_STEPS)) }
  function back() { setError(''); setStep((s) => Math.max(s - 1, 1)) }

  function goStep1Next() {
    if (!name.trim()) { setError('لطفاً نامت را وارد کن'); return }
    next()
  }

  async function finish(destination: string) {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('mg_token')
      const res = await fetch('/api/users/me/onboarding', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name: name.trim(),
          avatarUrl: avatarUrl || undefined,
          focusAreas,
          goal: goal.trim(),
          coachingExperience: coachingExperience || undefined,
          coachGenderPref,
          maritalStatus: maritalStatus || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error?.message ?? 'خطا در ثبت اطلاعات'); setSaving(false); return }

      // Refresh token so middleware no longer routes back to onboarding.
      if (json.data?.token) localStorage.setItem('mg_token', json.data.token)
      window.location.href = destination
    } catch {
      setError('خطا در اتصال به سرور')
      setSaving(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
        <span style={{ color: 'var(--content-tertiary)', fontSize: 14 }}>در حال بارگذاری...</span>
      </div>
    )
  }

  const selectedAreaLabels = FOCUS_AREAS.filter((a) => focusAreas.includes(a.key)).map((a) => a.label)

  return (
    <div
      className="min-h-screen flex flex-col px-5 pt-6 pb-10"
      style={{ background: 'var(--surface-primary)', direction: 'rtl', maxWidth: 480, margin: '0 auto' }}
    >
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: GREEN }}>
            مرحله {toPersian(step)} از {toPersian(TOTAL_STEPS)}
          </span>
          <span className="font-bold text-sm" style={{ color: GREEN }}>🧠 Mindgo</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: GREEN }}
          />
        </div>
      </div>

      {/* Step body (animated) */}
      <div key={step} className="flex-1" style={{ animation: 'obFade 0.28s ease' }}>

        {/* ── Step 1: Basic info ─────────────────────────── */}
        {step === 1 && (
          <div>
            <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--content-primary)' }}>اطلاعات پایه</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--content-secondary)' }}>
              بیا با هم آشنا بشیم 👋
            </p>

            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--content-primary)' }}>
              نام شما
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="نام و نام خانوادگی"
              className="w-full rounded-xl px-4 py-3 text-base outline-none mb-6"
              style={{
                background: 'var(--surface-secondary)',
                color: 'var(--content-primary)',
                border: `1.5px solid ${error ? '#EF4444' : 'var(--border-color)'}`,
              }}
            />

            <p className="text-sm font-medium mb-3" style={{ color: 'var(--content-primary)' }}>
              عکس پروفایل <span style={{ color: 'var(--content-tertiary)' }}>(اختیاری)</span>
            </p>
            <div className="flex justify-center mb-2">
              <ImageCropper onUploadComplete={(url) => setAvatarUrl(url)} folder="avatars" size={160} />
            </div>
          </div>
        )}

        {/* ── Step 2: Three golden questions ─────────────── */}
        {step === 2 && (
          <div>
            <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--content-primary)' }}>سه سوال طلایی</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--content-secondary)' }}>
              کمکمون کن بهتر بشناسیمت ✨
            </p>

            {/* Q1 */}
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-primary)' }}>
              کدوم حوزه زندگیت رو می‌خوای بهتر کنی؟
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {FOCUS_AREAS.map((a) => {
                const sel = focusAreas.includes(a.key)
                return (
                  <button
                    key={a.key}
                    onClick={() => toggleFocus(a.key)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
                    style={{
                      background: sel ? PURPLE : 'var(--surface-card)',
                      color:      sel ? 'white' : 'var(--content-secondary)',
                      border:     `1.5px solid ${sel ? PURPLE : 'var(--border-color)'}`,
                    }}
                  >
                    {a.icon} {a.label}
                  </button>
                )
              })}
            </div>

            {/* Q2 */}
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-primary)' }}>
              هدف اصلیت از کوچینگ چیه؟
            </p>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="مثلاً: می‌خوام اعتماد به نفسم رو بالا ببرم"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-6 resize-none"
              style={{
                background: 'var(--surface-secondary)',
                color: 'var(--content-primary)',
                border: '1.5px solid var(--border-color)',
              }}
            />

            {/* Q3 */}
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-primary)' }}>
              قبلاً تجربه کوچینگ داشتی؟
            </p>
            <div className="flex flex-col gap-2">
              {EXPERIENCE.map((e) => {
                const sel = coachingExperience === e.key
                return (
                  <button
                    key={e.key}
                    onClick={() => setCoachingExperience(e.key)}
                    className="w-full py-3 rounded-xl text-sm font-medium text-right px-4 transition-all"
                    style={{
                      background: sel ? 'rgba(16,185,129,0.1)' : 'var(--surface-card)',
                      color:      sel ? GREEN : 'var(--content-secondary)',
                      border:     `1.5px solid ${sel ? GREEN : 'var(--border-color)'}`,
                    }}
                  >
                    {e.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Preferences ────────────────────────── */}
        {step === 3 && (
          <div>
            <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--content-primary)' }}>ترجیحات</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--content-secondary)' }}>
              تا بهترین تجربه رو برات بسازیم 🎯
            </p>

            {/* Coach gender preference */}
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-primary)' }}>
              ترجیح جنسیت کوچ
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {GENDER_PREF.map((g) => {
                const sel = coachGenderPref === g.key
                return (
                  <button
                    key={g.key}
                    onClick={() => setCoachGenderPref(g.key)}
                    className="w-full py-3 rounded-xl text-sm font-medium text-right px-4 flex items-center gap-3 transition-all"
                    style={{
                      background: sel ? 'rgba(16,185,129,0.1)' : 'var(--surface-card)',
                      color:      sel ? GREEN : 'var(--content-secondary)',
                      border:     `1.5px solid ${sel ? GREEN : 'var(--border-color)'}`,
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ border: `2px solid ${sel ? GREEN : 'var(--content-tertiary)'}` }}
                    >
                      {sel && <span className="w-2 h-2 rounded-full" style={{ background: GREEN }} />}
                    </span>
                    {g.label}
                  </button>
                )
              })}
            </div>

            {/* Marital status */}
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-primary)' }}>
              وضعیت تأهل <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>(برای شخصی‌سازی چرخ زندگی)</span>
            </p>
            <div className="flex gap-2">
              {MARITAL.map((m) => {
                const sel = maritalStatus === m.key
                return (
                  <button
                    key={m.key}
                    onClick={() => setMaritalStatus(m.key)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: sel ? 'rgba(16,185,129,0.1)' : 'var(--surface-card)',
                      color:      sel ? GREEN : 'var(--content-secondary)',
                      border:     `1.5px solid ${sel ? GREEN : 'var(--border-color)'}`,
                    }}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step 4: Welcome ────────────────────────────── */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center pt-4">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--content-primary)' }}>
              🧠 خوش اومدی به Mindgo!
            </h1>
            <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: 'var(--content-secondary)' }}>
              {selectedAreaLabels.length > 0
                ? `بر اساس علاقه‌مندی‌هات، کوچ‌های متخصص در ${selectedAreaLabels.join('، ')} رو بهت پیشنهاد می‌دیم`
                : 'آماده‌ایم تا بهترین کوچ‌ها رو بهت معرفی کنیم'}
            </p>

            {error && <p className="text-sm mb-3" style={{ color: '#EF4444' }}>{error}</p>}

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => finish('/coaches')}
                disabled={saving}
                className="w-full py-3.5 rounded-xl text-base font-bold text-white transition-all active:scale-[0.98]"
                style={{ background: saving ? '#6EE7B7' : GREEN }}
              >
                {saving ? 'در حال ثبت...' : 'بریم کوچم رو پیدا کنم! 🧭'}
              </button>
              <button
                onClick={() => finish('/growth-room')}
                disabled={saving}
                className="w-full py-3.5 rounded-xl text-base font-bold transition-all active:scale-[0.98]"
                style={{ background: 'transparent', color: GREEN, border: `1.5px solid ${GREEN}` }}
              >
                اول یه سر به اتاق رشد بزنم 🌱
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer nav (steps 1-3) */}
      {step < TOTAL_STEPS && (
        <div className="mt-6">
          {error && step === 1 && (
            <p className="text-sm text-center mb-3" style={{ color: '#EF4444' }}>{error}</p>
          )}
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={back}
                className="py-3 px-5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
              >
                بازگشت
              </button>
            )}
            <button
              onClick={step === 1 ? goStep1Next : next}
              className="flex-1 py-3 rounded-xl text-base font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: GREEN }}
            >
              بعدی
            </button>
          </div>

          {/* Skip options */}
          {step === 1 && (
            <p className="text-center mt-3 text-xs" style={{ color: 'var(--content-tertiary)' }}>
              عکس پروفایل اختیاری است — می‌تونی بعداً اضافه کنی
            </p>
          )}
          {step === 3 && (
            <button
              onClick={next}
              className="w-full mt-3 text-center text-sm"
              style={{ color: 'var(--content-tertiary)', background: 'none', border: 'none' }}
            >
              رد کردن این مرحله
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes obFade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Convert ASCII digits to Persian numerals.
function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}
