'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import ChatRoom from '@/components/chat/ChatRoom'

function SupportChat() {
  const params = useSearchParams()
  const uid    = params.get('uid') ?? ''

  if (!uid) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-4xl">🛟</p>
        <p style={{ color: 'var(--content-secondary)' }}>در حال اتصال به پشتیبانی...</p>
      </div>
    )
  }

  return <ChatRoom otherUserId={uid} backHref="/support" />
}

export default function SupportChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><span style={{ color: 'var(--content-tertiary)' }}>...</span></div>}>
      <SupportChat />
    </Suspense>
  )
}
