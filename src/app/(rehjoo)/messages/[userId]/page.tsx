'use client'

import { useParams } from 'next/navigation'
import ChatRoom from '@/components/chat/ChatRoom'

export default function RehjooMessagePage() {
  const params = useParams()
  const userId = params.userId as string

  return <ChatRoom otherUserId={userId} backHref="/messages" />
}
