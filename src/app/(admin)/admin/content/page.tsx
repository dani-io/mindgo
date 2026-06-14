'use client'

import { useEffect, useState, useCallback } from 'react'

type ContentType = 'podcast' | 'video' | 'book_summary'
type ExerciseType = 'meditation' | 'breathing' | 'planning'

interface ContentItem {
  id:             string
  title:          string
  type:           ContentType
  category:       string
  durationMinutes: number
  author:         string | null
  isPublished:    boolean
  viewCount:      number
  createdAt:      string
}

interface ExerciseItem {
  id:             string
  title:          string
  type:           ExerciseType
  difficulty:     string
  durationMinutes: number
  isPublished:    boolean
  createdAt:      string
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  podcast:      '🎧 پادکست',
  video:        '🎬 ویدیو',
  book_summary: '📚 خلاصه کتاب',
}

const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  meditation: '🧘 مدیتیشن',
  breathing:  '🌬️ تنفسی',
  planning:   '📋 برنامه‌ریزی',
}

const DIFF_LABELS: Record<string, string> = {
  beginner:     'مبتدی',
  intermediate: 'متوسط',
  advanced:     'پیشرفته',
}

function toPersian(n: number) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('mg_token') : null
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

type Tab = 'content' | 'exercises'

export default function AdminContentPage() {
  const [tab,       setTab]       = useState<Tab>('content')
  const [contents,  setContents]  = useState<ContentItem[]>([])
  const [exercises, setExercises] = useState<ExerciseItem[]>([])
  const [loading,   setLoading]   = useState(true)

  // Content form
  const [showContentForm, setShowContentForm] = useState(false)
  const [editContent,     setEditContent]     = useState<ContentItem | null>(null)
  const [cTitle,    setCTitle]    = useState('')
  const [cDesc,     setCDesc]     = useState('')
  const [cType,     setCType]     = useState<ContentType>('podcast')
  const [cCat,      setCCat]      = useState('')
  const [cDur,      setCDur]      = useState('5')
  const [cAuthor,   setCAuthor]   = useState('')
  const [cMedia,    setCMedia]    = useState('')
  const [cThumb,    setCThumb]    = useState('')
  const [cPub,      setCPub]      = useState(false)
  const [cSaving,   setCSaving]   = useState(false)

  // Exercise form
  const [showExForm, setShowExForm] = useState(false)
  const [editEx,     setEditEx]     = useState<ExerciseItem | null>(null)
  const [eTitle,    setETitle]    = useState('')
  const [eDesc,     setEDesc]     = useState('')
  const [eType,     setEType]     = useState<ExerciseType>('meditation')
  const [eDur,      setEDur]      = useState('10')
  const [eDiff,     setEDiff]     = useState('beginner')
  const [eAudio,    setEAudio]    = useState('')
  const [eSteps,    setESteps]    = useState('')
  const [ePub,      setEPub]      = useState(false)
  const [eSaving,   setESaving]   = useState(false)

  const loadContents = useCallback(async () => {
    const token = getToken()
    if (!token) return
    const res  = await fetch('/api/content?limit=50', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.success) setContents(json.data)
  }, [])

  const loadExercises = useCallback(async () => {
    const token = getToken()
    if (!token) return
    const res  = await fetch('/api/exercises?limit=50', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.success) setExercises(json.data)
  }, [])

  useEffect(() => {
    Promise.all([loadContents(), loadExercises()]).finally(() => setLoading(false))
  }, [loadContents, loadExercises])

  function openContentForm(item?: ContentItem) {
    setEditContent(item ?? null)
    setCTitle(item?.title ?? '')
    setCDesc('')
    setCType(item?.type ?? 'podcast')
    setCCat(item?.category ?? '')
    setCDur(String(item?.durationMinutes ?? 5))
    setCAuthor(item?.author ?? '')
    setCMedia('')
    setCThumb('')
    setCPub(item?.isPublished ?? false)
    setShowContentForm(true)
  }

  async function saveContent() {
    const token = getToken()
    if (!token || !cTitle || !cCat) return
    setCSaving(true)
    const body = {
      title: cTitle, description: cDesc || undefined, type: cType,
      durationMinutes: parseInt(cDur) || 5, category: cCat,
      author: cAuthor || undefined, mediaUrl: cMedia || undefined,
      thumbnailUrl: cThumb || undefined, isPublished: cPub,
    }
    const url    = editContent ? `/api/content/${editContent.id}` : '/api/content'
    const method = editContent ? 'PATCH' : 'POST'
    const res    = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(body) })
    if (res.ok) {
      await loadContents()
      setShowContentForm(false)
    }
    setCSaving(false)
  }

  async function toggleContentPublish(item: ContentItem) {
    const token = getToken()
    if (!token) return
    await fetch(`/api/content/${item.id}`, {
      method:  'PATCH',
      headers: authHeaders(token),
      body:    JSON.stringify({ isPublished: !item.isPublished }),
    })
    await loadContents()
  }

  async function deleteContent(id: string) {
    if (!confirm('حذف شود؟')) return
    const token = getToken()
    if (!token) return
    await fetch(`/api/content/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    await loadContents()
  }

  function openExForm(item?: ExerciseItem) {
    setEditEx(item ?? null)
    setETitle(item?.title ?? '')
    setEDesc('')
    setEType(item?.type ?? 'meditation')
    setEDur(String(item?.durationMinutes ?? 10))
    setEDiff(item?.difficulty ?? 'beginner')
    setEAudio('')
    setESteps('')
    setEPub(item?.isPublished ?? false)
    setShowExForm(true)
  }

  async function saveExercise() {
    const token = getToken()
    if (!token || !eTitle) return
    setESaving(true)
    const steps = eSteps.split('\n').map((s) => s.trim()).filter(Boolean)
    const body = {
      title: eTitle, description: eDesc || undefined, type: eType,
      durationMinutes: parseInt(eDur) || 10, difficulty: eDiff,
      audioUrl: eAudio || undefined, steps, isPublished: ePub,
    }
    const url    = editEx ? `/api/exercises/${editEx.id}` : '/api/exercises'
    const method = editEx ? 'PATCH' : 'POST'
    const res    = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(body) })
    if (res.ok) {
      await loadExercises()
      setShowExForm(false)
    }
    setESaving(false)
  }

  async function toggleExPublish(item: ExerciseItem) {
    const token = getToken()
    if (!token) return
    await fetch(`/api/exercises/${item.id}`, {
      method:  'PATCH',
      headers: authHeaders(token),
      body:    JSON.stringify({ isPublished: !item.isPublished }),
    })
    await loadExercises()
  }

  async function deleteExercise(id: string) {
    if (!confirm('حذف شود؟')) return
    const token = getToken()
    if (!token) return
    await fetch(`/api/exercises/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    await loadExercises()
  }

  const inputStyle = {
    background: 'var(--surface-secondary)',
    border:     '1px solid var(--border-color)',
    color:      'var(--content-primary)',
    borderRadius: 10,
    padding:    '10px 12px',
    width:      '100%',
    fontSize:   14,
    outline:    'none',
  }

  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--content-secondary)', display: 'block', marginBottom: 6 }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>مدیریت محتوا</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
            {toPersian(contents.length)} محتوا · {toPersian(exercises.length)} تمرین
          </p>
        </div>
        <button
          onClick={() => tab === 'content' ? openContentForm() : openExForm()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: '#10B981' }}
        >
          + افزودن {tab === 'content' ? 'محتوا' : 'تمرین'}
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex rounded-xl overflow-hidden mb-6 p-1"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', display: 'inline-flex' }}
      >
        {(['content', 'exercises'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === t ? '#10B981' : 'transparent',
              color:      tab === t ? 'white' : 'var(--content-secondary)',
            }}
          >
            {t === 'content' ? '📖 دوز آگاهی' : '🌿 تمرینات'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--surface-card)' }} />
          ))}
        </div>
      ) : tab === 'content' ? (

        /* Content table */
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          {contents.length === 0 ? (
            <div className="p-10 text-center" style={{ background: 'var(--surface-card)' }}>
              <p style={{ color: 'var(--content-tertiary)' }}>هنوز محتوایی اضافه نشده</p>
            </div>
          ) : contents.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4"
              style={{
                background:   'var(--surface-card)',
                borderBottom: i < contents.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>{item.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                    {CONTENT_TYPE_LABELS[item.type]}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{item.category}</span>
                  <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                    👁 {toPersian(item.viewCount)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleContentPublish(item)}
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{
                    background: item.isPublished ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color:      item.isPublished ? '#10B981' : '#EF4444',
                  }}
                >
                  {item.isPublished ? 'منتشر' : 'پیش‌نویس'}
                </button>
                <button
                  onClick={() => openContentForm(item)}
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
                >
                  ویرایش
                </button>
                <button
                  onClick={() => deleteContent(item.id)}
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>

      ) : (

        /* Exercise table */
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          {exercises.length === 0 ? (
            <div className="p-10 text-center" style={{ background: 'var(--surface-card)' }}>
              <p style={{ color: 'var(--content-tertiary)' }}>هنوز تمرینی اضافه نشده</p>
            </div>
          ) : exercises.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4"
              style={{
                background:   'var(--surface-card)',
                borderBottom: i < exercises.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>{item.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                    {EXERCISE_TYPE_LABELS[item.type]}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                    {DIFF_LABELS[item.difficulty]}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                    {toPersian(item.durationMinutes)} دقیقه
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleExPublish(item)}
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{
                    background: item.isPublished ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color:      item.isPublished ? '#10B981' : '#EF4444',
                  }}
                >
                  {item.isPublished ? 'منتشر' : 'پیش‌نویس'}
                </button>
                <button
                  onClick={() => openExForm(item)}
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
                >
                  ویرایش
                </button>
                <button
                  onClick={() => deleteExercise(item.id)}
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content form modal */}
      {showContentForm && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowContentForm(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl lg:rounded-3xl p-6 pb-8"
            style={{ background: 'var(--surface-card)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-base mb-5" style={{ color: 'var(--content-primary)' }}>
              {editContent ? 'ویرایش محتوا' : 'افزودن محتوا'}
            </h2>
            <div className="space-y-4">
              <div>
                <label style={labelStyle}>عنوان *</label>
                <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} style={inputStyle} placeholder="عنوان محتوا" />
              </div>
              <div>
                <label style={labelStyle}>توضیحات</label>
                <textarea value={cDesc} onChange={(e) => setCDesc(e.target.value)} style={{ ...inputStyle, resize: 'none' }} rows={3} placeholder="توضیح کوتاه" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>نوع *</label>
                  <select value={cType} onChange={(e) => setCType(e.target.value as ContentType)} style={inputStyle}>
                    <option value="podcast">پادکست</option>
                    <option value="video">ویدیو</option>
                    <option value="book_summary">خلاصه کتاب</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>مدت (دقیقه)</label>
                  <input value={cDur} onChange={(e) => setCDur(e.target.value)} style={inputStyle} type="number" min="1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>دسته‌بندی *</label>
                  <input value={cCat} onChange={(e) => setCCat(e.target.value)} style={inputStyle} placeholder="لایف کوچینگ" />
                </div>
                <div>
                  <label style={labelStyle}>نویسنده/گوینده</label>
                  <input value={cAuthor} onChange={(e) => setCAuthor(e.target.value)} style={inputStyle} placeholder="نام" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>لینک رسانه</label>
                <input value={cMedia} onChange={(e) => setCMedia(e.target.value)} style={inputStyle} placeholder="https://..." />
              </div>
              <div>
                <label style={labelStyle}>لینک تصویر بند انگشتی</label>
                <input value={cThumb} onChange={(e) => setCThumb(e.target.value)} style={inputStyle} placeholder="https://..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={cPub} onChange={(e) => setCPub(e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--content-secondary)' }}>منتشر شود</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveContent}
                  disabled={cSaving || !cTitle || !cCat}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: cSaving ? '#6B7280' : '#10B981' }}
                >
                  {cSaving ? 'ذخیره...' : 'ذخیره'}
                </button>
                <button
                  onClick={() => setShowContentForm(false)}
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

      {/* Exercise form modal */}
      {showExForm && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowExForm(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl lg:rounded-3xl p-6 pb-8"
            style={{ background: 'var(--surface-card)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-base mb-5" style={{ color: 'var(--content-primary)' }}>
              {editEx ? 'ویرایش تمرین' : 'افزودن تمرین'}
            </h2>
            <div className="space-y-4">
              <div>
                <label style={labelStyle}>عنوان *</label>
                <input value={eTitle} onChange={(e) => setETitle(e.target.value)} style={inputStyle} placeholder="عنوان تمرین" />
              </div>
              <div>
                <label style={labelStyle}>توضیحات</label>
                <textarea value={eDesc} onChange={(e) => setEDesc(e.target.value)} style={{ ...inputStyle, resize: 'none' }} rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={labelStyle}>نوع *</label>
                  <select value={eType} onChange={(e) => setEType(e.target.value as ExerciseType)} style={inputStyle}>
                    <option value="meditation">مدیتیشن</option>
                    <option value="breathing">تنفسی</option>
                    <option value="planning">برنامه‌ریزی</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>سطح</label>
                  <select value={eDiff} onChange={(e) => setEDiff(e.target.value)} style={inputStyle}>
                    <option value="beginner">مبتدی</option>
                    <option value="intermediate">متوسط</option>
                    <option value="advanced">پیشرفته</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>مدت (دقیقه)</label>
                  <input value={eDur} onChange={(e) => setEDur(e.target.value)} style={inputStyle} type="number" min="1" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>لینک فایل صوتی</label>
                <input value={eAudio} onChange={(e) => setEAudio(e.target.value)} style={inputStyle} placeholder="https://..." />
              </div>
              <div>
                <label style={labelStyle}>مراحل اجرا (هر مرحله در یک خط)</label>
                <textarea
                  value={eSteps}
                  onChange={(e) => setESteps(e.target.value)}
                  style={{ ...inputStyle, resize: 'none' }}
                  rows={5}
                  placeholder={`مرحله اول\nمرحله دوم\nمرحله سوم`}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ePub} onChange={(e) => setEPub(e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--content-secondary)' }}>منتشر شود</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveExercise}
                  disabled={eSaving || !eTitle}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: eSaving ? '#6B7280' : '#10B981' }}
                >
                  {eSaving ? 'ذخیره...' : 'ذخیره'}
                </button>
                <button
                  onClick={() => setShowExForm(false)}
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
    </div>
  )
}
