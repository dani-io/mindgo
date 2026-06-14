import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// POST /api/partners/find
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { sharedGoal?: string }

  // Check if already has active partner
  const existing = await prisma.partnership.findFirst({
    where: {
      OR: [{ user1Id: payload.sub }, { user2Id: payload.sub }],
      status: 'active',
    },
  })
  if (existing) {
    return Response.json({ success: false, error: { message: 'قبلاً پارتنر فعال داری' } }, { status: 409 })
  }

  // Find someone waiting (pending partnership where they're user1 and have no match yet)
  // Simple matching: find a pending request from another user with no partner2 yet
  const waitingRequest = await prisma.partnership.findFirst({
    where: {
      status: 'pending',
      user2Id: 'UNMATCHED',
      user1Id: { not: payload.sub },
    },
  })

  if (waitingRequest) {
    // Match found — activate this partnership
    const partnership = await prisma.partnership.update({
      where: { id: waitingRequest.id },
      data: {
        user2Id:    payload.sub,
        sharedGoal: body.sharedGoal?.trim() || waitingRequest.sharedGoal,
        status:     'active',
      },
      include: {
        user1: { select: { id: true, name: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, avatarUrl: true } },
      },
    })
    return Response.json({ success: true, data: partnership })
  }

  // No match — create a pending request
  const request = await prisma.partnership.create({
    data: {
      user1Id:    payload.sub,
      user2Id:    'UNMATCHED',
      sharedGoal: body.sharedGoal?.trim(),
      status:     'pending',
    },
  })

  return Response.json({ success: true, data: { ...request, waiting: true } })
}
