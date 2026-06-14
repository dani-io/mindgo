'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

const NAV_ITEMS = [
  { href: '/dashboard',   icon: '🏠', label: 'داشبورد'   },
  { href: '/growth-room', icon: '🌱', label: 'اتاق رشد'  },
  { href: '/coaches',     icon: '🧭', label: 'راه‌بلدها' },
  { href: '/tribe',       icon: '👥', label: 'قبیله'      },
  { href: '/profile',     icon: '👤', label: 'پروفایل'    },
]

export default function RehjooLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('mg_token')
    if (!token) { router.replace('/login'); return }

    const payload = decodeJwtPayload(token)
    if (!payload || (payload.exp as number) * 1000 < Date.now()) {
      localStorage.removeItem('mg_token')
      router.replace('/login')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--surface-primary)' }}
      >
        <span style={{ color: 'var(--content-tertiary)', fontSize: 14 }}>
          در حال بارگذاری...
        </span>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--surface-primary)', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
    >
      {children}

      {/* FAB — bottom-left (logical start in RTL) */}
      <button
        className="fixed z-50 flex items-center justify-center w-14 h-14 rounded-full text-2xl text-white transition-transform active:scale-90"
        style={{
          left: 16,
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          background: '#10B981',
          boxShadow: '0 4px 24px rgba(16,185,129,0.45)',
        }}
        aria-label="پشتیبانی"
      >
        💬
      </button>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around h-16"
        style={{
          background: 'var(--surface-card)',
          borderTop: '1px solid var(--border-color)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors"
              style={{ color: active ? '#10B981' : 'var(--content-tertiary)' }}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-[10px] font-medium leading-tight">{label}</span>
              {active && (
                <span
                  className="absolute -top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full"
                  style={{ background: '#10B981' }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
