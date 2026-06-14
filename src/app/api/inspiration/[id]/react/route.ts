import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// POST /api/inspiration/[id]/react
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { type?: string }
  const VALID = ['strong', 'growing', 'love', 'fire']
  if (!body.type || !VALID.includes(body.type)) {
    return Response.json({ success: false, error: { message: 'نوع واکنش نامعتبر است' } }, { status: 400 })
  }

  const post = await prisma.inspirationPost.findUnique({ where: { id: params.id } })
  if (!post || !post.isVisible) return Response.json({ success: false, error: { message: 'پست یافت نشد' } }, { status: 404 })

  const existing = await prisma.reaction.findUnique({
    where: { userId_postId: { userId: payload.sub, postId: params.id } },
  })

  let reacted       = false
  let newType: string | null = null
  let countDelta    = 0

  if (!existing) {
    // New reaction
    await prisma.reaction.create({ data: { userId: payload.sub, postId: params.id, type: body.type as 'strong' | 'growing' | 'love' | 'fire' } })
    reacted    = true
    newType    = body.type
    countDelta = 1
  } else if (existing.type === body.type) {
    // Toggle off
    await prisma.reaction.delete({ where: { userId_postId: { userId: payload.sub, postId: params.id } } })
    reacted    = false
    newType    = null
    countDelta = -1
  } else {
    // Change type (no count change)
    await prisma.reaction.update({
      where: { userId_postId: { userId: payload.sub, postId: params.id } },
      data:  { type: body.type as 'strong' | 'growing' | 'love' | 'fire' },
    })
    reacted = true
    newType = body.type
  }

  const updated = await prisma.inspirationPost.update({
    where: { id: params.id },
    data:  { reactionCount: { increment: countDelta } },
    select: { reactionCount: true },
  })

  return Response.json({ success: true, data: { reacted, type: newType, reactionCount: updated.reactionCount } })
}
