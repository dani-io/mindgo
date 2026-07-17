'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageCropper from '@/components/ui/ImageCropper'

type Marital = 'single' | 'married'

const MARITAL_OPTIONS: { key: Marital; label: string }[] = [
  { key: 'single',  label: 'مجرد' },
  { key: 'married', label: 'متأهل' },
]

export default function ProfileEditPage() {
  const router = useRouter()

  const [name,      setName]      = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [marital,   setMarital]   = useState<Marital | ''>('')
  const [showCropper, setShowCropper] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [toast,   setToast]   = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('mg_token')
    if (!token) { router.replace('/login'); return }
    fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setName(json.data.name ?? '')
          setAvatarUrl(json.data.avatarUrl ?? null)
          setMarital(json.data.maritalStatus ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  async function handleSave() {
    if (!name.trim()) { setError('لطفاً نامت را وارد کن'); return }
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('mg_token')
      const res = await fetch('/api/users/me', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name: name.trim(),
          avatarUrl: avatarUrl ?? '',
          ...(marital ? { maritalStatus: marital } : {}),
        }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error?.message ?? 'خطا در ذخیره‌سازی'); setSaving(false); return }
      // Success toast, then return to profile.
      setToast(true)
      setTimeout(() => router.push('/profile'), 1100)
    } catch {
      setError('خطا در اتصال به سرور')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        {[80, 200, 100].map((h, i) => (
          <div key={i} className="rounded-2xl animate-pulse" style={{ height: h, background: 'var(--surface-card)' }} />
        ))}
      </div>
    )
  }

  const initials = name ? name.charAt(0) : '?'

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
        <h1 className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>ویرایش پروفایل</h1>
      </div>

      {/* Avatar */}
      <div
        className="rounded-2xl p-6 mb-4 flex flex-col items-center gap-3"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <button
          onClick={() => setShowCropper(true)}
          className="relative w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold group"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            <span className="text-white text-sm">📷</span>
          </div>
        </button>
        <button onClick={() => setShowCropper(true)} className="text-xs font-semibold" style={{ color: '#10B981' }}>
          تغییر عکس پروفایل
        </button>
      </div>

      {/* Avatar cropper modal */}
      {showCropper && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowCropper(false)}
        >
          <div
            className="rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4"
            style={{ background: 'var(--surface-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base" style={{ color: 'var(--content-primary)' }}>عکس پروفایل</h3>
              <button onClick={() => setShowCropper(false)} style={{ color: 'var(--content-tertiary)' }}>✕</button>
            </div>
            <div className="flex justify-center">
              <ImageCropper
                folder="avatars"
                size={220}
                onUploadComplete={(url) => { if (url) { setAvatarUrl(url); setShowCropper(false) } }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Name */}
      <section
        className="rounded-2xl p-4 mb-4 space-y-2"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <label className="block text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>نام</label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          placeholder="نام و نام خانوادگی"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
        />
      </section>

      {/* Marital status */}
      <section
        className="rounded-2xl p-4 mb-4 space-y-3"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <label className="block text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>
          وضعیت تأهل <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>(برای شخصی‌سازی چرخ زندگی)</span>
        </label>
        <div className="flex gap-2">
          {MARITAL_OPTIONS.map((opt) => {
            const sel = marital === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => setMarital(opt.key)}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: sel ? 'rgba(16,185,129,0.1)' : 'var(--surface-secondary)',
                  color:      sel ? '#10B981' : 'var(--content-secondary)',
                  border:     `1.5px solid ${sel ? '#10B981' : 'var(--border-color)'}`,
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </section>

      {error && (
        <p className="text-sm text-center mb-3" style={{ color: '#EF4444' }}>{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all active:scale-[0.99]"
        style={{ background: saving ? '#6EE7B7' : '#10B981' }}
      >
        {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
      </button>

      {/* Success toast */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-bold text-white z-50"
          style={{ bottom: 100, background: '#10B981', boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}
        >
          ✅ پروفایل با موفقیت ذخیره شد
        </div>
      )}
    </div>
  )
}
