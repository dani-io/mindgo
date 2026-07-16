import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import {
  sendCardPaymentConfirmed,
  sendCardPaymentDisputed,
  sendBookingConfirmed,
  notifyAdmins,
} from '@/lib/services/notification.service'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// PATCH /api/payments/[id]/verify — coach confirms or rejects a card-to-card
// payment they received. { action: 'confirm' | 'reject' }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: { message: 'ابتدا وارد شوید' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { action?: string }
  const action = body.action
  if (action !== 'confirm' && action !== 'reject') {
    return NextResponse.json({ success: false, error: { message: 'عملیات نامعتبر است' } }, { status: 400 })
  }

  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      booking: {
        include: {
          coach:   { select: { id: true, userId: true } },
          package: { select: { name: true } },
        },
      },
    },
  })

  if (!payment) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'پرداخت یافت نشد' } }, { status: 404 })
  }

  // Only the coach who owns this booking may verify it.
  if (payment.booking.coach.userId !== payload.sub) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'دسترسی مجاز نیست' } }, { status: 403 })
  }
  if (payment.method !== 'card_to_card' || payment.status !== 'pending_verification') {
    return NextResponse.json({ success: false, error: { code: 'INVALID_STATUS', message: 'این پرداخت قابل تأیید نیست' } }, { status: 400 })
  }

  const clientId    = payment.userId
  const packageName = payment.booking.package.name

  if (action === 'confirm') {
    // Coach confirms receipt: mark paid, confirm booking, create the session.
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'paid', paidAt: new Date() },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data:  { status: 'confirmed' },
      }),
      prisma.session.create({
        data: {
          bookingId:     payment.bookingId,
          status:        'scheduled',
          autoConfirmAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }),
    ])

    Promise.all([
      sendCardPaymentConfirmed(clientId, packageName),
      sendBookingConfirmed(clientId, packageName),
    ]).catch(() => {})

    return NextResponse.json({ success: true, data: { status: 'paid' } })
  }

  // action === 'reject' — coach says they didn't receive the money.
  await prisma.payment.update({
    where: { id: payment.id },
    data:  { status: 'disputed' },
  })

  Promise.all([
    sendCardPaymentDisputed(clientId, packageName),
    notifyAdmins('پرداخت کارت‌به‌کارت رد شد', `کوچ دریافت وجه پکیج «${packageName}» را تأیید نکرد. نیاز به بررسی دارد.`),
  ]).catch(() => {})

  return NextResponse.json({ success: true, data: { status: 'disputed' } })
}
