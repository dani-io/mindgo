import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// POST /api/challenges/[id]/join
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const challenge = await prisma.challenge.findUnique({ where: { id: params.id } })
  if (!challenge) return Response.json({ success: false, error: { message: 'چالش یافت نشد' } }, { status: 404 })
  if (challenge.status === 'completed') {
    return Response.json({ success: false, error: { message: 'این چالش به پایان رسیده است' } }, { status: 400 })
  }

  const existing = await prisma.challengeParticipant.findUnique({
    where: { userId_challengeId: { userId: payload.sub, challengeId: params.id } },
  })
  if (existing) return Response.json({ success: false, error: { message: 'قبلاً در این چالش شرکت کرده‌اید' } }, { status: 400 })

  const body = await req.json().catch(() => ({})) as { isAnonymous?: boolean }

  const [participant] = await prisma.$transaction([
    prisma.challengeParticipant.create({
      data: {
        userId:      payload.sub,
        challengeId: params.id,
        isAnonymous: body.isAnonymous ?? false,
      },
    }),
    prisma.challenge.update({
      where: { id: params.id },
      data:  { participantCount: { increment: 1 } },
    }),
  ])

  return Response.json({ success: true, data: { participantId: participant.id, isAnonymous: participant.isAnonymous } }, { status: 201 })
}
