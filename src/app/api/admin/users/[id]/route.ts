import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// GET /api/admin/users/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req, 'support_agent')
  if (!auth.ok) return authError(auth.status, auth.message)

  const user = await prisma.user.findUnique({
    where:  { id: params.id },
    select: {
      id:               true,
      name:             true,
      phone:            true,
      role:             true,
      avatarUrl:        true,
      isActive:         true,
      streakCount:      true,
      xpPoints:         true,
      level:            true,
      badges:           true,
      onboardingAnswers:true,
      createdAt:        true,
      adminRole:        { select: { role: true } },
    },
  })
  if (!user) return NextResponse.json({ success: false, error: { message: 'کاربر یافت نشد' } }, { status: 404 })

  const [payments, bookings, habitsCount, goalsCount] = await Promise.all([
    prisma.payment.findMany({
      where:   { userId: params.id },
      orderBy: { createdAt: 'desc' },
      take:    20,
      include: { booking: { include: { package: { select: { name: true } } } } },
    }),
    prisma.booking.findMany({
      where:   { userId: params.id },
      orderBy: { sessionDate: 'desc' },
      take:    20,
      include: { coach: { include: { user: { select: { name: true } } } } },
    }),
    prisma.habit.count({ where: { userId: params.id, isActive: true } }),
    prisma.goal.count({  where: { userId: params.id, status: 'active' } }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      user,
      payments: payments.map((p) => ({
        id:            p.id,
        amountToman:   p.amountToman,
        method:        p.method,
        status:        p.status,
        isInstallment: p.isInstallment,
        discountAmount:p.discountAmount,
        paidAt:        p.paidAt,
        createdAt:     p.createdAt,
        packageName:   p.booking?.package?.name ?? null,
      })),
      sessions: bookings.map((b) => ({
        id:          b.id,
        sessionDate: b.sessionDate,
        sessionTime: b.sessionTime,
        status:      b.status,
        coachName:   b.coach?.user?.name ?? null,
      })),
      stats: { habitsCount, goalsCount },
    },
  })
}

// PATCH /api/admin/users/[id]  body: { isActive: boolean }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req, 'support_manager')
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({}))
  if (typeof body.isActive !== 'boolean') {
    return NextResponse.json({ success: false, error: { message: 'isActive الزامی است' } }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where:  { id: params.id },
    data:   { isActive: body.isActive },
    select: { id: true, isActive: true, name: true },
  }).catch(() => null)

  if (!updated) return NextResponse.json({ success: false, error: { message: 'کاربر یافت نشد' } }, { status: 404 })
  return NextResponse.json({ success: true, data: updated })
}
