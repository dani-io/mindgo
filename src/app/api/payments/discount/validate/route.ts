import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

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

  const { code, amount } = await req.json()

  if (!code || !amount) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PARAMS', message: 'کد و مبلغ الزامی است' } },
      { status: 400 }
    )
  }

  const dc = await prisma.discountCode.findUnique({
    where: { code: String(code).toUpperCase() },
  })

  if (
    !dc ||
    !dc.isActive ||
    (dc.expiresAt && dc.expiresAt <= new Date()) ||
    dc.usedCount >= dc.maxUses
  ) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CODE', message: 'کد تخفیف نامعتبر یا منقضی شده است' } },
      { status: 400 }
    )
  }

  const discountAmount =
    dc.type === 'percentage'
      ? Math.round((Number(amount) * dc.value) / 100)
      : Math.min(dc.value, Number(amount))

  return NextResponse.json({
    success: true,
    data: {
      code:            dc.code,
      type:            dc.type,
      value:           dc.value,
      discount_amount: discountAmount,
      final_amount:    Number(amount) - discountAmount,
    },
  })
}
