import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { generatePresignedUploadUrl, buildKey } from '@/lib/services/upload.service'

const FOLDER_LIMITS: Record<string, { maxSize: number }> = {
  avatars:           { maxSize: 2  * 1024 * 1024 },
  'voice-intros':    { maxSize: 10 * 1024 * 1024 },
  'video-intros':    { maxSize: 50 * 1024 * 1024 },
  certificates:      { maxSize: 5  * 1024 * 1024 },
  podcasts:          { maxSize: 50 * 1024 * 1024 },
  meditations:       { maxSize: 50 * 1024 * 1024 },
  'chat-attachments':{ maxSize: 10 * 1024 * 1024 },
  exercises:         { maxSize: 10 * 1024 * 1024 },
}

function getToken(req: NextRequest): string | null {
  return (
    req.cookies.get('mg_token')?.value ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    null
  )
}

// POST /api/upload/presigned
// body: { folder, filename, contentType, fileSize? }
// Returns: { uploadUrl, fileUrl, key }
export async function POST(req: NextRequest) {
  const raw = getToken(req)
  if (!raw) return NextResponse.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })
  const payload = await verifyToken(raw)
  if (!payload) return NextResponse.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const body        = await req.json().catch(() => ({}))
  const folder      = (body.folder    as string | undefined)?.trim()
  const filename    = (body.filename  as string | undefined)?.trim()
  const contentType = (body.contentType as string | undefined)?.trim()
  const fileSize    = typeof body.fileSize === 'number' ? body.fileSize : null

  if (!folder || !filename || !contentType) {
    return NextResponse.json({ success: false, error: { message: 'folder، filename و contentType الزامی است' } }, { status: 400 })
  }

  const limits = FOLDER_LIMITS[folder]
  if (!limits) {
    return NextResponse.json({ success: false, error: { message: 'پوشه نامعتبر است' } }, { status: 400 })
  }

  if (fileSize !== null && fileSize > limits.maxSize) {
    const mb = Math.round(limits.maxSize / 1024 / 1024)
    return NextResponse.json({ success: false, error: { message: `حجم فایل نباید از ${mb} مگابایت بیشتر باشد` } }, { status: 400 })
  }

  const key = buildKey(folder, payload.sub, filename)
  const { uploadUrl, fileUrl } = await generatePresignedUploadUrl(key, contentType)

  return NextResponse.json({ success: true, data: { uploadUrl, fileUrl, key } })
}
