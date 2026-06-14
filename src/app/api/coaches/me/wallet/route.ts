import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value
  if (!token) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const coach = await prisma.coachProfile.findUnique({
    where: { userId: payload.sub },
    select: { id: true },
  })
  if (!coach) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  const wallet = await prisma.wallet.findUnique({
    where: { coachId: coach.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      payoutRequests: {
        orderBy: { requestedAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!wallet) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'کیف پول یافت نشد' } }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: {
      totalEarned:     wallet.totalEarned,
      lockedAmount:    wallet.lockedAmount,
      availableAmount: wallet.availableAmount,
      shebaNumber:     wallet.shebaNumber,
      accountHolder:   wallet.accountHolder,
      canRequestPayout: wallet.availableAmount >= 500_000,
      minPayoutAmount:  500_000,
      transactions: wallet.transactions.map((t) => ({
        id:          t.id,
        amount:      t.amount,
        type:        t.type,
        description: t.description,
        createdAt:   t.createdAt.toISOString(),
      })),
      payoutRequests: wallet.payoutRequests.map((p) => ({
        id:             p.id,
        amount:         p.amount,
        status:         p.status,
        requestedAt:    p.requestedAt.toISOString(),
        transferredAt:  p.transferredAt?.toISOString() ?? null,
      })),
    },
  })
}
