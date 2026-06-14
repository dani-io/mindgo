import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

const SUPPORT_PHONE = 'MINDGO_SUPPORT_SYSTEM'

// POST /api/support/start
// Creates (or finds) an open support ticket and ensures a support system user exists.
// Returns { ticketId, supportUserId } so the client can navigate to /support/chat.
export async function POST(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const category: 'technical' | 'financial' | 'general' = body.category ?? 'general'

  // Find or create the support system user
  const supportUser = await prisma.user.upsert({
    where:  { phone: SUPPORT_PHONE },
    update: {},
    create: { phone: SUPPORT_PHONE, name: 'پشتیبانی Mindgo', role: 'admin' },
  })

  // Find existing open ticket for this user
  const existing = await prisma.supportTicket.findFirst({
    where:  { userId: payload.sub, status: { in: ['open', 'in_progress'] } },
    orderBy: { createdAt: 'desc' },
  })

  let ticket = existing
  if (!ticket) {
    ticket = await prisma.supportTicket.create({
      data: {
        userId:   payload.sub,
        category,
        subject:  'چت پشتیبانی',
        status:   'open',
        priority: 'medium',
      },
    })

    // Send welcome message from support user to the new user
    await prisma.message.create({
      data: {
        senderId:   supportUser.id,
        receiverId: payload.sub,
        content:    'سلام! به پشتیبانی Mindgo خوش اومدی 🙌\nچطور می‌تونم کمکت کنم؟',
        isRead:     false,
      },
    })
  }

  return NextResponse.json({
    success: true,
    data: { ticketId: ticket.id, supportUserId: supportUser.id },
  })
}
