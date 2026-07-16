'use client'

import { useEffect, useState } from 'react'
import FileUpload from '@/components/ui/FileUpload'
import AudioRecorder from '@/components/ui/AudioRecorder'
import { formatCardNumber, isValidCardNumber } from '@/lib/payments'

// ── Types ─────────────────────────────────────────────────

interface Specialization {
  id:   string
  name: string
  slug: string
}

interface Certificate {
  title:   string
  issuer:  string
  year:    string
  fileUrl: string | null
}

// ── Constants ─────────────────────────────────────────────

const TOTAL_STEPS = 6

const GENDER_ACCEPT_OPTIONS = [
  { value: 'all',         label: 'همه',     icon: '👥' },
  { value: 'female_only', label: 'زنان',    icon: '👩' },
  { value: 'male_only',   label: 'مردان',   icon: '👨' },
]

// ── Progress Bar ──────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100)
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--content-secondary)' }}>
          مرحله {step} از {TOTAL_STEPS}
        </span>
        <span className="text-xs" style={{ color: '#10B981' }}>{pct}٪</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-secondary)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#10B981' }}
        />
      </div>
    </div>
  )
}

// ── Step Shell ────────────────────────────────────────────

function StepShell({
  title, subtitle, children, onNext, onBack, nextLabel = 'مرحله بعد', nextDisabled = false, loading = false,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  onNext: () => void
  onBack?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  loading?: boolean
}) {
  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>{title}</h2>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--content-secondary)' }}>{subtitle}</p>}
      </div>

      <div className="flex-1">{children}</div>

      <div className="flex gap-3 mt-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)' }}
          >
            بازگشت
          </button>
        )}
        <button
          onClick={onNext}
          disabled={nextDisabled || loading}
          className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
          style={{ background: nextDisabled || loading ? 'var(--surface-secondary)' : '#10B981' }}
        >
          {loading ? 'در حال ارسال...' : nextLabel}
        </button>
      </div>
    </div>
  )
}

// ── Input style helper ────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-secondary)',
  border:     '1px solid var(--border-color)',
  color:      'var(--content-primary)',
}

// ── Page ──────────────────────────────────────────────────

