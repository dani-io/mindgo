'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    fetch('/api/messages/conversations')
      .then((r) => r.json())
      .then((json) => { if (json.success) setConversations(json.data) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      className="max-w-lg mx-auto"
      style={{ background: 'var(--surface-primary)', minHeight: '100dvh' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-4"
        style={{ background: 'var(--surface-primary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <h1 className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>پیام‌ها</h1>
        <div
          className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
        >
          {conversations.filter((c) => c.unreadCount > 0).length > 0
            ? `${conversations.filter((c) => c.unreadCount > 0).length} خوانده نشده`
            : 'همه خوانده شده'}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="px-4 pt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full animate-pulse" style={{ background: 'var(--surface-card)', flexShrink: 0 }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 rounded animate-pulse" style={{ background: 'var(--surface-card)', width: '55%' }} />
                <div className="h-3 rounded animate-pulse"   style={{ background: 'var(--surface-card)', width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 gap-4 px-6">
          <span className="text-6xl">💬</span>
          <p className="text-base font-semibold text-center" style={{ color: 'var(--content-primary)' }}>
            هنوز گفتگویی ندارید
          </p>
          <p className="text-sm text-center" style={{ color: 'var(--content-tertiary)' }}>
            پس از رزرو جلسه می‌توانید با کوچ خود گفتگو کنید
          </p>
          <button
            onClick={() => router.push('/coaches')}
            className="mt-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: '#10B981' }}
          >
            مشاهده کوچ‌ها
          </button>
        </div>
      ) : (
        <div>
          {conversations.map((conv) => (
            <ConversationCard
              key={conv.partnerId}
              {...conv}
              href={`/messages/${conv.partnerId}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
