'use client'

export default function CoachSessionsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-5">
      <h1 className="text-xl font-bold mb-5" style={{ color: 'var(--content-primary)' }}>جلسات</h1>
      <div
        className="rounded-xl p-10 text-center"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-4xl mb-3">📅</p>
        <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>به‌زودی...</p>
      </div>
    </div>
  )
}
