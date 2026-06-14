import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function getWallet(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const coach = await prisma.coachProfile.findUnique({ where: { userId: payload.sub }, select: { id: true } })
  if (!coach) return null
  return prisma.wallet.findUnique({ where: { coachId: coach.id } })
}

export async function GET(req: NextRequest) {
  const wallet = await getWallet(req)
  if (!wallet) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const requests = await prisma.payoutRequest.findMany({
    where: { walletId: wallet.id },
    orderBy: { requestedAt: 'desc' },
  })

  return NextResponse.json({
    success: true,
    data: requests.map((r) => ({
      id:            r.id,
      amount:        r.amount,
      status:        r.status,
      requestedAt:   r.requestedAt.toISOString(),
      transferredAt: r.transferredAt?.toISOString() ?? null,
    })),
  })
}

export async function POST(req: NextRequest) {
  const wallet = await getWallet(req)
  if (!wallet) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const body = await req.json()
  const amount = Number(body.amount)

  if (!amount || amount < 500_000) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_AMOUNT', message: 'حداقل مبلغ تسویه ۵۰۰,۰۰۰ تومان است' } },
      { status: 400 }
    )
  }

  if (amount > wallet.availableAmount) {
    return NextResponse.json(
      { success: false, error: { code: 'INSUFFICIENT_BALANCE', message: 'موجودی کافی نیست' } },
      { status: 400 }
    )
  }

  if (!wallet.shebaNumber) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_SHEBA', message: 'لطفاً ابتدا شماره شبا خود را وارد کنید' } },
      { status: 400 }
    )
  }

  // Check no pending payout exists
  const pending = await prisma.payoutRequest.findFirst({
    where: { walletId: wallet.id, status: 'pending' },
  })
  if (pending) {
    return NextResponse.json(
      { success: false, error: { code: 'PENDING_EXISTS', message: 'یک درخواست تسویه در انتظار بررسی دارید' } },
      { status: 409 }
    )
  }

  const request = await prisma.$transaction(async (tx) => {
    const req = await tx.payoutRequest.create({
      data: { walletId: wallet.id, amount, status: 'pending' },
    })
    await tx.wallet.update({
      where: { id: wallet.id },
      data:  { availableAmount: { decrement: amount } },
    })
    return req
  })

  return NextResponse.json({
    success: true,
    data: {
      id:          request.id,
      amount:      request.amount,
      status:      request.status,
      requestedAt: request.requestedAt.toISOString(),
    },
    message: 'درخواست تسویه ثبت شد. پردازش در روز دوشنبه انجام می‌شود.',
  })
}
