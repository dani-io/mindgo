'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  onUploadComplete: (url: string) => void
  folder?:          string
  size?:            number
}

export default function ImageCropper({ onUploadComplete, folder = 'avatars', size = 240 }: Props) {
  const [imageSrc,  setImageSrc]  = useState<string | null>(null)
  const [zoom,      setZoom]      = useState(1)
  const [panX,      setPanX]      = useState(0)
  const [panY,      setPanY]      = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [done,      setDone]      = useState(false)
  const [resultUrl, setResultUrl] = useState('')

  const inputRef  = useRef<HTMLInputElement>(null)
  const imgRef    = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef   = useRef<{ active: boolean; startX: number; startY: number; initPanX: number; initPanY: number }>({
    active: false, startX: 0, startY: 0, initPanX: 0, initPanY: 0,
  })

  function getScale(img: HTMLImageElement) {
    const base = size / Math.min(img.naturalWidth, img.naturalHeight)
    return base * zoom
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (!canvas || !img || !img.naturalWidth) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width  = size
    canvas.height = size

    const scale   = getScale(img)
    const dispW   = img.naturalWidth  * scale
    const dispH   = img.naturalHeight * scale
    const centerX = (size - dispW) / 2 + panX
    const centerY = (size - dispH) / 2 + panY

    ctx.clearRect(0, 0, size, size)
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, centerX, centerY, dispW, dispH)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, panX, panY, size])

  useEffect(() => {
    if (imageSrc) draw()
  }, [imageSrc, draw])

  function onFileSelect(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string)
      setZoom(1)
      setPanX(0)
      setPanY(0)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, initPanX: panX, initPanY: panY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current.active) return
    const { startX, startY, initPanX, initPanY } = dragRef.current
    setPanX(initPanX + (e.clientX - startX))
    setPanY(initPanY + (e.clientY - startY))
  }

  function onPointerUp() { dragRef.current.active = false }

  async function cropAndUpload() {
    const canvas = canvasRef.current
    if (!canvas) return
    draw()
    setUploading(true)
    setError(null)

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('canvas error')),
          'image/jpeg',
          0.92,
        )
      })

      const token = localStorage.getItem('mg_token')
      const presignRes = await fetch('/api/upload/presigned', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    JSON.stringify({ folder, filename: `avatar_${Date.now()}.jpg`, contentType: 'image/jpeg', fileSize: blob.size }),
      })
      const presignJson = await presignRes.json()
      if (!presignJson.success) { setError(presignJson.error?.message ?? 'خطا'); setUploading(false); return }

      const { uploadUrl, fileUrl } = presignJson.data

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject()
        xhr.onerror = () => reject()
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', 'image/jpeg')
        xhr.send(blob)
      })

      setResultUrl(fileUrl)
      setDone(true)
      setImageSrc(null)
      onUploadComplete(fileUrl)
    } catch {
      setError('خطا در آپلود. دوباره تلاش کنید.')
    } finally {
      setUploading(false)
    }
  }

  // ── Done state ──────────────────────────────────────────────

  if (done && resultUrl) {
    return (
      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resultUrl}
          alt="avatar"
          className="rounded-full object-cover"
          style={{ width: size, height: size, border: '3px solid #10B981' }}
        />
        <button
          onClick={() => { setDone(false); setResultUrl(''); onUploadComplete('') }}
          className="text-xs"
          style={{ color: '#EF4444' }}
        >
          تغییر عکس
        </button>
      </div>
    )
  }

  // ── Picker (no image selected yet) ─────────────────────────

  if (!imageSrc) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-full flex items-center justify-center cursor-pointer transition-all hover:opacity-80 active:scale-95"
          style={{
            width:      size,
            height:     size,
            background: 'var(--surface-secondary)',
            border:     '2px dashed var(--border-color)',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <span className="text-4xl">📷</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--content-secondary)' }}>انتخاب عکس</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        />
      </div>
    )
  }

  // ── Crop UI ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>
        بکشید و زوم کنید تا برش دلخواه را انتخاب کنید
      </p>

      {/* Hidden img for drawing */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt=""
        style={{ display: 'none' }}
        onLoad={draw}
      />

      {/* Canvas — circular crop preview */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          borderRadius: '50%',
          cursor:       'grab',
          touchAction:  'none',
          border:       '3px solid #10B981',
        }}
      />

      {/* Zoom slider */}
      <div className="flex items-center gap-3 w-full max-w-xs">
        <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>🔍−</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: '#10B981' }}
        />
        <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>+</span>
      </div>

      {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}

      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={cropAndUpload}
          disabled={uploading}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: uploading ? '#6B7280' : '#10B981' }}
        >
          {uploading ? 'آپلود...' : 'برش و ذخیره'}
        </button>
        <button
          onClick={() => { setImageSrc(null); setZoom(1); setPanX(0); setPanY(0) }}
          className="py-2.5 px-4 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
        >
          لغو
        </button>
      </div>
    </div>
  )
}
