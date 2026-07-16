import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { computeShares } from '@/lib/payments'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'ابتدا وارد شوید' } },
      { status: 401 }
    )
  }
  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر است' } },
      { status: 401 }
    )
  }
  const userId = payload.sub as string

  const body = await req.json()
  const { booking_id, method, discount_code } = body

  if (!booking_id || !method) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PARAMS', message: 'اطلاعات ناقص است' } },
      { status: 400 }
    )
  }

  if (!['zarinpal', 'snappay'].includes(method)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_METHOD', message: 'روش پرداخت نامعتبر است' } },
      { status: 400 }
    )
  }

  const booking = await prisma.booking.findUnique({
    where: { id: booking_id },
    include: { package: true },
  })

  if (!booking || booking.userId !== userId) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'رزرو یافت نشد' } },
      { status: 404 }
    )
  }

  if (booking.status !== 'pending') {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_STATUS', message: 'این رزرو قبلاً پردازش شده است' } },
      { status: 400 }
    )
  }

  const existingPayment = await prisma.payment.findUnique({ where: { bookingId: booking_id } })
  if (existingPayment) {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_INITIATED', message: 'پرداخت قبلاً آغاز شده است' } },
      { status: 400 }
    )
  }

  const amountOriginal = booking.package.priceToman
  let discountAmount = 0
  let discountCodeId: string | null = null

  if (discount_code) {
    const dc = await prisma.discountCode.findUnique({
      where: { code: String(discount_code).toUpperCase() },
    })
    if (
      dc &&
      dc.isActive &&
      (!dc.expiresAt || dc.expiresAt > new Date()) &&
      dc.usedCount < dc.maxUses
    ) {
      discountAmount =
        dc.type === 'percentage'
          ? Math.round((amountOriginal * dc.value) / 100)
          : Math.min(dc.value, amountOriginal)
      discountCodeId = dc.id
    }
  }

  const amountFinal    = amountOriginal - discountAmount
  const { platformShare, coachShare } = computeShares(amountFinal, method as 'zarinpal' | 'snappay')

  const payment = await prisma.payment.create({
    data: {
      userId,
      bookingId:       booking_id,
      amountToman:     amountFinal,
      method:          method as 'zarinpal' | 'snappay',
      status:          'pending',
      platformShare,
      coachShare,
      isInstallment:   method === 'snappay',
      installmentCount: method === 'snappay' ? 4 : null,
      discountCodeId,
      discountAmount,
    },
  })

  if (discountCodeId) {
    await prisma.discountCode.update({
      where: { id: discountCodeId },
      data:  { usedCount: { increment: 1 } },
    })
  }

  // Mock: immediately confirm (no real gateway in MVP)
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'paid', paidAt: new Date() },
    }),
    prisma.booking.update({
      where: { id: booking_id },
      data:  { status: 'confirmed' },
    }),
    prisma.session.create({
      data: {
        bookingId:     booking_id,
        status:        'scheduled',
        autoConfirmAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      payment_id:      payment.id,
      amount_original: amountOriginal,
      discount_amount: discountAmount,
      amount_final:    amountFinal,
    },
  })
}
