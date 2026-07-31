import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { generatePresignedUploadUrl, buildKey, validateUpload, getStorageProvider } from '@/lib/services/upload.service'

function getToken(req: NextRequest): string | null {
  return (
    req.cookies.get('mg_token')?.value ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    null
  )
}

// POST /api/upload/presigned
// body: { folder, filename, contentType, fileSize? }
// Returns: { uploadUrl, method, fileUrl, key, provider }
//
// `method` tells the client how to send the bytes: PUT straight to S3, or POST
// multipart to /api/upload/local. Clients must branch on it rather than assume
// PUT — that is what makes STORAGE_PROVIDER switchable without a rebuild.
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

  // Folder whitelist, size cap and MIME check all live in the storage service
  // so this route and /api/upload/local cannot drift apart.
  const problem = validateUpload(folder, contentType, fileSize)
  if (problem) {
    return NextResponse.json({ success: false, error: { message: problem } }, { status: 400 })
  }

  const key = buildKey(folder, payload.sub, filename)
  const { uploadUrl, method, fileUrl } = await generatePresignedUploadUrl(key, contentType)

  return NextResponse.json({
    success: true,
    data: { uploadUrl, method, fileUrl, key, provider: getStorageProvider() },
  })
}
