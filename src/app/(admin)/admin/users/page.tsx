'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserItem {
  id:          string
  name:        string | null
  phone:       string
  role:        string
  avatarUrl:   string | null
  isActive:    boolean
  streakCount: number
  xpPoints:    number
  level:       number
  createdAt:   string
  adminRole:   { role: string; isActive: boolean } | null
}

type RoleFilter = 'all' | 'rehjoo' | 'rahbalad'

const ROLE_LABELS: Record<string, string> = {
  rehjoo:   'رهجو',
  rahbalad: 'راه‌بلد',
  admin:    'ادمین',
}

function toPersian(n: number | string) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('mg_token') : null }

export default function AdminUsersPage() {
  const router = useRouter()
  const [users,   setUsers]   = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState<RoleFilter>('all')
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [toggling,setToggling]= useState<string | null>(null)

  const load = useCallback(async (q: string, f: RoleFilter, p: number) => {
    setLoading(true)
    const token = getToken()
    const params = new URLSearchParams({ search: q, role: f, page: String(p), limit: '30' })
    try {
      const res  = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) { setUsers(json.data.users); setTotal(json.data.total) }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(search, filter, page) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load(search, filter, 1)
  }

  function handleFilter(f: RoleFilter) {
    setFilter(f)
    setPage(1)
    load(search, f, 1)
  }

  async function toggleActive(user: UserItem) {
    setToggling(user.id)
    const token = getToken()
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ isActive: !user.isActive }),
      })
      const json = await res.json()
      if (json.success) {
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      }
    } finally { setToggling(null) }
  }

  const TABS: { label: string; value: RoleFilter }[] = [
    { label: 'همه',      value: 'all'      },
    { label: 'رهجوها',   value: 'rehjoo'   },
    { label: 'راه‌بلدها', value: 'rahbalad' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>مدیریت کاربران</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--content-tertiary)' }}>{toPersian(total)} کاربر</p>
        </div>
      </div>

      {/* Search + filters */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="جستجو با نام یا شماره..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#10B981' }}
        >
          جستجو
        </button>
      </form>

      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => handleFilter(t.value)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: filter === t.value ? '#10B981' : 'var(--surface-card)',
              color:      filter === t.value ? 'white'   : 'var(--content-secondary)',
              border:     '1px solid var(--border-color)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">👤</p>
          <p style={{ color: 'var(--content-tertiary)' }}>کاربری یافت نشد</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          {/* Header row */}
          <div
            className="grid items-center px-4 py-2.5 text-xs font-semibold"
            style={{
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
              background: 'var(--surface-secondary)',
              color: 'var(--content-tertiary)',
            }}
          >
            <span>کاربر</span>
            <span>نقش</span>
            <span>زنجیره</span>
            <span>سطح</span>
            <span>عضویت</span>
            <span>وضعیت</span>
          </div>

          {users.map((user, i) => (
            <div
              key={user.id}
              className="grid items-center px-4 py-3 transition-all cursor-pointer hover:opacity-90"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                background:   'var(--surface-card)',
                borderTop:    i === 0 ? 'none' : '1px solid var(--border-color)',
              }}
              onClick={() => router.push(`/admin/users/${user.id}`)}
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (user.name ?? user.phone).charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--content-primary)' }}>
                    {user.name ?? '—'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--content-tertiary)', direction: 'ltr', textAlign: 'right' }}>
                    {user.phone}
                  </p>
                </div>
              </div>

              {/* Role */}
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                style={{
                  background: user.role === 'rahbalad' ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.1)',
                  color:      user.role === 'rahbalad' ? '#8B5CF6' : '#10B981',
                }}
              >
                {ROLE_LABELS[user.role] ?? user.role}
              </span>

              {/* Streak */}
              <span className="text-sm" style={{ color: 'var(--content-primary)' }}>
                🔥 {toPersian(user.streakCount)}
              </span>

              {/* Level */}
              <span className="text-sm" style={{ color: 'var(--content-primary)' }}>
                ⭐ {toPersian(user.level)}
              </span>

              {/* Join date */}
              <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                {fmtDate(user.createdAt)}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleActive(user)}
                  disabled={toggling === user.id}
                  className="text-xs px-3 py-1 rounded-full font-semibold transition-all"
                  style={{
                    background: user.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color:      user.isActive ? '#10B981' : '#EF4444',
                    opacity:    toggling === user.id ? 0.6 : 1,
                  }}
                >
                  {user.isActive ? 'فعال' : 'غیرفعال'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 30 && (
        <div className="flex justify-center gap-2 mt-5">
          {page > 1 && (
            <button
              onClick={() => { const p = page - 1; setPage(p); load(search, filter, p) }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--content-secondary)' }}
            >
              قبلی
            </button>
          )}
          <span className="px-4 py-2 text-sm" style={{ color: 'var(--content-tertiary)' }}>
            صفحه {toPersian(page)} از {toPersian(Math.ceil(total / 30))}
          </span>
          {page < Math.ceil(total / 30) && (
            <button
              onClick={() => { const p = page + 1; setPage(p); load(search, filter, p) }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--content-secondary)' }}
            >
              بعدی
            </button>
          )}
        </div>
      )}
    </div>
  )
}
