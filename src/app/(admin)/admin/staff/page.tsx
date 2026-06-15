'use client'

import { useEffect, useState } from 'react'

interface StaffMember {
  id:        string
  role:      string
  isActive:  boolean
  createdAt: string
  user:      { id: string; name: string | null; phone: string; createdAt: string }
}

const ROLE_LABELS: Record<string, string> = {
  super_admin:     'مدیر ارشد',
  support_manager: 'مدیر پشتیبانی',
  support_agent:   'کارشناس پشتیبانی',
}
const ROLE_COLORS: Record<string, string> = {
  super_admin:     '#EF4444',
  support_manager: '#3B82F6',
  support_agent:   '#10B981',
}

const RBAC_TABLE = [
  { section: 'پنل پشتیبانی (تیکت‌ها)',  super: true, manager: true, agent: true  },
  { section: 'مشاهده پروفایل رهجو',      super: true, manager: true, agent: true  },
  { section: 'تأیید/رد مدارک کوچ',       super: true, manager: true, agent: false },
  { section: 'مدیریت قبیله',              super: true, manager: true, agent: true  },
  { section: 'مدیریت محتوا',              super: true, manager: true, agent: false },
  { section: 'اتاق داوری',               super: true, manager: true, agent: false },
  { section: 'مدیریت مالی و تسویه',       super: true, manager: false, agent: false },
  { section: 'کارمندان و RBAC',           super: true, manager: false, agent: false },
  { section: 'تنظیمات پلتفرم',           super: true, manager: false, agent: false },
]

function toPersian(n: number | string) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('mg_token') : null }

