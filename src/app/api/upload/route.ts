import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { deleteFile } from '@/lib/services/upload.service'

function getToken(req: NextRequest): string | null {
  return (
    req.cookies.get('mg_token')?.value ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    null
  )
}

// DELETE /api/upload
// body: { key }
export async function DELETE(req: NextRequest) {
  const raw = getToken(req)
  if (!raw) return NextResponse.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })
  const payload = await verifyToken(raw)
  if (!payload) return NextResponse.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const key  = (body.key as string | undefined)?.trim()
  if (!key) return NextResponse.json({ success: false, error: { message: 'key الزامی است' } }, { status: 400 })

  // Security: key must contain the user's ID segment
  if (!key.includes(`/${payload.sub}/`)) {
    return NextResponse.json({ success: false, error: { message: 'دسترسی مجاز نیست' } }, { status: 403 })
  }

  await deleteFile(key)
  return NextResponse.json({ success: true })
}
