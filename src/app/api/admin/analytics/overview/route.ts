import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'support_agent')
  if (!auth.ok) return authError(auth.status, auth.message)

  const now   = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers,
    activeCoaches,
    totalSessions,
    pendingCoaches,
    openDisputes,
    pendingPayouts,
    revenueAll,
    revenueMonth,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.coachProfile.count({ where: { status: 'approved' } }),
    prisma.session.count({ where: { status: 'completed' } }),
    prisma.coachProfile.count({ where: { status: 'pending' } }),
    prisma.session.count({ where: { status: 'disputed' } }),
    prisma.payoutRequest.count({ where: { status: 'pending' } }),
    prisma.payment.aggregate({ where: { status: 'paid' }, _sum: { platformShare: true } }),
    prisma.payment.aggregate({
      where: { status: 'paid', paidAt: { gte: monthStart } },
      _sum:  { platformShare: true },
    }),
  ])

  return Response.json({
    success: true,
    data: {
      totalUsers,
      activeCoaches,
      totalSessions,
      pendingCoaches,
      openDisputes,
      pendingPayouts,
      totalRevenue:      revenueAll._sum.platformShare   ?? 0,
      thisMonthRevenue:  revenueMonth._sum.platformShare ?? 0,
    },
  })
}
