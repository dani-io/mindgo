import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendOTP, getProviderName } from '@/lib/services/sms.service'

const OTP_TTL_SECONDS = 120
const SELFHOSTED_OTP_TTL_SECONDS = 300 // gateway-managed codes live longer
const TEST_OTP_CODE = '12345'
const RATE_LIMIT_WINDOW_MINUTES = 10
const RATE_LIMIT_MAX = 3

function generateOtp(): string {
  return String(Math.floor(10000 + Math.random() * 90000))
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0')
}

function isValidIranPhone(phone: string): boolean {
  return /^09[0-9]{9}$/.test(phone)
}

function getTestPhones(): string[] {
  return (process.env.TEST_PHONES ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
}

export async function POST(req: NextRequest) {
  let body: { phone?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_BODY', message: 'درخواست نامعتبر است' } },
      { status: 400 }
    )
  }

  const phone = normalizePhone(body.phone ?? '')

  if (!isValidIranPhone(phone)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PHONE', message: 'شماره موبایل وارد شده صحیح نیست' } },
      { status: 400 }
    )
  }

  const provider = getProviderName()
  const isTestPhone = getTestPhones().includes(phone)

  // ── Test phones: fixed code, saved to our DB, returned in response, no SMS ──
  if (isTestPhone) {
    const code = TEST_OTP_CODE
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000)
    await prisma.otpCode.create({ data: { phone, code, expiresAt } })
    console.log(`[OTP] (test) phone=${phone} code=${code}`)

    return NextResponse.json({
      success: true,
      data: { expires_in: OTP_TTL_SECONDS },
      message: 'کد تأیید ارسال شد',
      code,
    })
  }

  // ── Self-hosted gateway: it generates, stores & verifies its own code ──────
  // We don't persist anything to our DB; the gateway owns rate limiting too.
  if (provider === 'selfhosted') {
    try {
      const sent = await sendOTP(phone) // no code — gateway generates it
      if (!sent) {
        console.error(`[OTP] selfhosted gateway send failed for phone=${phone}`)
      }
    } catch (err) {
      console.error(`[OTP] selfhosted gateway send threw for phone=${phone}:`, err)
    }

    // SMS failures must not block login — always return success.
    return NextResponse.json({
      success: true,
      data: { expires_in: SELFHOSTED_OTP_TTL_SECONDS },
      message: 'کد تأیید ارسال شد',
    })
  }

  // ── DB-backed providers (kavenegar / smsir): we generate & store the code ──
  // Rate limiting: max 3 OTPs per 10 minutes.
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)
  const recentCount = await prisma.otpCode.count({
    where: { phone, createdAt: { gte: windowStart } },
  })

  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT',
          message: `در هر ۱۰ دقیقه حداکثر ${RATE_LIMIT_MAX} کد می‌توانید دریافت کنید. لطفاً کمی صبر کنید.`,
        },
      },
      { status: 429 }
    )
  }

  const code = generateOtp()
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000)
  await prisma.otpCode.create({ data: { phone, code, expiresAt } })
  console.log(`[OTP] phone=${phone} code=${code} expires=${expiresAt.toISOString()}`)

  const isDev = process.env.NODE_ENV !== 'production'
  const smsProviderConfigured = provider !== ''
  if (smsProviderConfigured) {
    try {
      const sent = await sendOTP(phone, code)
      if (!sent) {
        console.error(`[OTP] SMS delivery failed for phone=${phone}`)
      }
    } catch (err) {
      console.error(`[OTP] SMS delivery threw for phone=${phone}:`, err)
    }
  }

  return NextResponse.json({
    success: true,
    data: { expires_in: OTP_TTL_SECONDS },
    message: 'کد تأیید ارسال شد',
    // Expose the code in dev so you can log in without a real SMS.
    ...(isDev ? { code } : {}),
  })
}
