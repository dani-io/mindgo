import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// GET /api/notifications/me/unread-count — lightweight poll for the bell badge
export async function GET(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ success: false }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return Response.json({ success: false }, { status: 401 })

  const count = await prisma.notification.count({ where: { userId: payload.sub, isRead: false } })
  return Response.json({ success: true, data: { count } })
}
