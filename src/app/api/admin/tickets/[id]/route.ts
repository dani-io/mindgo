import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

const SUPPORT_PHONE = 'MINDGO_SUPPORT_SYSTEM'

// GET /api/admin/tickets/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req)
  if (!auth.ok) return authError(auth.status, auth.message)

  const ticket = await prisma.supportTicket.findUnique({
    where:   { id: params.id },
    include: {
      user:  { select: { id: true, name: true, phone: true } },
      agent: { select: { id: true, name: true } },
    },
  })
  if (!ticket) return NextResponse.json({ success: false, error: { message: 'تیکت یافت نشد' } }, { status: 404 })

  const supportUser = await prisma.user.findUnique({
    where:  { phone: SUPPORT_PHONE },
    select: { id: true },
  })

  const messages = supportUser
    ? await prisma.message.findMany({
        where: {
          OR: [
            { senderId: ticket.userId, receiverId: supportUser.id },
            { senderId: supportUser.id, receiverId: ticket.userId },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take:    200,
      })
    : []

  // Mark all user→support messages as read (admin has seen them)
  if (supportUser && messages.some((m) => !m.isRead && m.senderId === ticket.userId)) {
    await prisma.message.updateMany({
      where: { senderId: ticket.userId, receiverId: supportUser.id, isRead: false },
      data:  { isRead: true },
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      ticket: {
        id:         ticket.id,
        status:     ticket.status,
        category:   ticket.category,
        priority:   ticket.priority,
        subject:    ticket.subject,
        createdAt:  ticket.createdAt,
        resolvedAt: ticket.resolvedAt,
        user:       ticket.user,
        agent:      ticket.agent,
      },
      messages: messages.map((m) => ({
        id:         m.id,
        content:    m.content,
        senderId:   m.senderId,
        receiverId: m.receiverId,
        isRead:     m.isRead,
        createdAt:  m.createdAt,
        isFromUser: m.senderId === ticket.userId,
      })),
      supportUserId: supportUser?.id ?? null,
    },
  })
}
