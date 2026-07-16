'use client'

import { useEffect, useState } from 'react'

interface Config {
  commissionRate:           number
  minPayoutAmount:          number
  payoutDay:                string
  autoConfirmHours:         number
  maxAdvanceBookingDays:    number
  otpExpiryMinutes:         number
  maxOtpAttempts:           number
  otpCodeLength:            number
  maxActiveChallenges:      number
  allowAnonymousPosts:      boolean
  allowAnonymousChallenges: boolean
  platformName:             string
  platformDescription:      string
  contactEmail:             string
  contactPhone:             string
}

const PAYOUT_DAYS = [
  { value: 'saturday',  label: 'شنبه'     },
  { value: 'sunday',    label: 'یکشنبه'   },
  { value: 'monday',    label: 'دوشنبه'   },
  { value: 'tuesday',   label: 'سه‌شنبه'  },
  { value: 'wednesday', label: 'چهارشنبه' },
  { value: 'thursday',  label: 'پنج‌شنبه' },
]

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('mg_token') : null }

export default function AdminSettingsPage() {
  const [config,  setConfig]  = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => { if (j.success) setConfig(j.data) })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    if (!config) return
    setSaving(true)
    const token = getToken()
    try {
      const res  = await fetch('/api/admin/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(config),
      })
      const json = await res.json()
      if (json.success) { setConfig(json.data); showToast('✅ تنظیمات ذخیره شد') }
      else showToast('❌ خطا در ذخیره')
    } finally { setSaving(false) }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function set<K extends keyof Config>(key: K, value: Config[K]) {
    setConfig((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-secondary)',
    border:     '1px solid var(--border-color)',
    color:      'var(--content-primary)',
    borderRadius: 10, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--content-secondary)', display: 'block', marginBottom: 6 }

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3,4].map((i) => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--surface-card)' }} />)}
    </div>
  )
  if (!config) return <p style={{ color: 'var(--content-tertiary)' }}>خطا در بارگذاری</p>

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--content-primary)' }}>{title}</h2>
        <div className="space-y-4">{children}</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>تنظیمات پلتفرم</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--content-tertiary)' }}>فقط مدیر ارشد می‌تواند این تنظیمات را تغییر دهد</p>
      </div>

      {/* Financial */}
      <Section title="تنظیمات مالی 💰">
        <div>
          <label style={labelStyle}>درصد کمیسیون پلتفرم: {config.commissionRate}٪</label>
          <input
            type="range" min={10} max={40} step={1}
            value={100 - config.commissionRate}
            onChange={(e) => set('commissionRate', 100 - parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#10B981' }}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--content-tertiary)' }}>
            <span>سهم کوچ: {100 - config.commissionRate}٪</span>
            <span>سهم پلتفرم: {config.commissionRate}٪</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>حداقل مبلغ تسویه (تومان)</label>
            <input
              type="number" value={config.minPayoutAmount} style={inputStyle}
              onChange={(e) => set('minPayoutAmount', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label style={labelStyle}>روز واریز تسویه</label>
            <select value={config.payoutDay} onChange={(e) => set('payoutDay', e.target.value)} style={inputStyle}>
              {PAYOUT_DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>
      </Section>

      {/* Sessions */}
      <Section title="تنظیمات جلسات 📅">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>ساعت تأیید خودکار</label>
            <input
              type="number" min={1} max={72} value={config.autoConfirmHours} style={inputStyle}
              onChange={(e) => set('autoConfirmHours', parseInt(e.target.value) || 24)}
            />
          </div>
          <div>
            <label style={labelStyle}>حداکثر روزهای رزرو پیشرفته</label>
            <input
              type="number" min={1} max={90} value={config.maxAdvanceBookingDays} style={inputStyle}
              onChange={(e) => set('maxAdvanceBookingDays', parseInt(e.target.value) || 30)}
            />
          </div>
        </div>
      </Section>

      {/* OTP */}
      <Section title="تنظیمات OTP 🔐">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label style={labelStyle}>انقضا (دقیقه)</label>
            <input
              type="number" min={1} max={10} value={config.otpExpiryMinutes} style={inputStyle}
              onChange={(e) => set('otpExpiryMinutes', parseInt(e.target.value) || 2)}
            />
          </div>
          <div>
            <label style={labelStyle}>حداکثر تلاش (۱۰ دقیقه)</label>
            <input
              type="number" min={1} max={10} value={config.maxOtpAttempts} style={inputStyle}
              onChange={(e) => set('maxOtpAttempts', parseInt(e.target.value) || 3)}
            />
          </div>
          <div>
            <label style={labelStyle}>طول کد OTP</label>
            <input
              type="number" min={4} max={8} value={config.otpCodeLength} style={inputStyle}
              onChange={(e) => set('otpCodeLength', parseInt(e.target.value) || 6)}
            />
          </div>
        </div>
      </Section>

      {/* Tribe */}
      <Section title="تنظیمات قبیله 👥">
        <div>
          <label style={labelStyle}>حداکثر چالش‌های فعال همزمان</label>
          <input
            type="number" min={1} max={50} value={config.maxActiveChallenges} style={{ ...inputStyle, width: 'auto' }}
            onChange={(e) => set('maxActiveChallenges', parseInt(e.target.value) || 10)}
          />
        </div>
        <div className="flex flex-col gap-3">
          {([
            { key: 'allowAnonymousPosts',      label: 'اجازه پست ناشناس در بورد الهام‌بخش' },
            { key: 'allowAnonymousChallenges', label: 'اجازه شرکت ناشناس در چالش‌ها'       },
          ] as { key: keyof Config; label: string }[]).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set(key, !config[key] as Config[typeof key])}
                className="w-10 h-6 rounded-full relative transition-all flex-shrink-0"
                style={{ background: config[key] ? '#10B981' : 'var(--surface-secondary)', cursor: 'pointer' }}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ right: config[key] ? 4 : 'auto', left: config[key] ? 'auto' : 4 }}
                />
              </div>
              <span className="text-sm" style={{ color: 'var(--content-primary)' }}>{label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Platform info */}
      <Section title="اطلاعات پلتفرم ℹ️">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>نام پلتفرم</label>
            <input value={config.platformName} onChange={(e) => set('platformName', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>ایمیل تماس</label>
            <input value={config.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} placeholder="info@mindgo.ir" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>توضیح کوتاه پلتفرم</label>
          <textarea
            value={config.platformDescription}
            onChange={(e) => set('platformDescription', e.target.value)}
            style={{ ...inputStyle, resize: 'none' }}
            rows={3}
          />
        </div>
        <div>
          <label style={labelStyle}>شماره تماس</label>
          <input value={config.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} placeholder="021xxxxxxxx" />
        </div>
      </Section>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all"
        style={{ background: saving ? '#6B7280' : '#10B981' }}
      >
        {saving ? 'در حال ذخیره...' : '💾 ذخیره تنظیمات'}
      </button>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg z-50"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
