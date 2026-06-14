'use client'

import { useEffect, useState } from 'react'

// ── Types ────────────────────────────────────────────────

interface Challenge {
  id:               string
  title:            string
  description:      string | null
  durationDays:     number
  status:           'upcoming' | 'active' | 'completed'
  participantCount: number
  startsAt:         string
  endsAt:           string
  isJoined:         boolean
  myStreak:         number
  isAnonymous:      boolean
  participantId:    string | null
}

interface LeaderEntry {
  rank:        number
  displayName: string
  streak:      number
  isMe:        boolean
}

interface InspirationPost {
  id:            string
  template:      'book_quote' | 'achievement' | 'gratitude'
  content:       string
  isAnonymous:   boolean
  authorName:    string
  reactionCount: number
  reactions:     { strong: number; growing: number; love: number; fire: number }
  myReaction:    string | null
  createdAt:     string
}

// ── Constants ────────────────────────────────────────────

const TEMPLATES = [
  { key: 'book_quote',   icon: '📖', label: 'برش کتاب',      placeholder: 'یه جمله یا پاراگراف از کتابی که داری می‌خونی...' },
  { key: 'achievement',  icon: '🎉', label: 'جشن دستاورد',   placeholder: 'امروز یه دستاورد کوچک یا بزرگ داشتم...' },
  { key: 'gratitude',    icon: '🌱', label: 'شکرگزاری',       placeholder: 'امروز سپاسگزار این هستم که...' },
] as const

const REACTIONS = [
  { key: 'strong',  emoji: '💪', label: 'دمت گرم' },
  { key: 'growing', emoji: '🌱', label: 'در حال رشد' },
  { key: 'love',    emoji: '🤍', label: 'حس خوب' },
  { key: 'fire',    emoji: '🔥', label: 'پرانرژی' },
] as const

function toPersian(s: string | number) {
  return String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

// ── Main Component ───────────────────────────────────────

export default function TribePage() {
  const [tab, setTab] = useState<'challenges' | 'wall'>('challenges')

  return (
    <div className="max-w-lg mx-auto pb-4">

      {/* Header */}
      <div className="px-4 pt-6 mb-4">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--content-primary)' }}>
          👥 قبیله
        </h1>
        <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>
          با هم‌سفرانت در مسیر رشد
        </p>
      </div>

      {/* Segmented control */}
      <div className="flex mx-4 rounded-xl p-1 mb-4 gap-1" style={{ background: 'var(--surface-secondary)' }}>
        <button
          onClick={() => setTab('challenges')}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: tab === 'challenges' ? 'var(--surface-card)' : 'transparent',
            color:      tab === 'challenges' ? 'var(--content-primary)' : 'var(--content-tertiary)',
          }}
        >
          چالش‌ها 🏆
        </button>
        <button
          onClick={() => setTab('wall')}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: tab === 'wall' ? 'var(--surface-card)' : 'transparent',
            color:      tab === 'wall' ? 'var(--content-primary)' : 'var(--content-tertiary)',
          }}
        >
          جریان رشد 🌊
        </button>
      </div>

      {tab === 'challenges' ? <ChallengesTab /> : <InspirationWall />}
    </div>
  )
}

// ── Challenges Tab ───────────────────────────────────────

