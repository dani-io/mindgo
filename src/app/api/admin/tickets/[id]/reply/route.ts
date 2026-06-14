import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'
import { createInAppNotification } from '@/lib/services/notification.service'

const SUPPORT_PHONE = 'MINDGO_SUPPORT_SYSTEM'

// POST /api/admin/tickets/[id]/reply  body: { content: string }
// Sends a message FROM the support system user TO the ticket owner.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req)
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({}))
  const content = (body.content as string | undefined)?.trim()
  if (!content) {
    return NextResponse.json({ success: false, error: { message: 'متن پیام الزامی است' } }, { status: 400 })
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } })
  if (!ticket) return NextResponse.json({ success: false, error: { message: 'تیکت یافت نشد' } }, { status: 404 })

  // Find or create support system user
  const supportUser = await prisma.user.upsert({
    where:  { phone: SUPPORT_PHONE },
    update: {},
    create: { phone: SUPPORT_PHONE, name: 'پشتیبانی Mindgo', role: 'admin' },
  })

  const msg = await prisma.message.create({
    data: {
      senderId:   supportUser.id,
      receiverId: ticket.userId,
      content,
      isRead:     false,
    },
  })

  // Move ticket to in_progress if still open
  if (ticket.status === 'open') {
    await prisma.supportTicket.update({
      where: { id: params.id },
      data:  { status: 'in_progress' },
    })
  }

  // Notify user
  await createInAppNotification(
    ticket.userId,
    'support_reply',
    'پاسخ پشتیبانی رسید 💬',
    content.length > 60 ? content.slice(0, 60) + '...' : content,
  )

  return NextResponse.json({
    success: true,
    data: {
      id:        msg.id,
      content:   msg.content,
      createdAt: msg.createdAt,
    },
  })
}