export default function AdminStaffPage() {
  const [staff,    setStaff]    = useState<StaffMember[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showAdd,  setShowAdd]  = useState(false)
  const [phone,    setPhone]    = useState('')
  const [role,     setRole]     = useState('support_agent')
  const [adding,   setAdding]   = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [confirm,  setConfirm]  = useState<StaffMember | null>(null)

  async function load() {
    setLoading(true)
    const token = getToken()
    try {
      const res  = await fetch('/api/admin/staff', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) setStaff(json.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    if (!phone.trim()) return
    setAdding(true)
    setAddError(null)
    const token = getToken()
    try {
      const res  = await fetch('/api/admin/staff', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ phone: phone.trim(), role }),
      })
      const json = await res.json()
      if (json.success) { setShowAdd(false); setPhone(''); await load() }
      else setAddError(json.error?.message ?? 'خطا')
    } finally { setAdding(false) }
  }

  async function handleRemove(member: StaffMember) {
    const token = getToken()
    const res = await fetch(`/api/admin/staff/${member.id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) { setConfirm(null); load() }
  }

  async function toggleActive(member: StaffMember) {
    const token = getToken()
    await fetch(`/api/admin/staff/${member.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ isActive: !member.isActive }),
    })
    load()
  }

  const inputStyle = {
    background: 'var(--surface-secondary)',
    border:     '1px solid var(--border-color)',
    color:      'var(--content-primary)',
    borderRadius: 10, padding: '10px 12px', width: '100%', fontSize: 14, outline: 'none',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>کارمندان و دسترسی‌ها</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--content-tertiary)' }}>{toPersian(staff.length)} کارمند</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setPhone(''); setAddError(null) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: '#10B981' }}
        >
          + افزودن کارمند
        </button>
      </div>

      {/* Staff table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />)}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid var(--border-color)' }}>
          <div
            className="grid px-4 py-2.5 text-xs font-semibold"
            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto', background: 'var(--surface-secondary)', color: 'var(--content-tertiary)' }}
          >
            <span>کارمند</span><span>نقش</span><span>وضعیت</span><span>تاریخ عضویت</span><span>عملیات</span>
          </div>
          {staff.length === 0 ? (
            <div className="py-10 text-center" style={{ background: 'var(--surface-card)', color: 'var(--content-tertiary)' }}>
              هنوز کارمندی ثبت نشده
            </div>
          ) : staff.map((m, i) => (
            <div
              key={m.id}
              className="grid items-center px-4 py-3"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                background: 'var(--surface-card)',
                borderTop:  i === 0 ? 'none' : '1px solid var(--border-color)',
              }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
                  {m.user.name ?? '—'}
                </p>
                <p className="text-xs" style={{ color: 'var(--content-tertiary)', direction: 'ltr', textAlign: 'right' }}>{m.user.phone}</p>
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full w-fit"
                style={{ background: `${ROLE_COLORS[m.role]}20`, color: ROLE_COLORS[m.role] }}
              >
                {ROLE_LABELS[m.role] ?? m.role}
              </span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                style={{
                  background: m.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color:      m.isActive ? '#10B981' : '#EF4444',
                }}
              >
                {m.isActive ? 'فعال' : 'غیرفعال'}
              </span>
              <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{fmtDate(m.createdAt)}</span>
              <div className="flex gap-2">
                {m.role !== 'super_admin' && (
                  <>
                    <button
                      onClick={() => toggleActive(m)}
                      className="text-xs px-3 py-1 rounded-lg"
                      style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
                    >
                      {m.isActive ? 'تعلیق' : 'فعال‌سازی'}
                    </button>
                    <button
                      onClick={() => setConfirm(m)}
                      className="text-xs px-3 py-1 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
                    >
                      حذف
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RBAC permissions table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
        <div className="px-5 py-3" style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--content-primary)' }}>🔐 جدول دسترسی‌ها</h2>
        </div>
        <div style={{ background: 'var(--surface-card)' }}>
          <div
            className="grid px-5 py-2.5 text-xs font-semibold"
            style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr', color: 'var(--content-tertiary)', borderBottom: '1px solid var(--border-color)' }}
          >
            <span>بخش</span>
            <span className="text-center" style={{ color: ROLE_COLORS.super_admin }}>مدیر ارشد</span>
            <span className="text-center" style={{ color: ROLE_COLORS.support_manager }}>مدیر پشتیبانی</span>
            <span className="text-center" style={{ color: ROLE_COLORS.support_agent }}>کارشناس</span>
          </div>
          {RBAC_TABLE.map((row, i) => (
            <div
              key={i}
              className="grid items-center px-5 py-3"
              style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr', borderTop: i === 0 ? 'none' : '1px solid var(--border-color)' }}
            >
              <span className="text-sm" style={{ color: 'var(--content-primary)' }}>{row.section}</span>
              {[row.super, row.manager, row.agent].map((has, j) => (
                <span key={j} className="text-center text-lg">{has ? '✅' : '❌'}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6"
            style={{ background: 'var(--surface-card)', direction: 'rtl' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base mb-5" style={{ color: 'var(--content-primary)' }}>افزودن کارمند جدید</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--content-secondary)' }}>شماره موبایل</label>
                <input
                  type="tel"
                  placeholder="09xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--content-secondary)' }}>نقش</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                  <option value="support_agent">کارشناس پشتیبانی</option>
                  <option value="support_manager">مدیر پشتیبانی</option>
                </select>
              </div>
              {addError && <p className="text-xs" style={{ color: '#EF4444' }}>{addError}</p>}
              <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                کاربر باید قبلاً در سیستم ثبت‌نام کرده باشد. مدیر ارشد فقط از طریق اسکریپت اضافه می‌شود.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleAdd}
                  disabled={adding || !phone.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: adding ? '#6B7280' : '#10B981' }}
                >
                  {adding ? 'در حال افزودن...' : 'افزودن'}
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="py-3 px-5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove modal */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setConfirm(null)}
        >
          <div
            className="w-full max-w-xs rounded-3xl p-6 text-center"
            style={{ background: 'var(--surface-card)', direction: 'rtl' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-4xl mb-3">⚠️</p>
            <h3 className="font-bold mb-2" style={{ color: 'var(--content-primary)' }}>حذف دسترسی</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--content-secondary)' }}>
              دسترسی ادمین {confirm.user.name ?? confirm.user.phone} حذف می‌شود. اطمینان دارید؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleRemove(confirm)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background: '#EF4444' }}
              >
                بله، حذف کن
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
