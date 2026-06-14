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
  return isNaN(v) ? 5 : Math.max(1, Math.min(10, Math.round(v)))
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
    data: {
      current: history[0] ?? null,
      history,
    },
  })
}

// POST /api/wheel-of-life
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const { health, finance, career, skills, relations, mind } = body

  if ([health, finance, career, skills, relations, mind].some((v) => v === undefined)) {
    return Response.json({ success: false, error: { message: 'همه ابعاد باید مشخص شوند' } }, { status: 400 })
  }

  const assessment = await prisma.wheelOfLife.create({
    data: {
      userId:    payload.sub,
      health:    clamp(health),
      finance:   clamp(finance),
      career:    clamp(career),
      skills:    clamp(skills),
      relations: clamp(relations),
      mind:      clamp(mind),
    },
  })

  return Response.json({ success: true, data: assessment }, { status: 201 })
}
