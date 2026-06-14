import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/inspiration
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const posts = await prisma.inspirationPost.findMany({
    where:   { isVisible: true },
    orderBy: { createdAt: 'desc' },
    take:    30,
    include: {
      user:      { select: { name: true } },
      reactions: { select: { userId: true, type: true } },
    },
  })

  const data = posts.map((p) => {
    const counts = { strong: 0, growing: 0, love: 0, fire: 0 }
    let myReaction: string | null = null

    for (const r of p.reactions) {
      counts[r.type]++
      if (r.userId === payload.sub) myReaction = r.type
    }

    return {
      id:            p.id,
      template:      p.template,
      content:       p.content,
      isAnonymous:   p.isAnonymous,
      authorName:    p.isAnonymous ? 'یک هم‌سفر' : (p.user.name ?? 'رهجو'),
      reactionCount: p.reactionCount,
      reactions:     counts,
      myReaction,
      createdAt:     p.createdAt,
    }
  })

  return Response.json({ success: true, data })
}

// POST /api/inspiration
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    template?:    string
    content?:     string
    isAnonymous?: boolean
  }

  const VALID_TEMPLATES = ['book_quote', 'achievement', 'gratitude']
  if (!body.template || !VALID_TEMPLATES.includes(body.template)) {
    return Response.json({ success: false, error: { message: 'قالب نامعتبر است' } }, { status: 400 })
  }
  if (!body.content?.trim() || body.content.trim().length < 10) {
    return Response.json({ success: false, error: { message: 'متن باید حداقل ۱۰ کاراکتر باشد' } }, { status: 400 })
  }
  if (body.content.trim().length > 500) {
    return Response.json({ success: false, error: { message: 'متن نباید بیشتر از ۵۰۰ کاراکتر باشد' } }, { status: 400 })
  }

  const post = await prisma.inspirationPost.create({
    data: {
      userId:      payload.sub,
      template:    body.template as 'book_quote' | 'achievement' | 'gratitude',
      content:     body.content.trim(),
      isAnonymous: body.isAnonymous ?? false,
    },
    include: { user: { select: { name: true } } },
  })

  return Response.json({
    success: true,
    data: {
      id:            post.id,
      template:      post.template,
      content:       post.content,
      isAnonymous:   post.isAnonymous,
      authorName:    post.isAnonymous ? 'یک هم‌سفر' : (post.user.name ?? 'رهجو'),
      reactionCount: 0,
      reactions:     { strong: 0, growing: 0, love: 0, fire: 0 },
      myReaction:    null,
      createdAt:     post.createdAt,
    },
  }, { status: 201 })
}
