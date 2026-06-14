'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────

type AdminRoleType = 'super_admin' | 'support_manager' | 'support_agent'

interface AdminInfo {
  name:      string | null
  phone:     string
  adminRole: AdminRoleType
  roleLabel: string
}

// ── Nav config ────────────────────────────────────────────

interface NavItem {
  label:    string
  icon:     string
  href:     string
  minRole:  AdminRoleType
  badge?:   boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'داشبورد آماری',      icon: '📊', href: '/admin',                   minRole: 'support_agent'  },
  { label: 'صف تأیید راه‌بلدها', icon: '✅', href: '/admin/coaches/pending',   minRole: 'support_manager', badge: true },
  { label: 'مدیریت رهجوها',     icon: '👥', href: '/admin/users',             minRole: 'support_agent'  },
  { label: 'مدیریت مالی',        icon: '💰', href: '/admin/finance',           minRole: 'super_admin'    },
  { label: 'مدیریت تسویه',       icon: '🏦', href: '/admin/finance/payouts',   minRole: 'super_admin'    },
  { label: 'اتاق داوری',         icon: '⚖️', href: '/admin/disputes',          minRole: 'support_manager' },
  { label: 'تیکت‌های پشتیبانی', icon: '🎫', href: '/admin/tickets',           minRole: 'support_agent'  },
  { label: 'مدیریت قبیله',       icon: '🌿', href: '/admin/tribe',             minRole: 'support_agent'  },
  { label: 'مدیریت محتوا',       icon: '📖', href: '/admin/content',           minRole: 'support_manager' },
  { label: 'کارمندان (RBAC)',    icon: '🔐', href: '/admin/staff',             minRole: 'super_admin'    },
  { label: 'تنظیمات',            icon: '⚙️', href: '/admin/settings',          minRole: 'super_admin'    },
]

const ROLE_WEIGHT: Record<AdminRoleType, number> = {
  super_admin:     3,
  support_manager: 2,
  support_agent:   1,
}

function canAccess(userRole: AdminRoleType, minRole: AdminRoleType): boolean {
  return ROLE_WEIGHT[userRole] >= ROLE_WEIGHT[minRole]
}

// ── Layout ────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [admin,    setAdmin]   = useState<AdminInfo | null>(null)
  const [loading,  setLoading] = useState(true)
  const [overview, setOverview] = useState<{ pendingCoaches: number } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('mg_token')
    if (!raw) { router.replace('/login'); return }

    try {
      const parts   = raw.split('.')
      const decoded = JSON.parse(atob(parts[1]))
      if (Date.now() / 1000 > decoded.exp) { router.replace('/login'); return }
      // Admin access is granted via admin_roles table (encoded in adminRole JWT claim)
      // A user with role='rahbalad' can also have adminRole set
      if (!decoded.adminRole) { router.replace('/login'); return }
    } catch {
      router.replace('/login')
      return
    }

    Promise.all([
      fetch('/api/admin/me').then((r) => r.json()),
      fetch('/api/admin/analytics/overview').then((r) => r.json()),
    ])
      .then(([me, ov]) => {
        if (me.success) setAdmin(me.data)
        else { router.replace('/login'); return }
        if (ov.success) setOverview(ov.data)
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 animate-pulse" style={{ background: 'rgba(16,185,129,0.2)' }} />
          <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (!admin) return null

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-primary)', direction: 'rtl' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — right side in RTL */}
      <aside
        className={`fixed top-0 right-0 h-full z-40 flex flex-col transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
        style={{
          width:       256,
          background:  'var(--surface-card)',
          borderLeft:  '1px solid var(--border-color)',
          overflowY:   'auto',
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <span className="text-2xl">🧠</span>
          <div>
            <p className="font-bold text-sm" style={{ color: '#10B981' }}>Mindgo</p>
            <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>پنل ادمین</p>
          </div>
        </div>

        {/* Admin info */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
            >
              {(admin.name || 'A').charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--content-primary)' }}>
                {admin.name ?? admin.phone}
              </p>
              <p className="text-xs" style={{ color: '#10B981' }}>{admin.roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => {
            if (!canAccess(admin.adminRole, item.minRole)) return null
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            const pendingBadge = item.badge && (overview?.pendingCoaches ?? 0)

            return (
              <button
                key={item.href}
                onClick={() => { router.push(item.href); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-right transition-all"
                style={{
                  background: active ? 'rgba(16,185,129,0.1)' : 'transparent',
                  color:      active ? '#10B981' : 'var(--content-secondary)',
                  borderRight: active ? '3px solid #10B981' : '3px solid transparent',
                }}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <span className="text-sm font-medium flex-1 text-right">{item.label}</span>
                {pendingBadge ? (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#EF4444', color: 'white' }}
                  >
                    {pendingBadge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => { localStorage.removeItem('mg_token'); window.location.href = '/login' }}
            className="w-full flex items-center gap-3 py-2 text-sm transition-all"
            style={{ color: '#EF4444' }}
          >
            <span>🚪</span>
            <span>خروج از حساب</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-6"
          style={{
            height:     56,
            background: 'var(--surface-card)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-xl"
            style={{ background: 'var(--surface-secondary)' }}
            onClick={() => setSidebarOpen(true)}
          >
            <span style={{ fontSize: 18 }}>☰</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--content-tertiary)' }}>
              {NAV_ITEMS.find((n) => n.href !== '/admin' ? pathname.startsWith(n.href) : pathname === n.href)?.label ?? 'پنل ادمین'}
            </span>
          </div>

          <div
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}
          >
            {admin.roleLabel}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

      </div>
    </div>
  )
}
