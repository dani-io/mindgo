import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/coaches/me/card-payments — card-to-card payments awaiting this
// coach's verification (with tracking code + receipt image).
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const coach = await prisma.coachProfile.findUnique({
    where:  { userId: payload.sub },
    select: { id: true },
  })
  if (!coach) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 })

  const payments = await prisma.payment.findMany({
    where: {
      method: 'card_to_card',
      status: 'pending_verification',
      booking: { coachId: coach.id },
    },
    include: {
      user:    { select: { name: true } },
      booking: {
        include: { package: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    success: true,
    data: payments.map((p) => ({
      id:             p.id,
      amount:         p.amountToman,
      trackingCode:   p.trackingCode,
      receiptImageUrl: p.receiptImageUrl,
      clientName:     p.user.name ?? 'رهجو',
      packageName:    p.booking.package.name,
      sessionDate:    p.booking.sessionDate,
      sessionTime:    p.booking.sessionTime,
      createdAt:      p.createdAt.toISOString(),
    })),
  })
}
