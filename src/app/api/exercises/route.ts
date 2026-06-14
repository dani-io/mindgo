import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/exercises
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type  = searchParams.get('type') as 'meditation' | 'breathing' | 'planning' | null
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 50)

  const items = await prisma.exercise.findMany({
    where: {
      isPublished: true,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take:    limit,
  })

  return Response.json({ success: true, data: items })
}

// POST /api/exercises  (admin only)
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload || payload.role !== 'admin') {
    return Response.json({ success: false, error: { message: 'دسترسی ندارید' } }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as {
    title?:           string
    description?:     string
    type?:            string
    durationMinutes?: number
    difficulty?:      string
    audioUrl?:        string
    steps?:           unknown[]
    isPublished?:     boolean
  }

  const VALID_TYPES = ['meditation', 'breathing', 'planning']
  const VALID_DIFF  = ['beginner', 'intermediate', 'advanced']

  if (!body.title?.trim()) return Response.json({ success: false, error: { message: 'عنوان الزامی است' } }, { status: 400 })
  if (!body.type || !VALID_TYPES.includes(body.type)) return Response.json({ success: false, error: { message: 'نوع نامعتبر است' } }, { status: 400 })

  const item = await prisma.exercise.create({
    data: {
      title:           body.title.trim(),
      description:     body.description?.trim(),
      type:            body.type as 'meditation' | 'breathing' | 'planning',
      durationMinutes: body.durationMinutes ?? 10,
      difficulty:      (VALID_DIFF.includes(body.difficulty ?? '') ? body.difficulty : 'beginner') as 'beginner' | 'intermediate' | 'advanced',
      audioUrl:        body.audioUrl?.trim(),
      steps:           (body.steps ?? []) as string[],
      isPublished:     body.isPublished ?? false,
    },
  })

  return Response.json({ success: true, data: item }, { status: 201 })
}
