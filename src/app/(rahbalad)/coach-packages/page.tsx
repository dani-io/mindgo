'use client'

import { useEffect, useState, useCallback } from 'react'

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

type FormData  = Omit<Package, 'id' | 'isActive'>
type FilterTab = 'all' | 'active' | 'inactive'

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
  return toPersian(toman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')) + ' تومان'
}

// ── Package Card ──────────────────────────────────────────

function PackageCard({
  pkg,
  toggling,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  pkg:            Package
  toggling:       boolean
  onEdit:         () => void
  onToggleActive: () => void
  onDelete:       () => void
}) {
  return (
    <div
      className="rounded-xl p-4 transition-opacity"
      style={{
        background: 'var(--surface-card)',
        border:     `1px solid ${pkg.isActive ? 'var(--border-color)' : 'rgba(156,163,175,0.35)'}`,
        opacity:    pkg.isActive ? 1 : 0.65,
      }}
    >
      {/* Info */}
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
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(156,163,175,0.15)', color: '#9CA3AF' }}>
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
        <p className="font-bold text-sm flex-shrink-0" style={{ color: '#10B981' }}>
          {formatPrice(pkg.priceToman)}
        </p>
      </div>

      {/* Actions — always visible */}
      <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>

        {/* Toggle active */}
        <button
          onClick={onToggleActive}
          disabled={toggling}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
          style={{
            background: pkg.isActive ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
            color:      pkg.isActive ? '#F59E0B'               : '#10B981',
            opacity:    toggling ? 0.6 : 1,
          }}
        >
          {toggling ? '...' : pkg.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
        </button>

        {/* Edit */}
        <button
          onClick={onEdit}
          className="flex-1 py-2 rounded-lg text-xs font-medium transition-all active:scale-95"
          style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)', border: '1px solid var(--border-color)' }}
        >
          ویرایش
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="py-2 px-3 rounded-lg text-xs font-medium transition-all active:scale-95"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
        >
          حذف
        </button>
      </div>
    </div>
  )
}

// ── Delete confirmation ───────────────────────────────────

function DeleteConfirm({
  name,
  onConfirm,
  onCancel,
  deleting,
  errorMsg,
}: {
  name:     string
  onConfirm: () => void
  onCancel:  () => void
  deleting:  boolean
  errorMsg:  string | null
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: 'var(--surface-card)' }}
      >
        <p className="text-lg font-bold mb-2" style={{ color: 'var(--content-primary)' }}>حذف پکیج</p>
        <p className="text-sm mb-4" style={{ color: 'var(--content-secondary)' }}>
          آیا از حذف پکیج «{name}» مطمئن هستید؟ این عمل قابل بازگشت نیست.
        </p>
        {errorMsg && (
          <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
            {errorMsg}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)' }}
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: deleting ? '#9CA3AF' : '#EF4444' }}
          >
            {deleting ? 'در حال حذف...' : 'حذف'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Package Modal (add / edit) ────────────────────────────

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
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

function PackageModal({
  form,
  setForm,
  onSave,
  onClose,
  saving,
  isEdit,
  error,
}: {
  form:    FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  onSave:  () => void
  onClose: () => void
  saving:  boolean
  isEdit:  boolean
  error:   string | null
}) {
  function field(label: string, key: keyof FormData, type: 'text' | 'number' | 'textarea' = 'text') {
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
              setForm((p) => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))
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

          <div className="flex flex-col gap-3">
            <Toggle label="شامل چت درون‌برنامه‌ای" value={form.includesChat} onChange={(v) => setForm((p) => ({ ...p, includesChat: v }))} />
            <Toggle label="جلسه معارفه (قیمت پایین‌تر)"  value={form.isIntro}      onChange={(v) => setForm((p) => ({ ...p, isIntro: v }))} />
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
              {error}
            </p>
          )}

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

// ── Page ──────────────────────────────────────────────────

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',      label: 'همه'      },
  { key: 'active',   label: 'فعال'     },
  { key: 'inactive', label: 'غیرفعال' },
]

