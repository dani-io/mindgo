import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [allPaid, thisMonth, lastMonth, methodBreakdown, coachCount] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: 'paid' },
      _sum:  { amountToman: true, platformShare: true, coachShare: true, discountAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: 'paid', paidAt: { gte: monthStart } },
      _sum:  { amountToman: true, platformShare: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'paid', paidAt: { gte: lastMonthStart, lt: monthStart } },
      _sum:  { amountToman: true, platformShare: true },
    }),
    prisma.payment.groupBy({
      by:    ['method'],
      where: { status: 'paid' },
      _sum:  { amountToman: true },
      _count: true,
    }),
    prisma.coachProfile.count({ where: { status: 'approved' } }),
  ])

  return Response.json({
    success: true,
    data: {
      totalRevenue:         allPaid._sum.amountToman    ?? 0,
      totalPlatformShare:   allPaid._sum.platformShare  ?? 0,
      totalCoachShare:      allPaid._sum.coachShare     ?? 0,
      totalDiscounts:       allPaid._sum.discountAmount ?? 0,
      totalTransactions:    allPaid._count,
      thisMonthRevenue:     thisMonth._sum.amountToman   ?? 0,
      thisMonthPlatform:    thisMonth._sum.platformShare ?? 0,
      lastMonthRevenue:     lastMonth._sum.amountToman   ?? 0,
      lastMonthPlatform:    lastMonth._sum.platformShare ?? 0,
      approvedCoachCount:   coachCount,
      methodBreakdown: methodBreakdown.map((m) => ({
        method:  m.method,
        total:   m._sum.amountToman ?? 0,
        count:   m._count,
      })),
    },
  })
}
