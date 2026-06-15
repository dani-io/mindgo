import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// GET /api/admin/users?search=&role=rehjoo|rahbalad|all&page=1&limit=20
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'support_agent')
  if (!auth.ok) return authError(auth.status, auth.message)

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() ?? ''
  const role   = searchParams.get('role') ?? 'all'
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '30', 10))

  const where: Record<string, unknown> = {}

  if (role === 'rehjoo')   where.role = 'rehjoo'
  if (role === 'rahbalad') where.role = 'rahbalad'

  if (search) {
    where.OR = [
      { name:  { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where:   where as any,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id:          true,
        name:        true,
        phone:       true,
        role:        true,
        avatarUrl:   true,
        isActive:    true,
        streakCount: true,
        xpPoints:    true,
        level:       true,
        createdAt:   true,
        adminRole:   { select: { role: true, isActive: true } },
      },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.user.count({ where: where as any }),
  ])

  return NextResponse.json({
    success: true,
    data:    { users, total, page, totalPages: Math.ceil(total / limit) },
  })
}
