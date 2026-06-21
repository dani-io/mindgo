import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// POST /api/sessions/[sessionId]/confirm
// Client confirms session happened → releases escrow to coach wallet
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return Response.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const session = await prisma.session.findUnique({
    where:   { id: params.sessionId },
    include: {
      booking: {
        include: {
          payment: true,
          coach:   { include: { wallet: true, user: { select: { id: true } } } },
        },
      },
    },
  })

  if (!session) return Response.json({ success: false, error: { message: 'جلسه یافت نشد' } }, { status: 404 })
  if (session.booking.userId !== payload.sub) {
    return Response.json({ success: false, error: { message: 'فقط رهجو می‌تواند جلسه را تأیید کند' } }, { status: 403 })
  }
  if (session.confirmedByUser) {
    return Response.json({ success: false, error: { message: 'جلسه قبلاً تأیید شده' } }, { status: 400 })
  }
  if (session.status === 'disputed') {
    return Response.json({ success: false, error: { message: 'جلسه در حال بررسی است' } }, { status: 400 })
  }

  const wallet      = session.booking.coach.wallet
  const payment     = session.booking.payment
  const releaseAmt  = payment?.coachShare ?? 0

  if (!wallet) {
    return Response.json({ success: false, error: { message: 'کیف پول کوچ یافت نشد' } }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    // Mark session confirmed and completed
    await tx.session.update({
      where: { id: params.sessionId },
      data:  { confirmedByUser: true, status: 'completed', endedAt: new Date() },
    })

    // Release escrow → available
    if (releaseAmt > 0) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data:  {
          lockedAmount:    { decrement: Math.min(wallet.lockedAmount, releaseAmt) },
          availableAmount: { increment: releaseAmt },
        },
      })
      await tx.walletTransaction.create({
        data: {
          walletId:    wallet.id,
          sessionId:   params.sessionId,
          amount:      releaseAmt,
          type:        'release',
          description: 'تأیید جلسه توسط رهجو',
        },
      })
    }

    // Increment coach total sessions
    await tx.coachProfile.update({
      where: { id: session.booking.coachId },
      data:  { totalSessions: { increment: 1 } },
    })
  })

  return Response.json({ success: true, message: 'جلسه تأیید شد و سهم کوچ آزاد شد' })
}
