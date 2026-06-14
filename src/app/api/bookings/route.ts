import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import jalaali from 'jalaali-js'
import { sendBookingConfirmed, sendBookingReceivedForCoach } from '@/lib/services/notification.service'

function makeJitsiRoom(coachId: string): string {
  const rand = Math.random().toString(36).substring(2, 8)
  return `mindgo-${coachId.substring(0, 8)}-${rand}`
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'ابتدا وارد شوید' } },
      { status: 401 }
    )
  }
  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر است' } },
      { status: 401 }
    )
  }
  const userId = payload.sub as string

  const body = await req.json()
  const { coach_id, package_id, session_date, session_time } = body

  if (!coach_id || !package_id || !session_date || !session_time) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PARAMS', message: 'اطلاعات ناقص است' } },
      { status: 400 }
    )
  }

  // Parse Shamsi date → Gregorian Date
  const [jy, jm, jd] = (session_date as string).split('-').map(Number)
  const g = jalaali.toGregorian(jy, jm, jd)
  const sessionDate = new Date(g.gy, g.gm - 1, g.gd)

  // Validate package belongs to the coach
  const pkg = await prisma.package.findUnique({
    where: { id: package_id },
    include: { coach: { select: { id: true, userId: true, status: true } } },
  })

  if (!pkg || pkg.coachId !== coach_id || pkg.coach.status !== 'approved' || !pkg.isActive) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'پکیج یافت نشد' } },
      { status: 404 }
    )
  }

  // Check slot is still available
  const conflict = await prisma.booking.findFirst({
    where: {
      coachId: coach_id,
      sessionDate,
      sessionTime: session_time,
      status: { in: ['pending', 'confirmed'] },
    },
  })
  if (conflict) {
    return NextResponse.json(
      { success: false, error: { code: 'SLOT_TAKEN', message: 'این زمان قبلاً رزرو شده است. لطفاً زمان دیگری انتخاب کنید.' } },
      { status: 409 }
    )
  }

  const [booking, clientUser] = await Promise.all([
    prisma.booking.create({
      data: {
        userId,
        coachId: coach_id,
        packageId: package_id,
        sessionDate,
        sessionTime: session_time,
        jitsiRoomId: makeJitsiRoom(coach_id),
        status: 'pending',
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ])

  // Fire-and-forget notifications
  Promise.all([
    sendBookingConfirmed(userId, pkg.name),
    sendBookingReceivedForCoach(pkg.coach.userId, clientUser?.name ?? 'کاربر', pkg.name),
  ]).catch(() => {/* ignore notification errors */})

  return NextResponse.json({
    success: true,
    data: {
      booking_id:    booking.id,
      jitsi_room_id: booking.jitsiRoomId,
      amount:        pkg.priceToman,
      status:        'pending_payment',
    },
  })
}
