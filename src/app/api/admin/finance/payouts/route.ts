import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status') ?? 'pending'

  const payouts = await prisma.payoutRequest.findMany({
    where: statusFilter === 'all' ? {} : { status: statusFilter as 'pending' | 'approved' | 'transferred' | 'rejected' },
    include: {
      wallet: {
        include: {
          coach: {
            include: { user: { select: { name: true, phone: true } } },
          },
        },
      },
    },
    orderBy: { requestedAt: 'asc' },
  })

  return Response.json({
    success: true,
    data: payouts.map((p) => ({
      id:            p.id,
      amount:        p.amount,
      status:        p.status,
      payaRef:       p.payaRef,
      requestedAt:   p.requestedAt,
      transferredAt: p.transferredAt,
      coachName:     p.wallet.coach.user.name,
      coachPhone:    p.wallet.coach.user.phone,
      shebaNumber:   p.wallet.shebaNumber,
      accountHolder: p.wallet.accountHolder,
    })),
  })
}
