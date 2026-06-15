'use client'

import { useCallback, useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────

interface Challenge {
  id:               string
  title:            string
  description:      string | null
  durationDays:     number
  status:           'upcoming' | 'active' | 'completed'
  participantCount: number
  startsAt:         string
  endsAt:           string
}

interface Participant {
  rank:          number
  id:            string
  currentStreak: number
  isAnonymous:   boolean
  joinedAt:      string
  user:          { id: string; name: string | null; phone: string } | null
}

interface InspirationPost {
  id:            string
  content:       string
  template:      string
  isAnonymous:   boolean
  isVisible:     boolean
  reactionCount: number
  createdAt:     string
  user:          { id: string; name: string | null; phone: string } | null
}

type ChallengeStatus = 'upcoming' | 'active' | 'completed'
type InspirationFilter = 'all' | 'visible' | 'hidden'
type Tab = 'challenges' | 'inspiration'

// ── Constants ─────────────────────────────────────────────

const STATUS_LABELS: Record<ChallengeStatus, string> = { upcoming: 'پیش‌رو', active: 'فعال', completed: 'پایان‌یافته' }
const STATUS_COLORS: Record<ChallengeStatus, string> = { upcoming: '#3B82F6', active: '#10B981', completed: '#94A3B8' }

const TEMPLATE_LABELS: Record<string, string> = {
  book_quote:   '📚 نقل‌قول کتاب',
  achievement:  '🏆 دستاورد',
  gratitude:    '🙏 قدردانی',
}

function toPersian(n: number | string) { return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]) }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }) }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('mg_token') : null }
function authHeaders(token: string) { return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }

// ── Page ──────────────────────────────────────────────────

