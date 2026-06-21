'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ActiveCoach {
  userId: string
  name:   string
}

export default function FAB() {
  const router = useRouter()
  const [open,        setOpen]        = useState(false)
  const [activeCoach, setActiveCoach] = useState<ActiveCoach | null | 'none'>('none')
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch user's active booking once on mount
  useEffect(() => {
    fetch('/api/bookings/me')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setActiveCoach({ userId: json.data.coach.userId, name: json.data.coach.name })
        } else {
          setActiveCoach(null)
        }
      })
      .catch(() => setActiveCoach(null))
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleMessageCoach() {
    setOpen(false)
    if (activeCoach && activeCoach !== 'none') {
      router.push(`/messages/${activeCoach.userId}`)
    } else {
      router.push('/coaches')
    }
  }

  const hasCoach = activeCoach && activeCoach !== 'none'

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        left:   16,
        bottom: 'calc(80px + env(safe-area-inset-bottom))',
      }}
    >
      {/* Mini menu — appears above FAB */}
      {open && (
        <div
          className="absolute bottom-16 left-0 flex flex-col gap-2 mb-1"
          style={{ minWidth: 200 }}
        >
          {/* Message coach option */}
          <button
            onClick={handleMessageCoach}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-right transition-all active:scale-95"
            style={{
              background: 'var(--surface-card)',
              border:     '1px solid var(--border-color)',
              boxShadow:  '0 4px 16px rgba(0,0,0,0.15)',
              color:      hasCoach ? 'var(--content-primary)' : 'var(--content-tertiary)',
              direction:  'rtl',
            }}
          >
            <span className="text-base">💬</span>
            <div className="flex-1 text-right">
              {hasCoach ? (
                <>
                  <p style={{ color: 'var(--content-primary)' }}>پیام به کوچ</p>
                  <p className="text-[10px] font-normal mt-0.5" style={{ color: '#10B981' }}>
                    {(activeCoach as ActiveCoach).name}
                  </p>
                </>
              ) : (
                <p>ابتدا یک کوچ انتخاب کنید ›</p>
              )}
            </div>
          </button>

          {/* Support option */}
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-right"
            style={{
              background: 'var(--surface-card)',
              border:     '1px solid var(--border-color)',
              boxShadow:  '0 4px 16px rgba(0,0,0,0.15)',
              color:      'var(--content-primary)',
              direction:  'rtl',
            }}
            onClick={() => { setOpen(false); router.push('/support') }}
          >
            <span className="text-base">🛟</span>
            <div className="text-right">
              <p>پشتیبانی Mindgo</p>
              <p className="text-[10px] font-normal mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
                جواب سوالات و کمک
              </p>
            </div>
          </button>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-14 h-14 rounded-full text-white transition-all active:scale-90"
        style={{
          background: open ? '#0d9e6f' : '#10B981',
          boxShadow:  '0 4px 24px rgba(16,185,129,0.45)',
          transform:  open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease, background 0.2s ease',
          fontSize:   open ? 24 : 22,
        }}
        aria-label={open ? 'بستن منو' : 'پیام و پشتیبانی'}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  )
}
