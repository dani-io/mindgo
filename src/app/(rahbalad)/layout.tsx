'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface CoachInfo {
  name: string
  status: 'pending' | 'approved' | 'rejected'
  avgRating: number
}

const NAV_ITEMS = [
  { label: 'داشبورد',  icon: '🏠', href: '/coach-dashboard'  },
  { label: 'جلسات',   icon: '📅', href: '/coach-sessions'   },
  { label: 'پیام‌ها',  icon: '💬', href: '/coach-messages'  },
  { label: 'پکیج‌ها', icon: '📦', href: '/coach-packages'  },
  { label: 'کیف پول', icon: '💰', href: '/coach-wallet'     },
]

export default function RahbaladLayout({ children }: { children: React.ReactNode }) {
  const router  = useRouter()
  const pathname = usePathname()
  const [coach,   setCoach]   = useState<CoachInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verify JWT from localStorage
    const raw = localStorage.getItem('mg_token')
    if (!raw) { router.replace('/login'); return }

    try {
      const parts = raw.split('.')
      const decoded = JSON.parse(atob(parts[1]))
      const exp = decoded.exp as number
      if (Date.now() / 1000 > exp) { router.replace('/login'); return }
      if (decoded.role !== 'rahbalad') { router.replace('/dashboard'); return }
    } catch {
      router.replace('/login')
      return
    }

    // Fetch coach profile
    fetch('/api/coaches/me')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setCoach({ name: json.data.name, status: json.data.status, avgRating: json.data.avgRating })
        } else {
          // Profile not found → redirect to register
          router.replace('/coach-register')
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 animate-pulse"
            style={{ background: 'rgba(16,185,129,0.2)' }}
          />
          <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  // Pending approval state
  if (coach?.status === 'pending') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--surface-primary)' }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6"
          style={{ background: 'rgba(245,158,11,0.15)' }}
        >
          ⏳
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--content-primary)' }}>
          در انتظار تأیید
        </h1>
        <p className="text-sm leading-relaxed mb-6 max-w-sm" style={{ color: 'var(--content-secondary)' }}>
          پروفایل شما با موفقیت ثبت شد و در صف بررسی تیم Mindgo قرار دارد. معمولاً در کمتر از ۴۸ ساعت نتیجه را اطلاع می‌دهیم.
        </p>
        <div
          className="rounded-xl px-4 py-3 text-sm max-w-sm w-full"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}
        >
          📩 نتیجه بررسی از طریق پیامک اطلاع‌رسانی خواهد شد
        </div>
        <button
          onClick={() => { localStorage.removeItem('mg_token'); window.location.href = '/login' }}
          className="mt-8 text-sm"
          style={{ color: 'var(--content-tertiary)' }}
        >
          خروج از حساب
        </button>
      </div>
    )
  }

  if (coach?.status === 'rejected') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--surface-primary)' }}
      >
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--content-primary)' }}>
          پروفایل تأیید نشد
        </h1>
        <p className="text-sm" style={{ color: 'var(--content-secondary)' }}>
          برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-primary)' }}>

      {/* Top header */}
      <header
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4"
        style={{
          height:     56,
          background: 'var(--surface-card)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-base" style={{ color: '#10B981' }}>🧠 Mindgo</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
            راه‌بلد
          </span>
        </div>
        {coach && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--content-secondary)' }}>
              {coach.name || 'راه‌بلد'}
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
            >
              {(coach.name || 'ر').charAt(0)}
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main style={{ paddingTop: 56, paddingBottom: 72 }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex items-center"
        style={{
          height:     64,
          background: 'var(--surface-card)',
          borderTop:  '1px solid var(--border-color)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all"
              style={{ color: active ? '#10B981' : 'var(--content-tertiary)' }}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && (
                <span
                  className="absolute bottom-0 rounded-t-full"
                  style={{ width: 24, height: 3, background: '#10B981' }}
                />
              )}
            </button>
          )
        })}
      </nav>

    </div>
  )
}
