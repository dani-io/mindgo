import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// GET /api/admin/feedback?status=&type= — list feedback with optional filters.
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'support_agent')
  if (!auth.ok) return authError(auth.status, auth.message)

  const status = req.nextUrl.searchParams.get('status')
  const type   = req.nextUrl.searchParams.get('type')

  const where: Record<string, unknown> = {}
  if (status && ['new', 'reviewed', 'resolved'].includes(status)) where.status = status
  if (type && ['bug', 'suggestion', 'comment'].includes(type))    where.type   = type

  const [items, counts] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.feedback.groupBy({ by: ['status'], _count: true }),
  ])

  const countByStatus = { new: 0, reviewed: 0, resolved: 0 } as Record<string, number>
  for (const c of counts) countByStatus[c.status] = c._count

  return Response.json({
    success: true,
    data: items.map((f) => ({
      id:            f.id,
      type:          f.type,
      content:       f.content,
      screenshotUrl: f.screenshotUrl,
      pageUrl:       f.pageUrl,
      isAnonymous:   f.isAnonymous,
      status:        f.status,
      adminNotes:    f.adminNotes,
      createdAt:     f.createdAt.toISOString(),
      userName:      f.isAnonymous ? null : (f.user?.name ?? null),
      userPhone:     f.isAnonymous ? null : (f.user?.phone ?? null),
    })),
    counts: {
      all:      countByStatus.new + countByStatus.reviewed + countByStatus.resolved,
      new:      countByStatus.new,
      reviewed: countByStatus.reviewed,
      resolved: countByStatus.resolved,
    },
  })
}
