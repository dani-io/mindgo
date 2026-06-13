import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search     = searchParams.get('search')?.trim() || ''
  const specSlug   = searchParams.get('specialization') || ''
  const gender     = searchParams.get('gender_accept') || ''
  const page       = Math.max(1, Number(searchParams.get('page') || 1))
  const limit      = Math.min(20, Number(searchParams.get('limit') || 12))

  const where: Prisma.CoachProfileWhereInput = {
    status: 'approved',
    ...(gender === 'female_only' ? { genderAccept: 'female_only' } : {}),
    ...(specSlug
      ? { specializations: { some: { spec: { slug: specSlug } } } }
      : {}),
    ...(search
      ? {
          OR: [
            { user:           { name: { contains: search, mode: 'insensitive' } } },
            { specializations: { some: { spec: { name: { contains: search, mode: 'insensitive' } } } } },
          ],
        }
      : {}),
  }

  const [coaches, total] = await Promise.all([
    prisma.coachProfile.findMany({
      where,
      include: {
        user:            { select: { id: true, name: true } },
        specializations: { include: { spec: true } },
      },
      orderBy: [{ avgRating: 'desc' }, { totalSessions: 'desc' }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.coachProfile.count({ where }),
  ])

  const data = coaches.map((c) => ({
    id:            c.id,
    userId:        c.userId,
    name:          c.user.name ?? '—',
    shortBio:      c.shortBio,
    genderAccept:  c.genderAccept,
    totalSessions: c.totalSessions,
    avgRating:     Number(c.avgRating),
    specializations: c.specializations.map((cs) => ({
      id:   cs.spec.id,
      name: cs.spec.name,
      slug: cs.spec.slug,
      icon: cs.spec.icon,
    })),
  }))

  return NextResponse.json({
    success: true,
    data,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  })
}
