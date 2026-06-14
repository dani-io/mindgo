'use client'

import { useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────

interface Package {
  id:              string
  name:            string
  description:     string | null
  sessionCount:    number
  durationMinutes: number
  priceToman:      number
  includesChat:    boolean
  isIntro:         boolean
  isActive:        boolean
}

type FormData = Omit<Package, 'id' | 'isActive'>

const EMPTY_FORM: FormData = {
  name:            '',
  description:     '',
  sessionCount:    1,
  durationMinutes: 60,
  priceToman:      0,
  includesChat:    false,
  isIntro:         false,
}

// ── Helpers ───────────────────────────────────────────────

function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatPrice(toman: number): string {
  const s = toman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return toPersian(s) + ' تومان'
}

// ── Package Card ──────────────────────────────────────────

function PackageCard({
  pkg,
  onEdit,
  onDelete,
}: {
  pkg: Package
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--surface-card)',
        border:     `1px solid ${pkg.isActive ? 'var(--border-color)' : 'rgba(239,68,68,0.3)'}`,
        opacity:    pkg.isActive ? 1 : 0.6,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>
              {pkg.name}
            </p>
            {pkg.isIntro && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                معارفه
              </span>
            )}
            {!pkg.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                غیرفعال
              </span>
            )}
          </div>
          {pkg.description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--content-tertiary)' }}>
              {pkg.description}
            </p>
          )}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
              {toPersian(pkg.sessionCount)} جلسه · {toPersian(pkg.durationMinutes)} دقیقه
            </span>
            {pkg.includesChat && (
              <span className="text-xs" style={{ color: '#3B82F6' }}>· 💬 چت</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-left">
          <p className="font-bold text-sm" style={{ color: '#10B981' }}>
            {formatPrice(pkg.priceToman)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={onEdit}
          className="flex-1 py-2 rounded-lg text-xs font-medium transition-all active:scale-95"
          style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)', border: '1px solid var(--border-color)' }}
        >
          ویرایش
        </button>
        {pkg.isActive && (
          <button
            onClick={onDelete}
            className="py-2 px-4 rounded-lg text-xs font-medium transition-all active:scale-95"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
          >
            غیرفعال
          </button>
        )}
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────

function PackageModal({
  form,
  setForm,
  onSave,
  onClose,
  saving,
  isEdit,
}: {
  form:     FormData
  setForm:  React.Dispatch<React.SetStateAction<FormData>>
  onSave:   () => void
  onClose:  () => void
  saving:   boolean
  isEdit:   boolean
}) {
  function field(
    label: string,
    key: keyof FormData,
    type: 'text' | 'number' | 'textarea' = 'text'
  ) {
    return (
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--content-secondary)' }}>
          {label}
        </label>
        {type === 'textarea' ? (
          <textarea
            value={String(form[key] ?? '')}
            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
          />
        ) : (
          <input
            type={type}
            value={String(form[key] ?? '')}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                [key]: type === 'number' ? Number(e.target.value) : e.target.value,
              }))
            }
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="w-full max-w-lg mx-auto rounded-t-2xl overflow-y-auto"
        style={{ background: 'var(--surface-card)', maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="font-bold" style={{ color: 'var(--content-primary)' }}>
            {isEdit ? 'ویرایش پکیج' : 'افزودن پکیج جدید'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--content-tertiary)' }}>✕</button>
        </div>

        <div className="px-4 py-5 flex flex-col gap-4">
          {field('نام پکیج', 'name')}
          {field('توضیحات', 'description', 'textarea')}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--content-secondary)' }}>تعداد جلسات</label>
              <select
                value={form.sessionCount}
                onChange={(e) => setForm((p) => ({ ...p, sessionCount: Number(e.target.value) }))}
                className="w-full rounded-xl px-3 py-3 text-sm outline-none"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                  <option key={n} value={n}>{toPersian(n)} جلسه</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--content-secondary)' }}>مدت جلسه</label>
              <select
                value={form.durationMinutes}
                onChange={(e) => setForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))}
                className="w-full rounded-xl px-3 py-3 text-sm outline-none"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
              >
                {[30, 45, 60, 90, 120].map((n) => (
                  <option key={n} value={n}>{toPersian(n)} دقیقه</option>
                ))}
              </select>
            </div>
          </div>

          {field('قیمت (تومان)', 'priceToman', 'number')}
          {form.priceToman > 0 && (
            <p className="text-xs -mt-2" style={{ color: '#10B981' }}>
              معادل: {formatPrice(Number(form.priceToman))}
            </p>
          )}

          {/* Toggles */}
          <div className="flex flex-col gap-3">
            <Toggle
              label="شامل چت درون‌برنامه‌ای"
              value={form.includesChat}
              onChange={(v) => setForm((p) => ({ ...p, includesChat: v }))}
            />
            <Toggle
              label="جلسه معارفه (قیمت پایین‌تر)"
              value={form.isIntro}
              onChange={(v) => setForm((p) => ({ ...p, isIntro: v }))}
            />
          </div>

          <button
            onClick={onSave}
            disabled={saving || !form.name || !form.priceToman}
            className="w-full py-3.5 rounded-xl font-bold text-base text-white mt-2 transition-all active:scale-95"
            style={{ background: saving || !form.name ? 'var(--surface-tertiary)' : '#10B981' }}
          >
            {saving ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'افزودن پکیج'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between py-2.5 px-3 rounded-xl w-full"
      style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)' }}
    >
      <span className="text-sm" style={{ color: 'var(--content-primary)' }}>{label}</span>
      <div
        className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
        style={{ background: value ? '#10B981' : 'var(--surface-tertiary)' }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
          style={{ right: value ? 2 : 'auto', left: value ? 'auto' : 2 }}
        />
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────

export default function CoachPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [form,     setForm]     = useState<FormData>({ ...EMPTY_FORM })
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function loadPackages() {
    try {
      const res  = await fetch('/api/coaches/me/packages')
      const json = await res.json()
      if (json.success) setPackages(json.data)
    } catch { /* silent */ }
  }

  useEffect(() => { loadPackages().finally(() => setLoading(false)) }, [])

  function openAdd() {
    setForm({ ...EMPTY_FORM })
    setEditId(null)
    setModal(true)
  }

  function openEdit(pkg: Package) {
    setForm({
      name:            pkg.name,
      description:     pkg.description ?? '',
      sessionCount:    pkg.sessionCount,
      durationMinutes: pkg.durationMinutes,
      priceToman:      pkg.priceToman,
      includesChat:    pkg.includesChat,
      isIntro:         pkg.isIntro,
    })
    setEditId(pkg.id)
    setModal(true)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const url    = editId ? `/api/coaches/me/packages/${editId}` : '/api/coaches/me/packages'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:             form.name,
          description:      form.description || null,
          session_count:    form.sessionCount,
          duration_minutes: form.durationMinutes,
          price_toman:      form.priceToman,
          includes_chat:    form.includesChat,
          is_intro:         form.isIntro,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setModal(false)
        await loadPackages()
      } else {
        setError(json.error?.message ?? 'خطایی رخ داد')
      }
    } catch {
      setError('خطا در ارتباط با سرور')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res  = await fetch(`/api/coaches/me/packages/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) await loadPackages()
  }

  const activePackages   = packages.filter((p) => p.isActive)
  const inactivePackages = packages.filter((p) => !p.isActive)

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6">

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>پکیج‌های من</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--content-secondary)' }}>
            {toPersian(activePackages.length)} پکیج فعال
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{ background: '#10B981' }}
        >
          <span>+</span>
          افزودن
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm mb-4" style={{ color: 'var(--content-tertiary)' }}>
            هنوز پکیجی تعریف نکرده‌اید
          </p>
          <button
            onClick={openAdd}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#10B981' }}
          >
            اولین پکیج را بسازید
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 mb-5">
            {activePackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onEdit={() => openEdit(pkg)}
                onDelete={() => handleDelete(pkg.id)}
              />
            ))}
          </div>

          {inactivePackages.length > 0 && (
            <>
              <p className="text-xs mb-3" style={{ color: 'var(--content-tertiary)' }}>پکیج‌های غیرفعال</p>
              <div className="flex flex-col gap-3">
                {inactivePackages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    onEdit={() => openEdit(pkg)}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {modal && (
        <PackageModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => { setModal(false); setError(null) }}
          saving={saving}
          isEdit={!!editId}
        />
      )}

      {error && !modal && (
        <p className="text-sm text-center mt-4 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
          {error}
        </p>
      )}
    </div>
  )
}
