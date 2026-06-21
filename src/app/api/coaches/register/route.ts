import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'ابتدا وارد شوید' } }, { status: 401 })
  }
  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر است' } }, { status: 401 })
  }

  const existing = await prisma.coachProfile.findUnique({ where: { userId: payload.sub } })
  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_EXISTS', message: 'شما قبلاً به عنوان کوچ ثبت‌نام کرده‌اید' } },
      { status: 409 }
    )
  }

  const body = await req.json()
  const { name, short_bio, full_bio, gender_accept, specialization_ids, certificates } = body

  // Promote role and optionally update name
  const updatedUser = await prisma.user.update({
    where: { id: payload.sub },
    data: { role: 'rahbalad', ...(name ? { name } : {}) },
  })

  const coachProfile = await prisma.$transaction(async (tx) => {
    const profile = await tx.coachProfile.create({
      data: {
        userId:       payload.sub,
        shortBio:     short_bio    ?? null,
        fullBio:      full_bio     ?? null,
        genderAccept: gender_accept ?? 'all',
        status:       'pending',
      },
    })

    if (Array.isArray(specialization_ids) && specialization_ids.length > 0) {
      await tx.coachSpecialization.createMany({
        data: specialization_ids.map((specId: string) => ({ coachId: profile.id, specId })),
        skipDuplicates: true,
      })
    }

    if (Array.isArray(certificates) && certificates.length > 0) {
      await tx.certificate.createMany({
        data: certificates.map((c: { title: string; issuer: string; year: number }) => ({
          coachId: profile.id,
          title:   c.title,
          issuer:  c.issuer,
          year:    Number(c.year),
          verified: false,
        })),
      })
    }

    await tx.wallet.create({ data: { coachId: profile.id } })

    return profile
  })

  // Re-issue JWT with rahbalad role
  const newToken = await signToken({ sub: payload.sub, phone: updatedUser.phone, role: 'rahbalad' })

  const res = NextResponse.json({
    success: true,
    data: { coach_profile_id: coachProfile.id, status: 'pending', token: newToken },
    message: 'ثبت‌نام موفقیت‌آمیز. پروفایل شما در انتظار تأیید مدیر است.',
  })

  res.cookies.set('mg_token', newToken, {
    httpOnly: false,
    maxAge:   86400,
    path:     '/',
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
  })

  return res
}
