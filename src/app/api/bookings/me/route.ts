import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// GET /api/bookings/me
// Returns the user's most recent non-cancelled booking with coach userId — used by the FAB.
export async function GET(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const booking = await prisma.booking.findFirst({
    where: {
      userId: payload.sub,
      status: { notIn: ['cancelled_by_coach', 'cancelled_by_user', 'no_show'] },
    },
    orderBy: { sessionDate: 'desc' },
    include: {
      coach: {
        select: { id: true, userId: true, user: { select: { name: true } } },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ success: true, data: null })
  }

  return NextResponse.json({
    success: true,
    data: {
      bookingId:   booking.id,
      status:      booking.status,
      sessionDate: booking.sessionDate,
      coach: {
        id:     booking.coach.id,
        userId: booking.coach.userId,
        name:   booking.coach.user.name ?? 'راه‌بلد',
      },
    },
  })
}
