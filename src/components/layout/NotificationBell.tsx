'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NotificationBell() {
  const router = useRouter()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let alive = true

    async function poll() {
      try {
        const res  = await fetch('/api/notifications/me/unread-count')
        const json = await res.json()
        if (alive && json.success) setCount(json.data.count)
      } catch { /* ignore */ }
    }

    poll()
    const id = setInterval(poll, 30_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return (
    <button
      onClick={() => router.push('/notifications')}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90"
      style={{ background: count > 0 ? 'rgba(239,68,68,0.1)' : 'var(--surface-secondary)' }}
      aria-label={`اعلان‌ها${count > 0 ? ` — ${count} خوانده نشده` : ''}`}
    >
      <span className="text-lg leading-none">{count > 0 ? '🔔' : '🔕'}</span>
      {count > 0 && (
        <span
          className="absolute -top-1 -left-1 min-w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full px-1"
          style={{ background: '#EF4444', color: 'white' }}
        >
          {count > 99 ? '۹۹+' : String(count).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])}
        </span>
      )}
    </button>
  )
}
