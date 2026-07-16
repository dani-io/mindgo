'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CoachProfile {
  name:           string
  shortBio:       string | null
  fullBio:        string | null
  genderAccept:   'all' | 'female_only' | 'male_only'
  specializations: { id: string; name: string; icon: string | null }[]
}

const GENDER_OPTIONS = [
  { value: 'all',         label: 'همه' },
  { value: 'female_only', label: 'فقط زنان' },
  { value: 'male_only',   label: 'فقط مردان' },
]

export default function CoachProfilePage() {
  const router = useRouter()

  const [profile,   setProfile]   = useState<CoachProfile | null>(null)
  const [name,      setName]      = useState('')
  const [shortBio,  setShortBio]  = useState('')
  const [fullBio,   setFullBio]   = useState('')
  const [gender,    setGender]    = useState<'all' | 'female_only' | 'male_only'>('all')
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('mg_token') ?? ''
    fetch('/api/coaches/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const d = json.data as CoachProfile
          setProfile(d)
          setName(d.name ?? '')
          setShortBio(d.shortBio ?? '')
          setFullBio(d.fullBio ?? '')
          setGender(d.genderAccept ?? 'all')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    const token = localStorage.getItem('mg_token') ?? ''
    const res = await fetch('/api/coaches/me', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, short_bio: shortBio, full_bio: fullBio, gender_accept: gender }),
    })
    const json = await res.json()
    setSaving(false)
    if (json.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError(json.error?.message ?? 'خطا در ذخیره‌سازی')
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        {[80, 120, 160, 120].map((h, i) => (
          <div key={i} className="rounded-xl animate-pulse" style={{ height: h, background: 'var(--surface-card)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-8 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          ›
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>ویرایش پروفایل</h1>
          <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>اطلاعاتی که رهجوها می‌بینند</p>
        </div>
      </div>

      {/* Availability quick link */}
      <button
        onClick={() => router.push('/coach-availability')}
        className="w-full rounded-xl p-4 flex items-center gap-3 text-right transition-all active:scale-[0.99]"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.12)' }}
        >
          🕐
        </div>
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
            زمان‌بندی پذیرش
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
            روزها و ساعت‌های قابل رزرو را تنظیم کنید
          </p>
        </div>
        <span style={{ color: '#6366F1' }}>›</span>
      </button>

      {/* Name */}
      <section
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>نام نمایشی</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="نام و نام‌خانوادگی"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: 'var(--surface-secondary)',
            border:     '1px solid var(--border-color)',
            color:      'var(--content-primary)',
          }}
        />
      </section>

      {/* Bios */}
      <section
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>معرفی کوتاه</h2>
        <input
          value={shortBio}
          onChange={(e) => setShortBio(e.target.value)}
          placeholder="یک جمله درباره خودتان..."
          maxLength={160}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: 'var(--surface-secondary)',
            border:     '1px solid var(--border-color)',
            color:      'var(--content-primary)',
          }}
        />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>بیوگرافی کامل</h2>
        <textarea
          value={fullBio}
          onChange={(e) => setFullBio(e.target.value)}
          placeholder="تجربه، رویکرد و ارزش‌های کوچینگ شما..."
          rows={5}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
          style={{
            background: 'var(--surface-secondary)',
            border:     '1px solid var(--border-color)',
            color:      'var(--content-primary)',
          }}
        />
      </section>

      {/* Gender accept */}
      <section
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>پذیرش جنسیت</h2>
        <div className="flex gap-2">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGender(opt.value as typeof gender)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: gender === opt.value ? '#10B981' : 'var(--surface-secondary)',
                color:      gender === opt.value ? 'white' : 'var(--content-tertiary)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Bank info moved to wallet */}
      <button
        onClick={() => router.push('/coach-wallet')}
        className="w-full rounded-xl p-4 flex items-center gap-3 text-right transition-all active:scale-[0.99]"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.12)' }}
        >
          💳
        </div>
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>اطلاعات بانکی</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
            شماره کارت و شبا را در کیف پول مدیریت کنید
          </p>
        </div>
        <span style={{ color: '#10B981' }}>کیف پول ›</span>
      </button>

      {/* Specializations (read-only display) */}
      {profile?.specializations && profile.specializations.length > 0 && (
        <section
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>تخصص‌ها</h2>
          <div className="flex flex-wrap gap-2">
            {profile.specializations.map((s) => (
              <span
                key={s.id}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
              >
                {s.icon} {s.name}
              </span>
            ))}
          </div>
          <p className="text-[11px]" style={{ color: 'var(--content-tertiary)' }}>
            برای تغییر تخصص‌ها با پشتیبانی تماس بگیرید
          </p>
        </section>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full py-4 rounded-2xl text-base font-bold transition-all"
        style={{
          background: saved ? 'rgba(16,185,129,0.15)' : '#10B981',
          color:      saved ? '#10B981' : 'white',
          opacity:    saving ? 0.7 : 1,
        }}
      >
        {saving ? 'در حال ذخیره...' : saved ? '✅ ذخیره شد' : 'ذخیره تغییرات'}
      </button>

    </div>
  )
}