export default function CoachPackagesPage() {
  const [packages,   setPackages]   = useState<Package[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filterTab,  setFilterTab]  = useState<FilterTab>('all')

  // Modal state
  const [modal,    setModal]    = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [form,     setForm]     = useState<FormData>({ ...EMPTY_FORM })
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState<string | null>(null)

  // Per-card toggling (to show spinner only on tapped card)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Delete confirm
  const [confirmPkg,  setConfirmPkg]  = useState<Package | null>(null)
  const [deleting,    setDeleting]    = useState(false)
  const [deleteErr,   setDeleteErr]   = useState<string | null>(null)

  const loadPackages = useCallback(async () => {
    try {
      const res  = await fetch('/api/coaches/me/packages')
      const json = await res.json()
      if (json.success) setPackages(json.data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { loadPackages().finally(() => setLoading(false)) }, [loadPackages])

  // ── Modal handlers ────────────────────────────────────────

  function openAdd() {
    setForm({ ...EMPTY_FORM })
    setEditId(null)
    setFormErr(null)
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
    setFormErr(null)
    setModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setFormErr(null)
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
        setFormErr(json.error?.message ?? 'خطایی رخ داد')
      }
    } catch {
      setFormErr('خطا در ارتباط با سرور')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle active/inactive ────────────────────────────────

  async function handleToggleActive(pkg: Package) {
    setTogglingId(pkg.id)
    try {
      const res  = await fetch(`/api/coaches/me/packages/${pkg.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_active: !pkg.isActive }),
      })
      const json = await res.json()
      if (json.success) {
        setPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, isActive: !p.isActive } : p))
      }
    } catch { /* silent */ }
    finally { setTogglingId(null) }
  }

  // ── Delete ────────────────────────────────────────────────

  async function handleDelete() {
    if (!confirmPkg) return
    setDeleting(true)
    setDeleteErr(null)
    try {
      const res  = await fetch(`/api/coaches/me/packages/${confirmPkg.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setPackages((prev) => prev.filter((p) => p.id !== confirmPkg.id))
        setConfirmPkg(null)
      } else {
        setDeleteErr(json.error?.message ?? 'خطا در حذف')
      }
    } catch {
      setDeleteErr('خطا در ارتباط با سرور')
    } finally {
      setDeleting(false)
    }
  }

  // ── Derived display list ──────────────────────────────────

  const visible = packages.filter((p) => {
    if (filterTab === 'active')   return p.isActive
    if (filterTab === 'inactive') return !p.isActive
    return true
  })

  const activeCount   = packages.filter((p) => p.isActive).length
  const inactiveCount = packages.filter((p) => !p.isActive).length

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>پکیج‌های من</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--content-secondary)' }}>
            {toPersian(activeCount)} فعال · {toPersian(inactiveCount)} غیرفعال
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{ background: '#10B981' }}
        >
          <span>+</span> افزودن
        </button>
      </div>

      {/* Filter tabs */}
      {packages.length > 0 && (
        <div
          className="flex rounded-xl p-1 mb-5 gap-1"
          style={{ background: 'var(--surface-secondary)' }}
        >
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterTab(key)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filterTab === key ? 'var(--surface-card)' : 'transparent',
                color:      filterTab === key ? 'var(--content-primary)' : 'var(--content-tertiary)',
                boxShadow:  filterTab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {label}
              {key === 'active'   && activeCount   > 0 && ` (${toPersian(activeCount)})`}
              {key === 'inactive' && inactiveCount > 0 && ` (${toPersian(inactiveCount)})`}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm mb-4" style={{ color: 'var(--content-tertiary)' }}>هنوز پکیجی تعریف نکرده‌اید</p>
          <button
            onClick={openAdd}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#10B981' }}
          >
            اولین پکیج را بسازید
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--content-tertiary)' }}>
          <p className="text-sm">پکیجی در این دسته وجود ندارد</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              toggling={togglingId === pkg.id}
              onEdit={() => openEdit(pkg)}
              onToggleActive={() => handleToggleActive(pkg)}
              onDelete={() => { setConfirmPkg(pkg); setDeleteErr(null) }}
            />
          ))}
        </div>
      )}

      {/* Edit / Add modal */}
      {modal && (
        <PackageModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => { setModal(false); setFormErr(null) }}
          saving={saving}
          isEdit={!!editId}
          error={formErr}
        />
      )}

      {/* Delete confirm dialog */}
      {confirmPkg && (
        <DeleteConfirm
          name={confirmPkg.name}
          onConfirm={handleDelete}
          onCancel={() => { setConfirmPkg(null); setDeleteErr(null) }}
          deleting={deleting}
          errorMsg={deleteErr}
        />
      )}
    </div>
  )
}
