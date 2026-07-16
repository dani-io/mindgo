import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { isValidCardNumber } from '@/lib/payments'

async function requireCoach(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value
  if (!token) return { error: true as const, res: NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 }) }
  const payload = await verifyToken(token)
  if (!payload) return { error: true as const, res: NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 }) }
  return { error: false as const, userId: payload.sub, phone: payload.phone }
}

export async function GET(req: NextRequest) {
  const auth = await requireCoach(req)
  if (auth.error) return auth.res

  const coach = await prisma.coachProfile.findUnique({
    where: { userId: auth.userId },
    include: {
      user:            { select: { id: true, name: true, phone: true } },
      specializations: { include: { spec: true } },
      certificates:    { orderBy: { year: 'desc' } },
      packages:        { orderBy: { sortOrder: 'asc' } },
      timeSlots:       { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      wallet:          true,
      bookings: {
        where: {
          status: { in: ['confirmed'] },
          sessionDate: { gte: new Date() },
        },
        include: {
          user:    { select: { id: true, name: true } },
          package: { select: { name: true, durationMinutes: true } },
        },
        orderBy: { sessionDate: 'asc' },
        take: 10,
      },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!coach) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'پروفایل کوچ یافت نشد' } },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      id:              coach.id,
      userId:          coach.userId,
      name:            coach.user.name ?? '',
      phone:           coach.user.phone,
      shortBio:        coach.shortBio,
      fullBio:         coach.fullBio,
      genderAccept:    coach.genderAccept,
      voiceIntroUrl:   coach.voiceIntroUrl,
      status:          coach.status,
      cardNumber:      coach.cardNumber,
      cardHolderName:  coach.cardHolderName,
      commissionRate:  Number(coach.commissionRate),
      totalSessions:   coach.totalSessions,
      avgRating:       Number(coach.avgRating),
      specializations: coach.specializations.map((cs) => ({
        id:   cs.spec.id,
        name: cs.spec.name,
        slug: cs.spec.slug,
        icon: cs.spec.icon,
      })),
      certificates: coach.certificates,
      packages:     coach.packages.map((p) => ({
        id:              p.id,
        name:            p.name,
        description:     p.description,
        sessionCount:    p.sessionCount,
        durationMinutes: p.durationMinutes,
        priceToman:      p.priceToman,
        includesChat:    p.includesChat,
        isIntro:         p.isIntro,
        isActive:        p.isActive,
        sortOrder:       p.sortOrder,
      })),
      timeSlots: coach.timeSlots.map((ts) => ({
        id:          ts.id,
        dayOfWeek:   ts.dayOfWeek,
        startTime:   ts.startTime,
        endTime:     ts.endTime,
        isAvailable: ts.isAvailable,
      })),
      wallet: coach.wallet
        ? {
            totalEarned:     coach.wallet.totalEarned,
            lockedAmount:    coach.wallet.lockedAmount,
            availableAmount: coach.wallet.availableAmount,
            shebaNumber:     coach.wallet.shebaNumber,
            accountHolder:   coach.wallet.accountHolder,
          }
        : null,
      upcomingBookings: coach.bookings.map((b) => ({
        id:          b.id,
        sessionDate: b.sessionDate,
        sessionTime: b.sessionTime,
        status:      b.status,
        jitsiRoomId: b.jitsiRoomId,
        clientName:  b.user.name ?? 'رهجو',
        packageName: b.package.name,
        duration:    b.package.durationMinutes,
      })),
      recentReviews: coach.reviews.map((r) => ({
        id:           r.id,
        rating:       r.rating,
        comment:      r.comment,
        isAnonymous:  r.isAnonymous,
        reviewerName: r.isAnonymous ? null : (r.user.name ?? 'رهجو'),
        createdAt:    r.createdAt.toISOString(),
      })),
    },
  })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireCoach(req)
  if (auth.error) return auth.res

  const body = await req.json()
  const { name, short_bio, full_bio, gender_accept, specialization_ids, card_number, card_holder_name } = body

  // Card number: 16 digits only (strip formatting spaces/dashes first).
  let normalizedCard: string | undefined
  if (card_number !== undefined) {
    const digits = String(card_number).replace(/\D/g, '')
    if (digits !== '' && !isValidCardNumber(digits)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CARD', message: 'شماره کارت باید ۱۶ رقم باشد' } },
        { status: 400 }
      )
    }
    normalizedCard = digits
  }

  const coach = await prisma.coachProfile.findUnique({ where: { userId: auth.userId } })
  if (!coach) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    if (name !== undefined) {
      await tx.user.update({ where: { id: auth.userId }, data: { name } })
    }

    const profileUpdates: Record<string, unknown> = {}
    if (short_bio     !== undefined) profileUpdates.shortBio     = short_bio
    if (full_bio      !== undefined) profileUpdates.fullBio      = full_bio
    if (gender_accept !== undefined) profileUpdates.genderAccept = gender_accept
    if (normalizedCard !== undefined)     profileUpdates.cardNumber     = normalizedCard || null
    if (card_holder_name !== undefined)   profileUpdates.cardHolderName = String(card_holder_name).trim() || null

    if (Object.keys(profileUpdates).length > 0) {
      await tx.coachProfile.update({ where: { id: coach.id }, data: profileUpdates })
    }

    if (Array.isArray(specialization_ids)) {
      await tx.coachSpecialization.deleteMany({ where: { coachId: coach.id } })
      if (specialization_ids.length > 0) {
        await tx.coachSpecialization.createMany({
          data: specialization_ids.map((specId: string) => ({ coachId: coach.id, specId })),
          skipDuplicates: true,
        })
      }
    }
  })

  return NextResponse.json({ success: true, message: 'پروفایل با موفقیت به‌روزرسانی شد' })
}
