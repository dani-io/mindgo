import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

const SUPPORT_PHONE = 'MINDGO_SUPPORT_SYSTEM'

// GET /api/support/status — check if user has an active ticket + get supportUserId
export async function GET(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const [ticket, supportUser] = await Promise.all([
    prisma.supportTicket.findFirst({
      where:   { userId: payload.sub, status: { in: ['open', 'in_progress'] } },
      orderBy: { createdAt: 'desc' },
      select:  { id: true, status: true, createdAt: true },
    }),
    prisma.user.findUnique({ where: { phone: SUPPORT_PHONE }, select: { id: true } }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      hasOpenTicket: !!ticket,
      ticket:        ticket ?? null,
      supportUserId: supportUser?.id ?? null,
    },
  })
}
