import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function getCoachId(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const coach = await prisma.coachProfile.findUnique({ where: { userId: payload.sub }, select: { id: true } })
  return coach?.id ?? null
}

export async function GET(req: NextRequest) {
  const coachId = await getCoachId(req)
  if (!coachId) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const packages = await prisma.package.findMany({
    where: { coachId },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ success: true, data: packages })
}

export async function POST(req: NextRequest) {
  const coachId = await getCoachId(req)
  if (!coachId) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const body = await req.json()
  const { name, description, session_count, duration_minutes, price_toman, includes_chat, is_intro } = body

  if (!name || !session_count || !duration_minutes || price_toman === undefined) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_PARAMS', message: 'اطلاعات ناقص است' } }, { status: 400 })
  }

  // Get current max sortOrder
  const last = await prisma.package.findFirst({
    where: { coachId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })

  const pkg = await prisma.package.create({
    data: {
      coachId,
      name,
      description:     description     ?? null,
      sessionCount:    Number(session_count),
      durationMinutes: Number(duration_minutes),
      priceToman:      Number(price_toman),
      includesChat:    includes_chat   ?? false,
      isIntro:         is_intro        ?? false,
      isActive:        true,
      sortOrder:       (last?.sortOrder ?? -1) + 1,
    },
  })

  return NextResponse.json({ success: true, data: pkg }, { status: 201 })
}