export default function AdminTribePage() {
  const [tab, setTab] = useState<Tab>('challenges')

  // Challenges state
  const [challenges,    setChallenges]    = useState<Challenge[]>([])
  const [chLoading,     setChLoading]     = useState(true)
  const [showChForm,    setShowChForm]    = useState(false)
  const [editCh,        setEditCh]        = useState<Challenge | null>(null)
  const [chTitle,       setChTitle]       = useState('')
  const [chDesc,        setChDesc]        = useState('')
  const [chDays,        setChDays]        = useState('30')
  const [chStart,       setChStart]       = useState('')
  const [chSaving,      setChSaving]      = useState(false)
  const [confirmDelCh,  setConfirmDelCh]  = useState<Challenge | null>(null)
  const [showParticipants, setShowParticipants] = useState<Challenge | null>(null)
  const [participants,     setParticipants]     = useState<Participant[]>([])
  const [pLoading,         setPLoading]         = useState(false)

  // Inspiration state
  const [posts,        setPosts]        = useState<InspirationPost[]>([])
  const [postFilter,   setPostFilter]   = useState<InspirationFilter>('all')
  const [inLoading,    setInLoading]    = useState(true)
  const [inPage,       setInPage]       = useState(1)
  const [inTotal,      setInTotal]      = useState(0)

  // ── Data loading ──────────────────────────────────────────

  const loadChallenges = useCallback(async () => {
    setChLoading(true)
    const token = getToken()
    try {
      const res  = await fetch('/api/admin/challenges', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) setChallenges(json.data)
    } finally { setChLoading(false) }
  }, [])

  const loadPosts = useCallback(async (filter: InspirationFilter, page: number) => {
    setInLoading(true)
    const token = getToken()
    const params = new URLSearchParams({ filter, page: String(page), limit: '20' })
    try {
      const res  = await fetch(`/api/admin/inspiration?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) { setPosts(json.data.posts); setInTotal(json.data.total) }
    } finally { setInLoading(false) }
  }, [])

  useEffect(() => { loadChallenges() }, [loadChallenges])
  useEffect(() => { loadPosts(postFilter, inPage) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Challenge CRUD ────────────────────────────────────────

  function openChForm(c?: Challenge) {
    setEditCh(c ?? null)
    setChTitle(c?.title ?? '')
    setChDesc(c?.description ?? '')
    setChDays(String(c?.durationDays ?? 30))
    setChStart(c ? c.startsAt.slice(0, 10) : '')
    setShowChForm(true)
  }

  async function saveCh() {
    if (!chTitle.trim() || !chStart) return
    setChSaving(true)
    const token = getToken()
    const body = JSON.stringify({ title: chTitle, description: chDesc || undefined, durationDays: parseInt(chDays) || 30, startsAt: chStart })
    try {
      if (editCh) {
        await fetch(`/api/admin/challenges/${editCh.id}`, { method: 'PATCH', headers: authHeaders(token!), body })
      } else {
        await fetch('/api/admin/challenges', { method: 'POST', headers: authHeaders(token!), body })
      }
      setShowChForm(false)
      await loadChallenges()
    } finally { setChSaving(false) }
  }

  async function deleteCh(c: Challenge) {
    const token = getToken()
    await fetch(`/api/admin/challenges/${c.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setConfirmDelCh(null)
    loadChallenges()
  }

  async function changeStatus(c: Challenge, status: ChallengeStatus) {
    const token = getToken()
    await fetch(`/api/admin/challenges/${c.id}`, {
      method: 'PATCH', headers: authHeaders(token!), body: JSON.stringify({ status }),
    })
    loadChallenges()
  }

  async function loadParticipants(c: Challenge) {
    setShowParticipants(c)
    setPLoading(true)
    const token = getToken()
    try {
      const res  = await fetch(`/api/admin/challenges/${c.id}/participants`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) setParticipants(json.data.participants)
    } finally { setPLoading(false) }
  }

  // ── Inspiration actions ───────────────────────────────────

  async function toggleVisibility(post: InspirationPost) {
    const token = getToken()
    const res = await fetch(`/api/admin/inspiration/${post.id}/visibility`, {
      method: 'PATCH', headers: authHeaders(token!), body: JSON.stringify({ isVisible: !post.isVisible }),
    })
    const json = await res.json()
    if (json.success) setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, isVisible: !p.isVisible } : p))
  }

  async function deletePost(post: InspirationPost) {
    if (!confirm('پست حذف شود؟')) return
    const token = getToken()
    const res = await fetch(`/api/admin/inspiration/${post.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== post.id))
  }

  function changeFilter(f: InspirationFilter) {
    setPostFilter(f)
    setInPage(1)
    loadPosts(f, 1)
  }

  // ── Styles ────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-secondary)', border: '1px solid var(--border-color)',
    color: 'var(--content-primary)', borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--content-secondary)', display: 'block', marginBottom: 6 }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>مدیریت قبیله 🌿</h1>
        {tab === 'challenges' && (
          <button
            onClick={() => openChForm()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#10B981' }}
          >
            + ساخت چالش جدید
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
        {([
          { value: 'challenges',  label: '🏆 چالش‌ها'          },
          { value: 'inspiration', label: '💡 بورد الهام‌بخش'   },
        ] as { value: Tab; label: string }[]).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="px-5 py-2.5 text-sm font-semibold transition-all"
            style={{
              color:        tab === t.value ? '#10B981' : 'var(--content-secondary)',
              borderBottom: tab === t.value ? '2px solid #10B981' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Challenges Tab ───────────────────────────────── */}
      {tab === 'challenges' && (
        <>
          {chLoading ? (
            <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />)}</div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🏆</p>
              <p style={{ color: 'var(--content-tertiary)' }}>هنوز چالشی تعریف نشده</p>
            </div>
          ) : (
            <div className="space-y-3">
              {challenges.map((c) => (
                <div key={c.id} className="rounded-2xl p-4" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm" style={{ color: 'var(--content-primary)' }}>{c.title}</h3>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: `${STATUS_COLORS[c.status]}20`, color: STATUS_COLORS[c.status] }}
                        >
                          {STATUS_LABELS[c.status]}
                        </span>
                      </div>
                      {c.description && <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--content-secondary)' }}>{c.description}</p>}
                      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--content-tertiary)' }}>
                        <span>👥 {toPersian(c.participantCount)} شرکت‌کننده</span>
                        <span>📅 {toPersian(c.durationDays)} روز</span>
                        <span>{fmtDate(c.startsAt)} — {fmtDate(c.endsAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadParticipants(c)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                          style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}
                        >
                          شرکت‌کنندگان
                        </button>
                        <button
                          onClick={() => openChForm(c)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                          style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => setConfirmDelCh(c)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
                        >
                          حذف
                        </button>
                      </div>
                      {/* Status change */}
                      <div className="flex gap-1">
                        {(['upcoming', 'active', 'completed'] as ChallengeStatus[]).filter((s) => s !== c.status).map((s) => (
                          <button
                            key={s}
                            onClick={() => changeStatus(c, s)}
                            className="text-[10px] px-2 py-1 rounded-lg"
                            style={{ background: `${STATUS_COLORS[s]}15`, color: STATUS_COLORS[s] }}
                          >
                            → {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Inspiration Tab ──────────────────────────────── */}
      {tab === 'inspiration' && (
        <>
          <div className="flex gap-2 mb-4">
            {([
              { value: 'all', label: 'همه' }, { value: 'visible', label: 'نمایش' }, { value: 'hidden', label: 'پنهان' },
            ] as { value: InspirationFilter; label: string }[]).map((f) => (
              <button
                key={f.value}
                onClick={() => changeFilter(f.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: postFilter === f.value ? '#10B981' : 'var(--surface-card)',
                  color:      postFilter === f.value ? 'white' : 'var(--content-secondary)',
                  border:     '1px solid var(--border-color)',
                }}
              >
                {f.label}
              </button>
            ))}
            <span className="text-xs self-center mr-auto" style={{ color: 'var(--content-tertiary)' }}>{toPersian(inTotal)} پست</span>
          </div>

          {inLoading ? (
            <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />)}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">💡</p>
              <p style={{ color: 'var(--content-tertiary)' }}>پستی یافت نشد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: 'var(--surface-card)',
                    border:     `1px solid ${post.isVisible ? 'var(--border-color)' : 'rgba(239,68,68,0.3)'}`,
                    opacity:    post.isVisible ? 1 : 0.7,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold" style={{ color: 'var(--content-tertiary)' }}>
                          {post.isAnonymous ? 'ناشناس' : (post.user?.name ?? post.user?.phone ?? '?')}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}
                        >
                          {TEMPLATE_LABELS[post.template] ?? post.template}
                        </span>
                        {!post.isVisible && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>پنهان</span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--content-primary)' }}>{post.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--content-tertiary)' }}>
                        <span>❤️ {toPersian(post.reactionCount)}</span>
                        <span>{fmtDate(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleVisibility(post)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                        style={{
                          background: post.isVisible ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                          color:      post.isVisible ? '#EF4444' : '#10B981',
                        }}
                      >
                        {post.isVisible ? 'پنهان کردن' : 'نمایش دادن'}
                      </button>
                      <button
                        onClick={() => deletePost(post)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {inTotal > 20 && (
            <div className="flex justify-center gap-2 mt-5">
              {inPage > 1 && (
                <button onClick={() => { const p = inPage - 1; setInPage(p); loadPosts(postFilter, p) }}
                  className="px-4 py-2 rounded-xl text-sm" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--content-secondary)' }}>
                  قبلی
                </button>
              )}
              <span className="px-4 py-2 text-sm" style={{ color: 'var(--content-tertiary)' }}>
                {toPersian(inPage)} / {toPersian(Math.ceil(inTotal / 20))}
              </span>
              {inPage < Math.ceil(inTotal / 20) && (
                <button onClick={() => { const p = inPage + 1; setInPage(p); loadPosts(postFilter, p) }}
                  className="px-4 py-2 rounded-xl text-sm" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--content-secondary)' }}>
                  بعدی
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Challenge form modal ──────────────────────────── */}
      {showChForm && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowChForm(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl lg:rounded-3xl p-6 pb-8"
            style={{ background: 'var(--surface-card)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-base mb-5" style={{ color: 'var(--content-primary)' }}>
              {editCh ? 'ویرایش چالش' : 'ساخت چالش جدید'}
            </h2>
            <div className="space-y-4">
              <div>
                <label style={labelStyle}>عنوان *</label>
                <input value={chTitle} onChange={(e) => setChTitle(e.target.value)} style={inputStyle} placeholder="مثال: چالش ۳۰ روز مدیتیشن" />
              </div>
              <div>
                <label style={labelStyle}>توضیحات</label>
                <textarea value={chDesc} onChange={(e) => setChDesc(e.target.value)} style={{ ...inputStyle, resize: 'none' }} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>تعداد روز</label>
                  <input type="number" min={1} max={365} value={chDays} onChange={(e) => setChDays(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>تاریخ شروع</label>
                  <input type="date" value={chStart} onChange={(e) => setChStart(e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveCh}
                  disabled={chSaving || !chTitle.trim() || !chStart}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: chSaving ? '#6B7280' : '#10B981' }}
                >
                  {chSaving ? 'ذخیره...' : 'ذخیره'}
                </button>
                <button
                  onClick={() => setShowChForm(false)}
                  className="py-3 px-5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Participants modal ────────────────────────────── */}
      {showParticipants && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowParticipants(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl lg:rounded-3xl p-6 pb-8"
            style={{ background: 'var(--surface-card)', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-base mb-5" style={{ color: 'var(--content-primary)' }}>
              شرکت‌کنندگان: {showParticipants.title}
            </h2>
            {pLoading ? (
              <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--surface-secondary)' }} />)}</div>
            ) : participants.length === 0 ? (
              <p className="text-center py-8" style={{ color: 'var(--content-tertiary)' }}>هنوز کسی شرکت نکرده</p>
            ) : (
              <div className="space-y-2">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <span className="text-sm font-bold w-6 flex-shrink-0" style={{ color: 'var(--content-tertiary)' }}>{toPersian(p.rank)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
                        {p.isAnonymous ? 'ناشناس' : (p.user?.name ?? p.user?.phone ?? '?')}
                      </p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: '#10B981' }}>🔥 {toPersian(p.currentStreak)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ──────────────────────────── */}
      {confirmDelCh && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setConfirmDelCh(null)}
        >
          <div
            className="w-full max-w-xs rounded-3xl p-6 text-center"
            style={{ background: 'var(--surface-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-4xl mb-3">⚠️</p>
            <h3 className="font-bold mb-2" style={{ color: 'var(--content-primary)' }}>حذف چالش</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--content-secondary)' }}>
              «{confirmDelCh.title}» و همه شرکت‌کنندگان آن حذف می‌شوند.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteCh(confirmDelCh)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background: '#EF4444' }}
              >
                بله، حذف
              </button>
              <button
                onClick={() => setConfirmDelCh(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
