import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { computeShares, formatCardNumber } from '@/lib/payments'
import { sendCardPaymentPendingForCoach, notifyAdmins } from '@/lib/services/notification.service'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/payments/card-to-card?booking_id=... — full card details for the
// booking owner so they can transfer the money. Owner-scoped (not public).
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: { message: 'ابتدا وارد شوید' } }, { status: 401 })

  const bookingId = req.nextUrl.searchParams.get('booking_id')
  if (!bookingId) return NextResponse.json({ success: false, error: { message: 'شناسه رزرو الزامی است' } }, { status: 400 })

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      package: { select: { name: true, priceToman: true } },
      coach:   { select: { cardNumber: true, cardHolderName: true, user: { select: { name: true } } } },
    },
  })

  if (!booking || booking.userId !== payload.sub) {
    return NextResponse.json({ success: false, error: { message: 'رزرو یافت نشد' } }, { status: 404 })
  }

  if (!booking.coach.cardNumber) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_CARD', message: 'این کوچ هنوز شماره کارت ثبت نکرده است' } },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      cardNumber:       booking.coach.cardNumber,
      cardNumberFmt:    formatCardNumber(booking.coach.cardNumber),
      cardHolderName:   booking.coach.cardHolderName ?? booking.coach.user.name ?? '',
      coachName:        booking.coach.user.name ?? 'کوچ',
      packageName:      booking.package.name,
      amount:           booking.package.priceToman,
    },
  })
}

// POST /api/payments/card-to-card — submit a card-to-card payment with tracking
// code. Creates a payment awaiting coach verification; no platform commission.
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: { message: 'ابتدا وارد شوید' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    booking_id?:        string
    tracking_code?:     string
    receipt_image_url?: string
  }

  const bookingId   = body.booking_id
  const trackingCode = (body.tracking_code ?? '').trim()

  if (!bookingId || !trackingCode) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PARAMS', message: 'شناسه رزرو و کد رهگیری الزامی هستند' } },
      { status: 400 }
    )
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      package: { select: { name: true, priceToman: true } },
      coach:   { select: { userId: true, cardNumber: true } },
    },
  })

  if (!booking || booking.userId !== payload.sub) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'رزرو یافت نشد' } }, { status: 404 })
  }
  if (booking.status !== 'pending') {
    return NextResponse.json({ success: false, error: { code: 'INVALID_STATUS', message: 'این رزرو قبلاً پردازش شده است' } }, { status: 400 })
  }
  if (!booking.coach.cardNumber) {
    return NextResponse.json({ success: false, error: { code: 'NO_CARD', message: 'این کوچ شماره کارت ندارد' } }, { status: 400 })
  }

  const existing = await prisma.payment.findUnique({ where: { bookingId } })
  if (existing) {
    return NextResponse.json({ success: false, error: { code: 'ALREADY_INITIATED', message: 'پرداخت قبلاً ثبت شده است' } }, { status: 400 })
  }

  const amount = booking.package.priceToman
  // Card-to-card: 100% to coach, no platform commission.
  const { platformShare, coachShare } = computeShares(amount, 'card_to_card')

  const payment = await prisma.payment.create({
    data: {
      userId:          payload.sub,
      bookingId,
      amountToman:     amount,
      method:          'card_to_card',
      status:          'pending_verification',
      trackingCode,
      receiptImageUrl: body.receipt_image_url?.trim() || null,
      platformShare,
      coachShare,
      discountAmount:  0,
    },
  })

  // Notify the coach to verify, and alert admins for oversight. Fire-and-forget.
  const clientUser = await prisma.user.findUnique({ where: { id: payload.sub }, select: { name: true } })
  Promise.all([
    sendCardPaymentPendingForCoach(booking.coach.userId, clientUser?.name ?? 'یک رهجو', amount),
    notifyAdmins('پرداخت کارت‌به‌کارت جدید', `یک پرداخت کارت‌به‌کارت (${amount.toLocaleString('fa-IR')} تومان) در انتظار تأیید کوچ است.`),
  ]).catch(() => {})

  return NextResponse.json({
    success: true,
    data: {
      payment_id: payment.id,
      status:     payment.status,
      amount,
    },
  })
}
