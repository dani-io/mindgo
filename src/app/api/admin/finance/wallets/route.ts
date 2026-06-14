import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  const wallets = await prisma.wallet.findMany({
    include: {
      coach: {
        include: { user: { select: { name: true, phone: true } } },
      },
    },
    orderBy: { availableAmount: 'desc' },
  })

  return Response.json({
    success: true,
    data: wallets.map((w) => ({
      id:              w.id,
      coachName:       w.coach.user.name,
      coachPhone:      w.coach.user.phone,
      totalEarned:     w.totalEarned,
      lockedAmount:    w.lockedAmount,
      availableAmount: w.availableAmount,
      shebaNumber:     w.shebaNumber,
      accountHolder:   w.accountHolder,
    })),
  })
}
