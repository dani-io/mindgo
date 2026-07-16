import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value
  if (!token) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const coach = await prisma.coachProfile.findUnique({ where: { userId: payload.sub }, select: { id: true } })
  if (!coach) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 })

  const { sheba_number, account_holder } = await req.json()

  // Basic IBAN validation (IR + 24 digits)
  if (sheba_number && !/^IR\d{24}$/.test(sheba_number)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_SHEBA', message: 'شماره شبا باید با IR شروع و ۲۴ رقم داشته باشد' } },
      { status: 400 }
    )
  }

  // Upsert so it works even if the coach has no wallet row yet (older coaches
  // that predate wallet auto-creation on registration).
  await prisma.wallet.upsert({
    where:  { coachId: coach.id },
    update: {
      ...(sheba_number    !== undefined ? { shebaNumber:    sheba_number }    : {}),
      ...(account_holder  !== undefined ? { accountHolder:  account_holder }  : {}),
    },
    create: {
      coachId:       coach.id,
      shebaNumber:   sheba_number   ?? null,
      accountHolder: account_holder ?? null,
    },
  })

  return NextResponse.json({ success: true, message: 'اطلاعات حساب با موفقیت ذخیره شد' })
}
