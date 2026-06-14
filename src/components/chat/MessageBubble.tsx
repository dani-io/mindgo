import React from 'react'

interface MessageBubbleProps {
  content:  string
  sentAt:   string   // ISO string
  isMine:   boolean
  isRead:   boolean
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
    return d.toLocaleDateString('fa-IR', { weekday: 'long' })
  }
  return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
}

export default function MessageBubble({ content, sentAt, isMine, isRead }: MessageBubbleProps) {
  return (
    <div
      className="flex mb-1.5"
      style={{ justifyContent: isMine ? 'flex-end' : 'flex-start' }}
    >
      <div
        className="max-w-[72%] lg:max-w-[55%]"
        style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}
      >
        <div
          className="px-4 py-2.5 text-sm leading-relaxed break-words"
          style={{
            background:   isMine ? '#10B981' : 'var(--surface-card)',
            color:        isMine ? '#fff'    : 'var(--content-primary)',
            borderRadius: isMine
              ? '18px 18px 4px 18px'   // tail bottom-right (sender left side)
              : '18px 18px 18px 4px',  // tail bottom-left (receiver right side)
            border:       isMine ? 'none' : '1px solid var(--border-color)',
          }}
        >
          {content}
        </div>
        <div
          className="flex items-center gap-1 mt-1 px-1"
          style={{ flexDirection: isMine ? 'row-reverse' : 'row' }}
        >
          <span className="text-[10px]" style={{ color: 'var(--content-tertiary)' }}>
            {formatTime(sentAt)}
          </span>
          {isMine && (
            <span className="text-[10px]" style={{ color: isRead ? '#10B981' : 'var(--content-tertiary)' }}>
              {isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