export default function CoachRegisterPage() {
  const [step, setStep] = useState(1)

  // Step 1: Basic info
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')

  // Step 2: Bio + specializations
  const [shortBio,       setShortBio]       = useState('')
  const [fullBio,        setFullBio]        = useState('')
  const [specializations, setSpecializations] = useState<Specialization[]>([])
  const [selectedSpecs,   setSelectedSpecs]   = useState<string[]>([])
  const [specsLoaded,     setSpecsLoaded]     = useState(false)

  // Step 3: Gender accept
  const [genderAccept, setGenderAccept] = useState<'all' | 'female_only' | 'male_only'>('all')

  // Step 4: Certificates
  const [certs, setCerts] = useState<Certificate[]>([])
  const [certForm, setCertForm] = useState<Certificate>({ title: '', issuer: '', year: '', fileUrl: null })

  // Step 5: Voice intro
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null)

  // Step 6: Submit
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Load user info + specializations
  useEffect(() => {
    const raw = localStorage.getItem('mg_token')
    if (!raw) return
    try {
      const parts = raw.split('.')
      const decoded = JSON.parse(atob(parts[1]))
      setPhone(decoded.phone ?? '')
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (step === 2 && !specsLoaded) {
      fetch('/api/marketplace/specializations')
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setSpecializations(json.data ?? json.specializations ?? [])
          setSpecsLoaded(true)
        })
        .catch(() => setSpecsLoaded(true))
    }
  }, [step, specsLoaded])

  function toggleSpec(id: string) {
    setSelectedSpecs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function addCert() {
    if (!certForm.title || !certForm.issuer || !certForm.year) return
    setCerts((prev) => [...prev, { ...certForm }])
    setCertForm({ title: '', issuer: '', year: '', fileUrl: null })
  }

  function removeCert(i: number) {
    setCerts((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const token = localStorage.getItem('mg_token')
      const res = await fetch('/api/coaches/register', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          short_bio:       shortBio,
          full_bio:        fullBio,
          gender_accept:   genderAccept,
          card_number:     cardNumber.replace(/\D/g, ''),
          card_holder_name: cardHolder,
          specialization_ids: selectedSpecs,
          certificates: certs.map((c) => ({
            title:     c.title,
            issuer:    c.issuer,
            year:      parseInt(c.year, 10),
            imageUrl:  c.fileUrl,
          })),
          voice_intro_url: voiceUrl,
        }),
      })

      const json = await res.json()
      if (!json.success) {
        setSubmitError(json.error?.message ?? 'خطایی رخ داد')
        return
      }

      // Save new token with rahbalad role
      if (json.token) localStorage.setItem('mg_token', json.token)

      // Redirect to coach panel (hard redirect to re-initialize layout)
      window.location.href = '/coach-dashboard'
    } catch {
      setSubmitError('خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--surface-primary)', direction: 'rtl' }}
    >
      <div className="max-w-lg mx-auto px-4 pt-10 pb-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl">🧠</span>
          <p className="text-sm font-semibold mt-2" style={{ color: '#10B981' }}>ثبت‌نام کوچ</p>
        </div>

        <ProgressBar step={step} />

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <StepShell
            title="اطلاعات پایه"
            subtitle="نام شما در پروفایل عمومی نمایش داده می‌شود"
            onNext={() => {
              if (!name.trim()) return
              const digits = cardNumber.replace(/\D/g, '')
              if (digits !== '' && !isValidCardNumber(digits)) return
              setStep(2)
            }}
            nextDisabled={!name.trim() || (cardNumber.replace(/\D/g, '') !== '' && !isValidCardNumber(cardNumber.replace(/\D/g, '')))}
          >
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--content-secondary)' }}>نام و نام خانوادگی</label>
                <input
                  type="text"
                  placeholder="مثال: دکتر علی محمدی"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--content-secondary)' }}>شماره موبایل</label>
                <input
                  type="text"
                  value={phone}
                  readOnly
                  className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
                  style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed', direction: 'ltr', textAlign: 'right' }}
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--content-tertiary)' }}>شماره موبایل از حساب شما دریافت شده و قابل ویرایش نیست</p>
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--content-secondary)' }}>
                  💳 شماره کارت بانکی <span style={{ color: 'var(--content-tertiary)' }}>(برای دریافت پرداخت کارت‌به‌کارت)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={19}
                  placeholder="---- ---- ---- ----"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="w-full rounded-xl px-4 py-3.5 text-base outline-none tracking-wider"
                  style={{ ...inputStyle, direction: 'ltr', textAlign: 'center', fontFamily: 'monospace' }}
                />
                <input
                  type="text"
                  placeholder="نام صاحب کارت"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full rounded-xl px-4 py-3.5 text-sm outline-none mt-2"
                  style={inputStyle}
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--content-tertiary)' }}>می‌توانید بعداً هم از پروفایل اضافه کنید</p>
              </div>
            </div>
          </StepShell>
        )}

        {/* Step 2: Bio + Specializations */}
        {step === 2 && (
          <StepShell
            title="معرفی و تخصص"
            subtitle="خودتان را به رهجوها معرفی کنید"
            onNext={() => { if (shortBio.trim() && selectedSpecs.length > 0) setStep(3) }}
            onBack={() => setStep(1)}
            nextDisabled={!shortBio.trim() || selectedSpecs.length === 0}
          >
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--content-secondary)' }}>
                  معرفی کوتاه <span style={{ color: 'var(--content-tertiary)' }}>(۲ خط — نمایش در کارت)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={200}
                  placeholder="مثال: روان‌پزشک با ۱۰ سال تجربه در حوزه اضطراب و افسردگی"
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  style={inputStyle}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--content-tertiary)' }}>{shortBio.length}/200 کاراکتر</p>
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--content-secondary)' }}>بیوگرافی کامل</label>
                <textarea
                  rows={5}
                  maxLength={2000}
                  placeholder="تجربیات، رویکرد درمانی، مدارک تحصیلی و توضیحات بیشتر..."
                  value={fullBio}
                  onChange={(e) => setFullBio(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  style={inputStyle}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--content-tertiary)' }}>{fullBio.length}/2000 کاراکتر</p>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--content-secondary)' }}>
                  حوزه تخصص <span style={{ color: 'var(--content-tertiary)' }}>(حداقل ۱)</span>
                </label>
                {!specsLoaded ? (
                  <div className="flex gap-2 flex-wrap">
                    {[80, 100, 70, 90, 110].map((w, i) => (
                      <div key={i} className="h-8 rounded-full animate-pulse" style={{ width: w, background: 'var(--surface-secondary)' }} />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {specializations.map((s) => {
                      const sel = selectedSpecs.includes(s.id)
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSpec(s.id)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                          style={{
                            background: sel ? 'rgba(16,185,129,0.15)' : 'var(--surface-secondary)',
                            border:     `1px solid ${sel ? 'rgba(16,185,129,0.5)' : 'var(--border-color)'}`,
                            color:      sel ? '#10B981' : 'var(--content-secondary)',
                          }}
                        >
                          {sel && '✓ '}{s.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </StepShell>
        )}

        {/* Step 3: Gender Accept */}
        {step === 3 && (
          <StepShell
            title="ترجیح جنسیتی"
            subtitle="چه گروهی از رهجوها می‌پذیرید؟"
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          >
            <div className="flex flex-col gap-3">
              {GENDER_ACCEPT_OPTIONS.map((opt) => {
                const sel = genderAccept === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setGenderAccept(opt.value as typeof genderAccept)}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl text-right transition-all"
                    style={{
                      background: sel ? 'rgba(16,185,129,0.08)' : 'var(--surface-card)',
                      border:     `1px solid ${sel ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}`,
                    }}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-semibold flex-1" style={{ color: sel ? '#10B981' : 'var(--content-primary)' }}>
                      {opt.label}
                    </span>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        border:     `2px solid ${sel ? '#10B981' : 'var(--border-color)'}`,
                        background: sel ? '#10B981' : 'transparent',
                      }}
                    >
                      {sel && <span className="text-white text-xs">✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </StepShell>
        )}

        {/* Step 4: Certificates */}
        {step === 4 && (
          <StepShell
            title="مدارک و گواهی‌نامه‌ها"
            subtitle="مدارک تحصیلی و گواهی‌نامه‌های خود را وارد کنید"
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          >
            <div className="flex flex-col gap-4">
              {/* Existing certs */}
              {certs.length > 0 && (
                <div className="flex flex-col gap-2 mb-2">
                  {certs.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#10B981' }}>{c.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>{c.issuer} · {c.year}</p>
                      </div>
                      <button onClick={() => removeCert(i)} className="text-lg ml-2" style={{ color: '#EF4444' }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add cert form */}
              <div
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <p className="text-xs font-semibold" style={{ color: 'var(--content-secondary)' }}>افزودن مدرک</p>
                <input
                  type="text"
                  placeholder="عنوان (مثال: دکترای روان‌پزشکی)"
                  value={certForm.title}
                  onChange={(e) => setCertForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="صادرکننده (مثال: دانشگاه تهران)"
                  value={certForm.issuer}
                  onChange={(e) => setCertForm((f) => ({ ...f, issuer: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="سال صدور (مثال: 1399)"
                  value={certForm.year}
                  onChange={(e) => setCertForm((f) => ({ ...f, year: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                />
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--content-tertiary)' }}>تصویر مدرک (اختیاری)</p>
                  <FileUpload
                    folder="certificates"
                    maxSize={5 * 1024 * 1024}
                    acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    onUploadComplete={(url) => setCertForm((f) => ({ ...f, fileUrl: url || null }))}
                    label="آپلود تصویر مدرک"
                  />
                </div>
                <button
                  onClick={addCert}
                  disabled={!certForm.title || !certForm.issuer || !certForm.year}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: certForm.title && certForm.issuer && certForm.year ? '#10B981' : 'var(--surface-secondary)' }}
                >
                  + افزودن مدرک
                </button>
              </div>

              <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                وارد کردن مدرک اجباری نیست اما اعتماد رهجوها را افزایش می‌دهد.
              </p>
            </div>
          </StepShell>
        )}

        {/* Step 5: Voice Intro */}
        {step === 5 && (
          <StepShell
            title="معرفی صوتی"
            subtitle="یک معرفی کوتاه صوتی (حداکثر ۲ دقیقه) از خودتان ضبط یا آپلود کنید"
            onNext={() => setStep(6)}
            onBack={() => setStep(4)}
          >
            <div className="flex flex-col gap-5">

              {/* Tab: Record */}
              <div
                className="rounded-xl p-5"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <p className="text-sm font-semibold mb-4" style={{ color: 'var(--content-primary)' }}>🎙️ ضبط مستقیم</p>
                <AudioRecorder
                  folder="voice-intros"
                  maxSeconds={120}
                  onUploadComplete={(url) => setVoiceUrl(url || null)}
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>یا</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
              </div>

              {/* Tab: Upload file */}
              <div
                className="rounded-xl p-5"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <p className="text-sm font-semibold mb-4" style={{ color: 'var(--content-primary)' }}>📂 آپلود فایل صوتی</p>
                <FileUpload
                  folder="voice-intros"
                  maxSize={10 * 1024 * 1024}
                  acceptedTypes={['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a']}
                  onUploadComplete={(url) => setVoiceUrl(url || null)}
                  label="انتخاب فایل MP3 / M4A / WAV"
                  currentUrl={voiceUrl ?? undefined}
                />
              </div>

              <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                معرفی صوتی اختیاری است. می‌توانید این مرحله را رد کنید.
              </p>
            </div>
          </StepShell>
        )}

        {/* Step 6: Review & Submit */}
        {step === 6 && (
          <StepShell
            title="بررسی نهایی"
            subtitle="اطلاعات را بررسی کنید و ثبت‌نام را تکمیل کنید"
            onNext={handleSubmit}
            onBack={() => setStep(5)}
            nextLabel="ارسال برای تأیید"
            loading={submitting}
          >
            <div className="flex flex-col gap-4">
              {/* Summary rows */}
              {[
                { label: 'نام',         value: name },
                { label: 'شماره',       value: phone },
                { label: 'معرفی',       value: shortBio },
                { label: 'پذیرش',       value: GENDER_ACCEPT_OPTIONS.find((o) => o.value === genderAccept)?.label ?? genderAccept },
                { label: 'تخصص‌ها',    value: specializations.filter((s) => selectedSpecs.includes(s.id)).map((s) => s.name).join('، ') || '—' },
                { label: 'مدارک',       value: certs.length > 0 ? `${certs.length} مدرک` : 'بدون مدرک' },
                { label: 'معرفی صوتی', value: voiceUrl ? 'بارگذاری شده' : 'ندارد' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
                >
                  <span className="text-xs w-20 flex-shrink-0 font-medium" style={{ color: 'var(--content-tertiary)' }}>{label}</span>
                  <span className="text-xs flex-1" style={{ color: 'var(--content-primary)' }}>{value || '—'}</span>
                </div>
              ))}

              {submitError && (
                <p
                  className="text-sm text-center py-2.5 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                >
                  {submitError}
                </p>
              )}

              <div
                className="rounded-xl px-4 py-3 text-xs"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}
              >
                ⚠️ پس از ارسال، پروفایل شما توسط تیم Mindgo بررسی می‌شود. معمولاً تا ۴۸ ساعت آینده نتیجه اطلاع‌رسانی می‌شود.
              </div>
            </div>
          </StepShell>
        )}

      </div>
    </div>
  )
}
