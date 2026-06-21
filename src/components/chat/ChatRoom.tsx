'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MessageBubble from './MessageBubble'

// ── Types ─────────────────────────────────────────────────

interface Message {
  id:         string
  content:    string
  senderId:   string
  receiverId: string
  isRead:     boolean
  createdAt:  string
  isMine:     boolean
}

interface OtherUser {
  id:        string
  name:      string | null
  phone:     string
  avatarUrl: string | null
}

interface ChatRoomProps {
  otherUserId: string
  backHref:    string
}

// ── Component ─────────────────────────────────────────────

export default function ChatRoom({ otherUserId, backHref }: ChatRoomProps) {
  const router = useRouter()

  const [messages,  setMessages]  = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [text,      setText]      = useState('')
  const [sending,   setSending]   = useState(false)

  const bottomRef    = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLTextAreaElement>(null)
  const pollingRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const latestIdRef  = useRef<string | null>(null)

  // Auto-scroll to bottom
  // instant=true for initial load (smooth doesn't fire reliably before first paint)
  const scrollToBottom = useCallback((instant = false) => {
    bottomRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' })
  }, [])

  // Load messages (full reload or incremental)
  const loadMessages = useCallback(async (silent = false) => {
    try {
      const res  = await fetch(`/api/messages/conversations/${otherUserId}?limit=100`)
      const json = await res.json()
      if (!json.success) return

      setOtherUser(json.data.otherUser)

      const incoming: Message[] = json.data.messages
      setMessages((prev) => {
        // If nothing changed, don't re-render
        const newestId = incoming[incoming.length - 1]?.id
        if (newestId && newestId === latestIdRef.current) return prev
        latestIdRef.current = newestId ?? null
        return incoming
      })
    } catch { /* silent */ }

    if (!silent) setLoading(false)
  }, [otherUserId])

  // Mark all messages from otherUser as read
  const markRead = useCallback(async () => {
    await fetch('/api/messages/read-all', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ from_user_id: otherUserId }),
    }).catch(() => {/* ignore */})
  }, [otherUserId])

  // Initial load
  useEffect(() => {
    loadMessages().then(() => {
      markRead()
      // Use requestAnimationFrame so the DOM is painted before scrolling
      requestAnimationFrame(() => scrollToBottom(true))
    })

    // Poll every 3 seconds
    pollingRef.current = setInterval(() => {
      loadMessages(true).then(() => scrollToBottom())
      markRead()
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [loadMessages, markRead, scrollToBottom])

  // Smooth-scroll to bottom when new messages arrive after initial load
  useEffect(() => {
    if (!loading) scrollToBottom()
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage() {
    const content = text.trim()
    if (!content || sending) return

    setSending(true)
    setText('')

    // Optimistic add
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id:         tempId,
      content,
      senderId:   'me',
      receiverId: otherUserId,
      isRead:     false,
      createdAt:  new Date().toISOString(),
      isMine:     true,
    }
    setMessages((prev) => [...prev, optimistic])
    setTimeout(scrollToBottom, 40)

    try {
      const res  = await fetch('/api/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ receiver_id: otherUserId, content }),
      })
      const json = await res.json()
      if (json.success) {
        // Replace optimistic with real
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...json.data, isMine: true } : m))
        latestIdRef.current = json.data.id
      } else {
        // Remove optimistic on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        setText(content)
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setText(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function initials(user: OtherUser | null): string {
    if (user?.name) return user.name.trim().charAt(0)
    if (user?.phone) return user.phone.slice(-2)
    return '؟'
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: '100dvh', background: 'var(--surface-primary)', direction: 'rtl' }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{
          height:     56,
          background: 'var(--surface-card)',
          borderBottom: '1px solid var(--border-color)',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.push(backHref)}
          className="p-2 rounded-xl transition-all active:scale-90 flex-shrink-0"
          style={{ background: 'var(--surface-secondary)' }}
          aria-label="بازگشت"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--content-primary)', transform: 'scaleX(-1)' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
        >
          {initials(otherUser)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--content-primary)' }}>
            {otherUser?.name ?? otherUser?.phone ?? '...'}
          </p>
          <p className="text-[10px]" style={{ color: '#10B981' }}>آنلاین</p>
        </div>
      </header>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ overscrollBehavior: 'contain' }}
      >
        {loading ? (
          <div className="flex flex-col gap-3 pt-4">
            {[60, 80, 55, 90, 70].map((w, i) => (
              <div
                key={i}
                className="h-10 rounded-2xl animate-pulse"
                style={{
                  width:      `${w}%`,
                  background: 'var(--surface-card)',
                  alignSelf:  i % 2 === 0 ? 'flex-end' : 'flex-start',
                }}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <span className="text-5xl">💬</span>
            <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>
              اولین پیام را ارسال کنید
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                content={msg.content}
                sentAt={msg.createdAt}
                isMine={msg.isMine}
                isRead={msg.isRead}
              />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 flex items-end gap-2 px-4 py-3"
        style={{
          background:    'var(--surface-card)',
          borderTop:     '1px solid var(--border-color)',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="پیام بنویسید..."
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            // Auto-resize
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none resize-none"
          style={{
            background: 'var(--surface-secondary)',
            border:     '1px solid var(--border-color)',
            color:      'var(--content-primary)',
            lineHeight: '1.5',
            maxHeight:  120,
            minHeight:  44,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: text.trim() && !sending ? '#10B981' : 'var(--surface-secondary)',
            color:      text.trim() && !sending ? 'white'   : 'var(--content-tertiary)',
          }}
          aria-label="ارسال"
        >
          {sending ? (
            <span className="text-base animate-pulse">●</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
