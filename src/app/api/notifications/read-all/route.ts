import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// PATCH /api/notifications/read-all
export async function PATCH(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  await prisma.notification.updateMany({
    where: { userId: payload.sub, isRead: false },
    data:  { isRead: true },
  })

  return Response.json({ success: true })
}
