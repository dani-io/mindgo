import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { signToken } from '@/lib/auth'

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0')
}

export async function POST(req: NextRequest) {
  let body: { phone?: string; code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_BODY', message: 'درخواست نامعتبر است' } },
      { status: 400 }
    )
  }

  const phone = normalizePhone(body.phone ?? '')
  const code = (body.code ?? '').trim()

  if (!phone || !code) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_FIELDS', message: 'شماره موبایل و کد تأیید الزامی هستند' } },
      { status: 400 }
    )
  }

  // Find latest unused, unexpired OTP for this phone
  const otp = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CODE', message: 'کد وارد شده اشتباه یا منقضی شده است' } },
      { status: 401 }
    )
  }

  // Mark OTP as used
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  })

  // Upsert user
  let user = await prisma.user.findUnique({ where: { phone } })
  const isNew = !user

  if (!user) {
    user = await prisma.user.create({
      data: { phone, role: 'rehjoo' },
    })
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })
  }

  const token = await signToken({
    sub: user.id,
    phone: user.phone,
    role: user.role,
  })

  return NextResponse.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        is_new: isNew,
      },
      expires_in: 86400,
    },
  })
}
