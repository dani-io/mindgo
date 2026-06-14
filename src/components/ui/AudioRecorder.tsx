'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onUploadComplete: (url: string) => void
  folder?:          string
  maxSeconds?:      number
}

type State = 'idle' | 'recording' | 'preview' | 'uploading' | 'done'

function toPersian(n: number) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${toPersian(m)}:${toPersian(s).padStart(2, '۰')}`
}

export default function AudioRecorder({ onUploadComplete, folder = 'voice-intros', maxSeconds = 120 }: Props) {
  const [state,     setState]    = useState<State>('idle')
  const [elapsed,   setElapsed]  = useState(0)
  const [blobUrl,   setBlobUrl]  = useState<string | null>(null)
  const [error,     setError]    = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const mediaRef    = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<Blob[]>([])
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url  = URL.createObjectURL(blob)
        setBlobUrl(url)
        setState('preview')
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start(200)
      mediaRef.current = recorder
      setElapsed(0)
      setState('recording')

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= maxSeconds) {
            stopRecording()
            return prev + 1
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      setError('دسترسی به میکروفون رد شد. لطفاً مجوز را فعال کنید.')
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    mediaRef.current?.stop()
    mediaRef.current = null
  }

  function discard() {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setBlobUrl(null)
    setElapsed(0)
    setState('idle')
  }

  async function confirmAndUpload() {
    if (!blobUrl) return
    setState('uploading')
    setError(null)

    try {
      const blobRes  = await fetch(blobUrl)
      const blob     = await blobRes.blob()
      const filename = `recording_${Date.now()}.webm`
      const token    = localStorage.getItem('mg_token')

      const presignRes = await fetch('/api/upload/presigned', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    JSON.stringify({ folder, filename, contentType: 'audio/webm', fileSize: blob.size }),
      })
      const presignJson = await presignRes.json()
      if (!presignJson.success) {
        setError(presignJson.error?.message ?? 'خطا')
        setState('preview')
        return
      }

      const { uploadUrl, fileUrl } = presignJson.data

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject()
        xhr.onerror = () => reject()
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', 'audio/webm')
        xhr.send(blob)
      })

      URL.revokeObjectURL(blobUrl)
      setBlobUrl(null)
      setUploadedUrl(fileUrl)
      setState('done')
      onUploadComplete(fileUrl)
    } catch {
      setError('خطا در آپلود. دوباره تلاش کنید.')
      setState('preview')
    }
  }

  function reset() {
    setUploadedUrl(null)
    setState('idle')
    setElapsed(0)
    onUploadComplete('')
  }

  // ── Render ─────────────────────────────────────────────────

  if (state === 'done' && uploadedUrl) {
    return (
      <div className="flex flex-col gap-3">
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <span className="text-2xl flex-shrink-0">🎙️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#10B981' }}>✓ صدا آپلود شد</p>
            <audio controls src={uploadedUrl} className="w-full mt-2" />
          </div>
        </div>
        <button onClick={reset} className="text-xs self-start" style={{ color: '#EF4444' }}>ضبط مجدد</button>
      </div>
    )
  }

  if (state === 'preview' && blobUrl) {
    return (
      <div className="flex flex-col gap-3">
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-primary)' }}>
            پیش‌نمایش · {fmtTime(elapsed)}
          </p>
          <audio controls src={blobUrl} className="w-full" />
        </div>
        {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={confirmAndUpload}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#10B981' }}
          >
            ✓ تأیید و آپلود
          </button>
          <button
            onClick={discard}
            className="py-2.5 px-4 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
          >
            ضبط مجدد
          </button>
        </div>
      </div>
    )
  }

  if (state === 'uploading') {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <span className="text-3xl">📤</span>
        <p className="text-sm" style={{ color: 'var(--content-secondary)' }}>در حال آپلود...</p>
      </div>
    )
  }

  const isRecording = state === 'recording'
  const remaining   = maxSeconds - elapsed

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Record button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className="w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95"
        style={{
          background: isRecording ? '#EF4444' : '#10B981',
          boxShadow:  isRecording ? '0 0 0 6px rgba(239,68,68,0.25)' : '0 0 0 6px rgba(16,185,129,0.2)',
        }}
      >
        <span className="text-3xl">{isRecording ? '⏹️' : '🎙️'}</span>
      </button>

      {/* Status */}
      {isRecording ? (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold" style={{ color: '#EF4444' }}>در حال ضبط</span>
          </div>
          <span className="text-lg font-bold" style={{ color: 'var(--content-primary)' }}>{fmtTime(elapsed)}</span>
          <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
            {toPersian(remaining)} ثانیه مانده
          </span>
        </div>
      ) : (
        <p className="text-sm text-center" style={{ color: 'var(--content-secondary)' }}>
          دکمه را بزنید و شروع به صحبت کنید<br />
          <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
            حداکثر {toPersian(Math.floor(maxSeconds / 60))} دقیقه
          </span>
        </p>
      )}

      {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  )
}
