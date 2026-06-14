import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// PATCH /api/user/theme
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return Response.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { theme?: string }
  const VALID = ['auto', 'dark', 'light']
  if (!body.theme || !VALID.includes(body.theme)) {
    return Response.json({ success: false, error: { message: 'تم نامعتبر است' } }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: payload.sub },
    data:  { themePref: body.theme as 'auto' | 'dark' | 'light' },
  })

  return Response.json({ success: true })
}
