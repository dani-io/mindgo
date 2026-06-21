import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { coachId: string } }
) {
  const coach = await prisma.coachProfile.findUnique({
    where: { id: params.coachId },
    include: {
      user:            { select: { id: true, name: true } },
      specializations: { include: { spec: true } },
      certificates:    { orderBy: { year: 'desc' } },
      packages:        { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!coach || coach.status !== 'approved') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'کوچ یافت نشد' } },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      id:            coach.id,
      userId:        coach.userId,
      name:          coach.user.name ?? '—',
      shortBio:      coach.shortBio,
      fullBio:       coach.fullBio,
      genderAccept:  coach.genderAccept,
      voiceIntroUrl: coach.voiceIntroUrl,
      videoIntroUrl: coach.videoIntroUrl,
      totalSessions: coach.totalSessions,
      avgRating:     Number(coach.avgRating),
      specializations: coach.specializations.map((cs) => ({
        id: cs.spec.id, name: cs.spec.name, slug: cs.spec.slug, icon: cs.spec.icon,
      })),
      certificates: coach.certificates.map((c) => ({
        id: c.id, title: c.title, issuer: c.issuer, year: c.year, verified: c.verified,
      })),
      packages: coach.packages.map((p) => ({
        id: p.id, name: p.name, description: p.description,
        sessionCount: p.sessionCount, durationMinutes: p.durationMinutes,
        priceToman: p.priceToman, includesChat: p.includesChat, isIntro: p.isIntro,
      })),
      reviews: coach.reviews.map((r) => ({
        id: r.id, rating: r.rating, comment: r.comment,
        isAnonymous: r.isAnonymous,
        reviewerName: r.isAnonymous ? null : (r.user.name ?? 'رهجو'),
        createdAt: r.createdAt.toISOString(),
      })),
    },
  })
}
