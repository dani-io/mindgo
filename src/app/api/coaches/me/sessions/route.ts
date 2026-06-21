import { NextRequest, NextResponse } from 'next/server'
import { Prisma, BookingStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function requireCoach(req: NextRequest) {
  const token =
    req.cookies.get('mg_token')?.value ??
    req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'rahbalad') return null
  return payload
}

// GET /api/coaches/me/sessions?filter=upcoming|completed|cancelled|today&limit=50
export async function GET(req: NextRequest) {
  const payload = await requireCoach(req)
  if (!payload) {
    return NextResponse.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })
  }

  const coach = await prisma.coachProfile.findUnique({
    where:  { userId: payload.sub },
    select: { id: true },
  })
  if (!coach) {
    return NextResponse.json({ success: false, error: { message: 'پروفایل کوچ یافت نشد' } }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'upcoming'
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let where: Prisma.BookingWhereInput = { coachId: coach.id }
  let orderBy: Prisma.BookingOrderByWithRelationInput

  if (filter === 'upcoming') {
    where   = { coachId: coach.id, status: { in: ['pending', 'confirmed'] as BookingStatus[] }, sessionDate: { gte: today } }
    orderBy = { sessionDate: 'asc' }
  } else if (filter === 'today') {
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    where   = { coachId: coach.id, status: { in: ['pending', 'confirmed'] as BookingStatus[] }, sessionDate: { gte: today, lt: tomorrow } }
    orderBy = { sessionDate: 'asc' }
  } else if (filter === 'completed') {
    where   = { coachId: coach.id, status: { in: ['completed'] as BookingStatus[] } }
    orderBy = { sessionDate: 'desc' }
  } else if (filter === 'cancelled') {
    where   = { coachId: coach.id, status: { in: ['cancelled_by_coach', 'cancelled_by_user', 'no_show'] as BookingStatus[] } }
    orderBy = { sessionDate: 'desc' }
  } else {
    where   = { coachId: coach.id }
    orderBy = { sessionDate: 'desc' }
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy,
    take: limit,
    include: {
      user:    { select: { id: true, name: true, avatarUrl: true } },
      package: { select: { name: true, sessionCount: true, durationMinutes: true } },
      session: { select: { status: true } },
    },
  })

  // Also fetch weekly stats and monthly earnings for dashboard use
  const weekAgo      = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1)

  const [thisWeekCount, thisMonthEarnings] = await Promise.all([
    prisma.booking.count({
      where: { coachId: coach.id, status: 'completed', sessionDate: { gte: weekAgo } },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        wallet:    { coachId: coach.id },
        type:      'release',
        createdAt: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
  ])

  const sessions = bookings.map((b) => ({
    id:            b.id,
    sessionDate:   b.sessionDate.toISOString(),
    sessionTime:   b.sessionTime,
    sessionNumber: b.sessionNumber,
    status:        b.status,
    sessionStatus: b.session?.status ?? null,
    jitsiRoomId:   b.jitsiRoomId,
    client: {
      id:        b.user.id,
      name:      b.user.name ?? 'رهجو',
      avatarUrl: b.user.avatarUrl,
    },
    package: {
      name:            b.package.name,
      sessionCount:    b.package.sessionCount,
      durationMinutes: b.package.durationMinutes,
    },
  }))

  return NextResponse.json({
    success: true,
    data: {
      sessions,
      stats: {
        thisWeekCount,
        thisMonthEarnings: thisMonthEarnings._sum.amount ?? 0,
      },
    },
  })
}