function ChallengesTab() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading,    setLoading]    = useState(true)
  const [joinLoading,setJoinLoading]= useState<string | null>(null)
  const [checkinLoading, setCheckinLoading] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<Record<string, LeaderEntry[]>>({})
  const [openLead,   setOpenLead]   = useState<string | null>(null)
  const [anonJoin,   setAnonJoin]   = useState(false)
  const [checkinMsg, setCheckinMsg] = useState<string | null>(null)

  useEffect(() => { fetchChallenges() }, [])

  async function fetchChallenges() {
    setLoading(true)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/challenges', { headers: { Authorization: `Bearer ${token}` } })
      const json  = await res.json()
      if (json.success) setChallenges(json.data)
    } finally {
      setLoading(false)
    }
  }

  async function joinChallenge(id: string) {
    setJoinLoading(id)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch(`/api/challenges/${id}/join`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ isAnonymous: anonJoin }),
      })
      const json = await res.json()
      if (json.success) {
        setChallenges((prev) =>
          prev.map((c) => c.id === id ? { ...c, isJoined: true, participantId: json.data.participantId, isAnonymous: json.data.isAnonymous } : c)
        )
      }
    } finally {
      setJoinLoading(null)
    }
  }

  async function checkin(id: string) {
    setCheckinLoading(id)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch(`/api/challenges/${id}/checkin`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) {
        setChallenges((prev) =>
          prev.map((c) => c.id === id ? { ...c, myStreak: json.data.streak } : c)
        )
        setCheckinMsg(json.data.message)
        setTimeout(() => setCheckinMsg(null), 4000)
      } else {
        setCheckinMsg(json.error?.message ?? 'خطا')
        setTimeout(() => setCheckinMsg(null), 3000)
      }
    } finally {
      setCheckinLoading(null)
    }
  }

  async function fetchLeaderboard(id: string) {
    if (leaderboard[id]) { setOpenLead(openLead === id ? null : id); return }
    const token = localStorage.getItem('mg_token')
    const res   = await fetch(`/api/challenges/${id}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
    const json  = await res.json()
    if (json.success) {
      setLeaderboard((l) => ({ ...l, [id]: json.data }))
    }
    setOpenLead(id)
  }

  const joined = challenges.filter((c) => c.isJoined)
  const available = challenges.filter((c) => !c.isJoined)

  return (
    <div className="px-4 space-y-4">
      {checkinMsg && (
        <div className="rounded-xl p-3 text-sm text-center font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
          {checkinMsg}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2].map((i) => <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: 'var(--surface-secondary)' }} />)}
        </div>
      ) : (
        <>
          {joined.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--content-secondary)' }}>چالش‌های من</p>
              <div className="space-y-3">
                {joined.map((c) => <ChallengeCard key={c.id} challenge={c} onCheckin={checkin} onLeaderboard={fetchLeaderboard} leaderData={leaderboard[c.id]} openLead={openLead} checkinLoading={checkinLoading} />)}
              </div>
            </div>
          )}

          {available.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--content-secondary)' }}>
                {joined.length > 0 ? 'چالش‌های دیگر' : 'چالش‌های فعال'}
              </p>
              <div className="space-y-3">
                {available.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl p-4"
                    style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>{c.title}</p>
                        {c.description && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--content-secondary)' }}>{c.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: c.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                            color:      c.status === 'active' ? '#10B981' : '#F59E0B',
                          }}
                        >
                          {c.status === 'active' ? 'فعال' : 'به‌زودی'}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--content-tertiary)' }}>
                          {toPersian(c.durationDays)} روز
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                        👥 {toPersian(c.participantCount)} نفر
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAnonJoin(!anonJoin)}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
                          style={{ background: 'var(--surface-secondary)', color: 'var(--content-tertiary)' }}
                        >
                          {anonJoin ? '🕶️ ناشناس' : '👤 نام‌دار'}
                        </button>
                        <button
                          onClick={() => joinChallenge(c.id)}
                          disabled={joinLoading === c.id}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold text-white"
                          style={{ background: joinLoading === c.id ? '#374151' : '#10B981' }}
                        >
                          {joinLoading === c.id ? '...' : 'پیوستن'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {challenges.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🏆</p>
              <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>هنوز چالشی تعریف نشده</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ChallengeCard({
  challenge, onCheckin, onLeaderboard, leaderData, openLead, checkinLoading,
}: {
  challenge:      Challenge
  onCheckin:      (id: string) => void
  onLeaderboard:  (id: string) => void
  leaderData?:    LeaderEntry[]
  openLead:       string | null
  checkinLoading: string | null
}) {
  const c = challenge
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-card)', border: '1.5px solid rgba(16,185,129,0.25)' }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>{c.title}</p>
            <p className="text-xs mt-0.5 font-bold" style={{ color: '#F59E0B' }}>🔥 {toPersian(c.myStreak)} روز متوالی</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
            عضو هستی
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onLeaderboard(c.id)}
            className="text-xs px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
          >
            🏅 جدول
          </button>
          <button
            onClick={() => onCheckin(c.id)}
            disabled={checkinLoading === c.id}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: checkinLoading === c.id ? '#374151' : '#10B981' }}
          >
            {checkinLoading === c.id ? '...' : '✅ چک‌این امروز'}
          </button>
        </div>
      </div>

      {openLead === c.id && leaderData && (
        <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px' }}>
          <p className="text-[10px] font-semibold mb-2" style={{ color: 'var(--content-tertiary)' }}>برترین‌ها</p>
          {leaderData.slice(0, 3).map((entry) => (
            <div key={entry.rank} className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <span style={{ color: entry.rank <= 3 ? '#F59E0B' : 'var(--content-tertiary)', fontWeight: 700 }}>
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                </span>
                <span style={{ color: entry.isMe ? '#10B981' : 'var(--content-primary)', fontWeight: entry.isMe ? 700 : 400 }}>
                  {entry.displayName}{entry.isMe ? ' (تو)' : ''}
                </span>
              </div>
              <span style={{ color: '#F59E0B', fontWeight: 700 }}>🔥 {toPersian(entry.streak)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Inspiration Wall ─────────────────────────────────────

function InspirationWall() {
  const [posts,        setPosts]        = useState<InspirationPost[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showCompose,  setShowCompose]  = useState(false)
  const [selTemplate,  setSelTemplate]  = useState<typeof TEMPLATES[number]['key']>('gratitude')
  const [compContent,  setCompContent]  = useState('')
  const [anonPost,     setAnonPost]     = useState(false)
  const [postLoading,  setPostLoading]  = useState(false)
  const [reactLoading, setReactLoading] = useState<string | null>(null)

  useEffect(() => { fetchPosts() }, [])

  async function fetchPosts() {
    setLoading(true)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/inspiration', { headers: { Authorization: `Bearer ${token}` } })
      const json  = await res.json()
      if (json.success) setPosts(json.data)
    } finally {
      setLoading(false)
    }
  }

  async function submitPost() {
    if (!compContent.trim() || compContent.trim().length < 10) return
    setPostLoading(true)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/inspiration', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ template: selTemplate, content: compContent, isAnonymous: anonPost }),
      })
      const json = await res.json()
      if (json.success) {
        setPosts((p) => [json.data, ...p])
        setCompContent('')
        setShowCompose(false)
      }
    } finally {
      setPostLoading(false)
    }
  }

  async function react(postId: string, type: string) {
    if (reactLoading) return
    setReactLoading(postId)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch(`/api/inspiration/${postId}/react`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ type }),
      })
      const json = await res.json()
      if (json.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p
            const newReactions = { ...p.reactions }
            if (!json.data.reacted && p.myReaction) newReactions[p.myReaction as keyof typeof newReactions]--
            if (json.data.reacted && json.data.type) newReactions[json.data.type as keyof typeof newReactions]++
            return { ...p, myReaction: json.data.type, reactionCount: json.data.reactionCount, reactions: newReactions }
          })
        )
      }
    } finally {
      setReactLoading(null)
    }
  }

  const tmpl = TEMPLATES.find((t) => t.key === selTemplate)!

  return (
    <div className="relative">
      {/* FAB */}
      <button
        onClick={() => setShowCompose(true)}
        className="fixed z-30 w-12 h-12 rounded-full text-white font-bold text-xl shadow-lg transition-all active:scale-90"
        style={{
          left:       20,
          bottom:     'calc(80px + env(safe-area-inset-bottom))',
          background: '#8B5CF6',
        }}
      >
        +
      </button>

      <div className="px-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: 'var(--surface-secondary)' }} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🌊</p>
            <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>اولین پست رو بنویس!</p>
          </div>
        ) : (
          posts.map((post) => {
            const t = TEMPLATES.find((x) => x.key === post.template)!
            return (
              <div
                key={post.id}
                className="rounded-2xl p-4"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}
                  >
                    {t.icon} {t.label}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--content-tertiary)' }}>
                    {post.authorName}
                  </span>
                  <span className="text-[10px] mr-auto" style={{ color: 'var(--content-tertiary)' }}>
                    {new Date(post.createdAt).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--content-primary)' }}>
                  {post.content}
                </p>
                {/* Reactions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {REACTIONS.map(({ key, emoji, label }) => {
                    const count  = post.reactions[key]
                    const active = post.myReaction === key
                    return (
                      <button
                        key={key}
                        onClick={() => react(post.id, key)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-all active:scale-90"
                        style={{
                          background: active ? 'rgba(16,185,129,0.15)' : 'var(--surface-secondary)',
                          color:      active ? '#10B981' : 'var(--content-tertiary)',
                          border:     active ? '1.5px solid rgba(16,185,129,0.4)' : '1px solid transparent',
                          fontWeight: active ? 700 : 400,
                        }}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span>{toPersian(count)}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Compose Sheet */}
      {showCompose && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCompose(false) }}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl p-5 pb-10 space-y-4"
            style={{ background: 'var(--surface-card)' }}
          >
            <div className="w-12 h-1.5 rounded-full mx-auto mb-2" style={{ background: 'var(--border-color)' }} />
            <h2 className="text-base font-bold" style={{ color: 'var(--content-primary)' }}>اشتراک‌گذاری در قبیله</h2>

            {/* Template selector */}
            <div className="flex gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSelTemplate(t.key)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: selTemplate === t.key ? 'rgba(139,92,246,0.15)' : 'var(--surface-secondary)',
                    color:      selTemplate === t.key ? '#8B5CF6' : 'var(--content-tertiary)',
                    border:     selTemplate === t.key ? '1.5px solid #8B5CF6' : '1px solid var(--border-color)',
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <textarea
              value={compContent}
              onChange={(e) => setCompContent(e.target.value)}
              placeholder={tmpl.placeholder}
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{
                background: 'var(--surface-secondary)',
                color:      'var(--content-primary)',
                border:     '1px solid var(--border-color)',
                direction:  'rtl',
              }}
            />

            <button
              onClick={() => setAnonPost(!anonPost)}
              className="flex items-center gap-3"
            >
              <div
                className="w-10 h-5 rounded-full relative transition-all"
                style={{ background: anonPost ? '#8B5CF6' : 'var(--surface-secondary)' }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                  style={{ right: anonPost ? '2px' : 'auto', left: anonPost ? 'auto' : '2px' }}
                />
              </div>
              <span className="text-sm" style={{ color: 'var(--content-primary)' }}>
                نمایش ناشناس 🕶️ {anonPost ? '(«یک هم‌سفر»)' : ''}
              </span>
            </button>

            <button
              onClick={submitPost}
              disabled={postLoading || compContent.trim().length < 10}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white"
              style={{ background: postLoading || compContent.trim().length < 10 ? '#374151' : '#8B5CF6' }}
            >
              {postLoading ? 'در حال ارسال...' : '🌊 اشتراک‌گذاری'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
