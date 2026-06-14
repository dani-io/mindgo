'use client'

import { useEffect, useState } from 'react'
import ConversationCard from '@/components/chat/ConversationCard'

interface Conversation {
  partnerId:     string
  partnerName:   string | null
  partnerPhone:  string
  lastMessage:   string
  lastMessageAt: string
  isLastMine:    boolean
  unreadCount:   number
}

export default function CoachMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    fetch('/api/messages/conversations')
      .then((r) => r.json())
      .then((json) => { if (json.success) setConversations(json.data) })
      .finally(() => setLoading(false))
  }, [])

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>پیام‌ها</h1>
        {totalUnread > 0 && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: '#10B981', color: 'white' }}
          >
            {totalUnread} جدید
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--surface-card)' }}>
              <div className="w-11 h-11 rounded-full animate-pulse" style={{ background: 'var(--surface-secondary)', flexShrink: 0 }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded animate-pulse" style={{ background: 'var(--surface-secondary)', width: '50%' }} />
                <div className="h-3 rounded animate-pulse" style={{ background: 'var(--surface-secondary)', width: '75%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>پیامی ندارید</p>
          <p className="text-xs mt-1" style={{ color: 'var(--content-tertiary)' }}>
            رهجوها پس از رزرو می‌توانند با شما گفتگو کنند
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          {conversations.map((conv) => (
            <ConversationCard
              key={conv.partnerId}
              {...conv}
              href={`/coach-messages/${conv.partnerId}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
