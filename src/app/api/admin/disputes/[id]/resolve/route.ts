import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAuth(req, 'support_manager')
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({}))
  const { ruling, reason, refund_amount } = body as {
    ruling?:        'refund_client' | 'release_coach' | 'partial_refund'
    reason?:        string
    refund_amount?: number
  }

  if (!ruling || !reason?.trim()) {
    return Response.json({ success: false, error: { message: 'حکم و دلیل اجباری است' } }, { status: 400 })
  }

  const session = await prisma.session.findUnique({
    where:   { id: params.id },
    include: {
      booking: {
        include: {
          payment: true,
          coach:   { include: { wallet: true } },
        },
      },
    },
  })

  if (!session) {
    return Response.json({ success: false, error: { message: 'جلسه یافت نشد' } }, { status: 404 })
  }
  if (session.status !== 'disputed') {
    return Response.json({ success: false, error: { message: 'این جلسه در حالت اختلاف نیست' } }, { status: 400 })
  }

  const wallet  = session.booking.coach.wallet
  const payment = session.booking.payment

  if (!wallet) {
    return Response.json({ success: false, error: { message: 'کیف پول کوچ یافت نشد' } }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    // Mark session completed regardless of ruling
    await tx.session.update({
      where: { id: params.id },
      data:  { status: 'completed' },
    })

    if (ruling === 'refund_client') {
      // Burn the locked coach share (platform refunds client separately)
      if (wallet.lockedAmount > 0) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data:  { lockedAmount: { decrement: Math.min(wallet.lockedAmount, payment?.coachShare ?? 0) } },
        })
        await tx.walletTransaction.create({
          data: {
            walletId:    wallet.id,
            sessionId:   params.id,
            amount:      payment?.coachShare ?? 0,
            type:        'burn',
            description: `حکم داوری: ${reason}`,
          },
        })
      }
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data:  { status: 'refunded' },
        })
      }

    } else if (ruling === 'release_coach') {
      // Release the coach's locked share to available
      const releaseAmount = payment?.coachShare ?? 0
      await tx.wallet.update({
        where: { id: wallet.id },
        data:  {
          lockedAmount:    { decrement: Math.min(wallet.lockedAmount, releaseAmount) },
          availableAmount: { increment: releaseAmount },
        },
      })
      await tx.walletTransaction.create({
        data: {
          walletId:    wallet.id,
          sessionId:   params.id,
          amount:      releaseAmount,
          type:        'release',
          description: `حکم داوری: ${reason}`,
        },
      })

    } else if (ruling === 'partial_refund' && refund_amount) {
      const coachKeeps = (payment?.coachShare ?? 0) - refund_amount
      if (coachKeeps > 0) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data:  {
            lockedAmount:    { decrement: Math.min(wallet.lockedAmount, payment?.coachShare ?? 0) },
            availableAmount: { increment: coachKeeps },
          },
        })
        await tx.walletTransaction.create({
          data: {
            walletId:    wallet.id,
            sessionId:   params.id,
            amount:      coachKeeps,
            type:        'release',
            description: `حکم داوری جزئی: ${reason}`,
          },
        })
      }
    }
  })

  return Response.json({ success: true, message: 'حکم داوری صادر و اعمال شد' })
}
