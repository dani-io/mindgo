'use client'

import { useRef, useState } from 'react'

interface Props {
  folder:           string
  maxSize?:         number
  acceptedTypes?:   string[]
  onUploadComplete: (url: string) => void
  label?:           string
  currentUrl?:      string
}

export default function FileUpload({
  folder,
  maxSize = 10 * 1024 * 1024,
  acceptedTypes,
  onUploadComplete,
  label = 'انتخاب فایل',
  currentUrl,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState(currentUrl ?? '')
  const [dragging,  setDragging]  = useState(false)

  const accept = acceptedTypes?.join(',') ?? ''
  const isImage = accept.includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(uploadedUrl)
  const isAudio = accept.includes('audio') || /\.(mp3|m4a|wav|ogg|webm)$/i.test(uploadedUrl)

  async function handleFile(file: File) {
    setError(null)

    if (file.size > maxSize) {
      const mb = Math.round(maxSize / 1024 / 1024)
      setError(`حجم فایل نباید از ${mb} مگابایت بیشتر باشد`)
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/upload/presigned', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    JSON.stringify({ folder, filename: file.name, contentType: file.type, fileSize: file.size }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message ?? 'خطا در دریافت لینک آپلود')
        setUploading(false)
        return
      }

      const { uploadUrl, fileUrl } = json.data

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`${xhr.status}`))
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      setUploadedUrl(fileUrl)
      onUploadComplete(fileUrl)
    } catch {
      setError('خطا در آپلود فایل. دوباره تلاش کنید.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function clear() {
    setUploadedUrl('')
    setError(null)
    onUploadComplete('')
  }

  return (
    <div>
      {/* Drag & drop zone */}
      {!uploadedUrl && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className="rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all"
          style={{
            padding:    '24px 16px',
            border:     `2px dashed ${dragging ? '#10B981' : 'var(--border-color)'}`,
            background: dragging ? 'rgba(16,185,129,0.05)' : 'var(--surface-secondary)',
          }}
        >
          {uploading ? (
            <>
              <span className="text-2xl mb-2">⏳</span>
              <p className="text-sm mb-2" style={{ color: 'var(--content-secondary)' }}>در حال آپلود... {progress}٪</p>
              <div className="w-full max-w-xs h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: '#10B981' }}
                />
              </div>
            </>
          ) : (
            <>
              <span className="text-3xl mb-2">{isAudio ? '🎵' : isImage ? '🖼️' : '📎'}</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--content-primary)' }}>{label}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--content-tertiary)' }}>
                بکشید و رها کنید یا کلیک کنید · حداکثر {Math.round(maxSize / 1024 / 1024)} مگابایت
              </p>
            </>
          )}
        </div>
      )}

      {/* Preview after upload */}
      {uploadedUrl && (
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={uploadedUrl} alt="preview" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <span className="text-2xl flex-shrink-0">{isAudio ? '🎵' : '📎'}</span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#10B981' }}>✓ بارگذاری شد</p>
            {isAudio && (
              <audio controls src={uploadedUrl} className="w-full mt-2" style={{ maxHeight: 32 }} />
            )}
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ background: 'var(--surface-secondary)', color: 'var(--content-secondary)' }}
            >
              تغییر
            </button>
            <button
              onClick={clear}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ color: '#EF4444' }}
            >
              حذف
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs mt-2 px-1" style={{ color: '#EF4444' }}>{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  )
}
