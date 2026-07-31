import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { buildKey, uploadFile, validateUpload, getStorageProvider } from '@/lib/services/upload.service'

// Files stream in as multipart bodies; nothing here is cacheable.
export const dynamic = 'force-dynamic'

/**
 * Node 18 has no global `File` (it arrived in Node 20), so `instanceof File`
 * throws a ReferenceError at runtime even though undici hands us a File-like
 * object. Check the shape we actually use instead.
 */
function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as File).arrayBuffer === 'function' &&
    typeof (value as File).size === 'number'
  )
}

function getToken(req: NextRequest): string | null {
  return (
    req.cookies.get('mg_token')?.value ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    null
  )
}

// POST /api/upload/local
// multipart/form-data: file, folder
// Returns: { fileUrl, key }
export async function POST(req: NextRequest) {
  if (getStorageProvider() !== 'local') {
    return NextResponse.json(
      { success: false, error: { message: 'ذخیره‌سازی محلی غیرفعال است' } },
      { status: 404 },
    )
  }

  const raw = getToken(req)
  if (!raw) return NextResponse.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })
  const payload = await verifyToken(raw)
  if (!payload) return NextResponse.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ success: false, error: { message: 'بدنه درخواست نامعتبر است' } }, { status: 400 })
  }

  const folder = (form.get('folder') as string | null)?.trim()
  const file   = form.get('file')

  if (!folder) {
    return NextResponse.json({ success: false, error: { message: 'folder الزامی است' } }, { status: 400 })
  }
  if (!isUploadedFile(file)) {
    return NextResponse.json({ success: false, error: { message: 'فایل ارسال نشده است' } }, { status: 400 })
  }

  // Same rules the presigned route enforces — this endpoint is reachable
  // directly, so it re-checks rather than trusting an earlier call.
  const problem = validateUpload(folder, file.type || null, file.size)
  if (problem) {
    return NextResponse.json({ success: false, error: { message: problem } }, { status: 400 })
  }

  // The key is derived from the verified token, never from client input, so a
  // caller cannot write into another user's directory.
  const key = buildKey(folder, payload.sub, file.name || 'file')

  try {
    const buffer  = Buffer.from(await file.arrayBuffer())
    const fileUrl = await uploadFile(buffer, key, file.type || 'application/octet-stream')
    return NextResponse.json({ success: true, data: { fileUrl, key } })
  } catch (err) {
    console.error('[upload/local] write failed', err)
    return NextResponse.json(
      { success: false, error: { message: 'خطا در ذخیره فایل' } },
      { status: 500 },
    )
  }
}
