import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/partners/me
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const partnership = await prisma.partnership.findFirst({
    where: {
      OR: [{ user1Id: payload.sub }, { user2Id: payload.sub }],
      status: 'active',
    },
    include: {
      user1: { select: { id: true, name: true, avatarUrl: true, streakCount: true, isPrivateProfile: true } },
      user2: { select: { id: true, name: true, avatarUrl: true, streakCount: true, isPrivateProfile: true } },
      checkins: {
        where: { checkinDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        select: { userId: true },
      },
    },
  })

  if (!partnership) return Response.json({ success: true, data: null })

  const rawPartner = partnership.user1Id === payload.sub ? partnership.user2 : partnership.user1
  const myCheckinToday    = partnership.checkins.some((c) => c.userId === payload.sub)
  const partnerCheckinToday = partnership.checkins.some((c) => c.userId !== payload.sub)

  // Respect the partner's privacy: mask name (and drop avatar) when private.
  const partner = rawPartner.isPrivateProfile
    ? { id: rawPartner.id, name: 'یک هم‌سفر', avatarUrl: null, streakCount: rawPartner.streakCount }
    : { id: rawPartner.id, name: rawPartner.name, avatarUrl: rawPartner.avatarUrl, streakCount: rawPartner.streakCount }

  return Response.json({
    success: true,
    data: {
      id:         partnership.id,
      sharedGoal: partnership.sharedGoal,
      createdAt:  partnership.createdAt,
      partner,
      myCheckinToday,
      partnerCheckinToday,
    },
  })
}
