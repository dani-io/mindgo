import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// GET /api/admin/inspiration?filter=all|visible|hidden&page=1&limit=30
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'support_agent')
  if (!auth.ok) return authError(auth.status, auth.message)

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all'
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '30', 10))

  const where: Record<string, unknown> =
    filter === 'visible' ? { isVisible: true }
    : filter === 'hidden' ? { isVisible: false }
    : {}

  const [posts, total] = await Promise.all([
    prisma.inspirationPost.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where:   where as any,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        user: { select: { id: true, name: true, phone: true } },
        _count: { select: { reactions: true } },
      },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.inspirationPost.count({ where: where as any }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      posts: posts.map((p) => ({
        id:            p.id,
        content:       p.content,
        template:      p.template,
        isAnonymous:   p.isAnonymous,
        isVisible:     p.isVisible,
        reactionCount: p._count.reactions,
        createdAt:     p.createdAt,
        user:          p.isAnonymous ? null : p.user,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  })
}
