import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// PATCH /api/notifications/:id/read
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const notif = await prisma.notification.findFirst({
    where: { id: params.id, userId: payload.sub },
  })

  if (!notif) return Response.json({ success: false, error: { message: 'یافت نشد' } }, { status: 404 })

  await prisma.notification.update({ where: { id: params.id }, data: { isRead: true } })

  return Response.json({ success: true })
}
