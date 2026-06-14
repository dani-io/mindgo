import React from 'react'
import Link from 'next/link'

interface ConversationCardProps {
  partnerId:     string
  partnerName:   string | null
  partnerPhone:  string
  lastMessage:   string
  lastMessageAt: string   // ISO
  unreadCount:   number
  isLastMine:    boolean
  href:          string
}

function formatTime(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const diffMs   = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) {
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays < 7) {
    return d.toLocaleDateString('fa-IR', { weekday: 'short' })
  }
  return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
}

function initials(name: string | null, phone: string): string {
  if (name) return name.trim().charAt(0)
  return phone.slice(-2)
}

export default function ConversationCard({
  partnerName, partnerPhone, lastMessage, lastMessageAt,
  unreadCount, isLastMine, href,
}: ConversationCardProps) {
  const displayName = partnerName ?? partnerPhone

  return (
    <Link href={href} className="block">
      <div
        className="flex items-center gap-3 px-4 py-3.5 transition-colors"
        style={{
          background:     unreadCount > 0 ? 'rgba(16,185,129,0.04)' : 'transparent',
          borderBottom:   '1px solid var(--border-color)',
        }}
      >
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
        >
          {initials(partnerName, partnerPhone)}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span
              className="text-sm font-semibold truncate"
              style={{ color: unreadCount > 0 ? 'var(--content-primary)' : 'var(--content-secondary)' }}
            >
              {displayName}
            </span>
            <span className="text-[10px] flex-shrink-0 mr-2" style={{ color: 'var(--content-tertiary)' }}>
              {formatTime(lastMessageAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-xs truncate flex-1"
              style={{ color: unreadCount > 0 ? 'var(--content-secondary)' : 'var(--content-tertiary)' }}
            >
              {isLastMine && <span style={{ color: '#10B981' }}>شما: </span>}
              {lastMessage}
            </p>
            {unreadCount > 0 && (
              <span
                className="flex-shrink-0 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#10B981', color: 'white' }}
              >
                {unreadCount > 9 ? '۹+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
