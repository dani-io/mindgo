import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

const SUPPORT_PHONE = 'MINDGO_SUPPORT_SYSTEM'

// GET /api/admin/tickets?status=open|in_progress|resolved|all
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req)
  if (!auth.ok) return authError(auth.status, auth.message)

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('status') ?? 'open'

  type TS = 'open' | 'in_progress' | 'resolved' | 'closed'
  const where =
    filter === 'all'
      ? {}
      : filter === 'open_active'
      ? { status: { in: ['open', 'in_progress'] as TS[] } }
      : { status: filter as TS }

  const tickets = await prisma.supportTicket.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where:   where as any,
    orderBy: { createdAt: 'desc' },
    take:    100,
    include: {
      user:  { select: { id: true, name: true, phone: true } },
      agent: { select: { id: true, name: true } },
    },
  })

  const supportUser = await prisma.user.findUnique({
    where:  { phone: SUPPORT_PHONE },
    select: { id: true },
  })

  // For each ticket, get the last message between user and support
  const ticketsWithLastMsg = await Promise.all(
    tickets.map(async (t) => {
      const lastMsg = supportUser
        ? await prisma.message.findFirst({
            where: {
              OR: [
                { senderId: t.userId, receiverId: supportUser.id },
                { senderId: supportUser.id, receiverId: t.userId },
              ],
            },
            orderBy: { createdAt: 'desc' },
            select:  { content: true, createdAt: true, senderId: true },
          })
        : null

      const unread = supportUser
        ? await prisma.message.count({
            where: { senderId: t.userId, receiverId: supportUser.id, isRead: false },
          })
        : 0

      return {
        id:          t.id,
        status:      t.status,
        category:    t.category,
        priority:    t.priority,
        subject:     t.subject,
        createdAt:   t.createdAt,
        resolvedAt:  t.resolvedAt,
        user:        t.user,
        agent:       t.agent,
        lastMessage: lastMsg ? { content: lastMsg.content, sentAt: lastMsg.createdAt, isFromUser: lastMsg.senderId === t.userId } : null,
        unreadCount: unread,
      }
    })
  )

  return NextResponse.json({ success: true, data: ticketsWithLastMsg })
}
