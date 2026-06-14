import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/notifications/me
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') ?? '50'), 100)

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where:   { userId: payload.sub },
      orderBy: { sentAt: 'desc' },
      take:    limit,
      select:  { id: true, type: true, category: true, title: true, body: true, isRead: true, sentAt: true },
    }),
    prisma.notification.count({ where: { userId: payload.sub, isRead: false } }),
  ])

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek  = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)

  const grouped = {
    today:    notifications.filter((n) => new Date(n.sentAt) >= startOfToday),
    thisWeek: notifications.filter((n) => new Date(n.sentAt) >= startOfWeek && new Date(n.sentAt) < startOfToday),
    older:    notifications.filter((n) => new Date(n.sentAt) < startOfWeek),
  }

  return Response.json({ success: true, data: { grouped, unreadCount } })
}
