import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

function clamp(n: unknown): number {
  const v = Number(n)
  return isNaN(v) ? 0 : Math.max(0, Math.min(10, Math.round(v)))
}

// GET /api/wheel-of-life
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const history = await prisma.wheelOfLife.findMany({
    where:   { userId: payload.sub },
    orderBy: { createdAt: 'desc' },
    take:    5,
  })

  return Response.json({
    success: true,
    data: { current: history[0] ?? null, history },
  })
}

// POST /api/wheel-of-life
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const { physical, relations, career, finance, leisure, love, spiritual, mental, maritalStatus, answers } = body

  const required = { physical, relations, career, finance, leisure, love, spiritual, mental }
  if (Object.values(required).some((v) => v === undefined)) {
    return Response.json({ success: false, error: { message: 'همه ابعاد باید مشخص شوند' } }, { status: 400 })
  }

  const assessment = await prisma.wheelOfLife.create({
    data: {
      userId:        payload.sub,
      // Map to legacy fields for backward compat
      health:        clamp(physical),
      finance:       clamp(finance),
      career:        clamp(career),
      skills:        clamp(mental),
      relations:     clamp(relations),
      mind:          clamp(spiritual),
      // New 8-dimension fields
      physical:      clamp(physical),
      leisure:       clamp(leisure),
      love:          clamp(love),
      spiritual:     clamp(spiritual),
      mental:        clamp(mental),
      maritalStatus: typeof maritalStatus === 'string' ? maritalStatus : null,
      answers:       (answers && typeof answers === 'object') ? (answers as import('@prisma/client').Prisma.JsonObject) : undefined,
    },
  })

  return Response.json({ success: true, data: assessment }, { status: 201 })
}
