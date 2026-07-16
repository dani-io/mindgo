import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { getAdminRole } from '@/lib/rbac'
import { verifyOTP as gatewayVerifyOTP, getProviderName } from '@/lib/services/sms.service'

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0')
}

function getTestPhones(): string[] {
  return (process.env.TEST_PHONES ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
}

// Verify against our own OTP DB (used for test phones + kavenegar/smsir).
async function verifyViaDb(phone: string, code: string): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) return false

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  })
  return true
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

  const provider = getProviderName()
  const isTestPhone = getTestPhones().includes(phone)

  // Self-hosted gateway verifies its own codes. Test phones always go through
  // our DB (their code was stored locally, not at the gateway).
  const useGateway = provider === 'selfhosted' && !isTestPhone
  const verified = useGateway
    ? await gatewayVerifyOTP(phone, code)
    : await verifyViaDb(phone, code)

  if (!verified) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CODE', message: 'کد وارد شده اشتباه یا منقضی شده است' } },
      { status: 401 }
    )
  }

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

  // Check if this user also has admin access (independent of user.role)
  const adminRole = await getAdminRole(user.id)

  const tokenPayload: { sub: string; phone: string; role: string; adminRole?: string } = {
    sub:   user.id,
    phone: user.phone,
    role:  user.role,
  }
  if (adminRole) tokenPayload.adminRole = adminRole

  const token = await signToken(tokenPayload)

  const res = NextResponse.json({
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

  // Set cookie so middleware (edge runtime, no localStorage access) can verify auth
  res.cookies.set('mg_token', token, {
    httpOnly: false,   // false so client-side code can also read it if needed
    maxAge: 86400,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return res
}
