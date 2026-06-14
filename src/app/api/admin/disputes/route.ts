import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'support_manager')
  if (!auth.ok) return authError(auth.status, auth.message)

  const disputes = await prisma.session.findMany({
    where: { status: 'disputed' },
    include: {
      booking: {
        include: {
          user:    { select: { name: true, phone: true } },
          coach:   { include: { user: { select: { name: true } } } },
          package: { select: { name: true, priceToman: true } },
        },
      },
    },
    orderBy: { booking: { sessionDate: 'asc' } },
  })

  return Response.json({
    success: true,
    data: disputes.map((s) => ({
      id:          s.id,
      bookingId:   s.bookingId,
      status:      s.status,
      sessionDate: s.booking.sessionDate,
      sessionTime: s.booking.sessionTime,
      clientName:  s.booking.user.name,
      clientPhone: s.booking.user.phone,
      coachName:   s.booking.coach.user.name,
      packageName: s.booking.package.name,
      amount:      s.booking.package.priceToman,
      jitsiRoomId: s.booking.jitsiRoomId,
    })),
  })
}
