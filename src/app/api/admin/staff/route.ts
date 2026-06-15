import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// GET /api/admin/staff  (super_admin only)
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  const staff = await prisma.adminRole.findMany({
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, phone: true, createdAt: true } } },
  })

  return NextResponse.json({
    success: true,
    data:    staff.map((s) => ({
      id:        s.id,
      role:      s.role,
      isActive:  s.isActive,
      createdAt: s.createdAt,
      user:      s.user,
    })),
  })
}

// POST /api/admin/staff  body: { phone, role }  (super_admin only)
export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({}))
  const { phone, role } = body as { phone?: string; role?: string }

  if (!phone?.trim() || !role) {
    return NextResponse.json({ success: false, error: { message: 'phone و role الزامی است' } }, { status: 400 })
  }
  if (role === 'super_admin') {
    return NextResponse.json({ success: false, error: { message: 'مدیر ارشد فقط از طریق اسکریپت اضافه می‌شود' } }, { status: 403 })
  }
  if (!['support_manager', 'support_agent'].includes(role)) {
    return NextResponse.json({ success: false, error: { message: 'نقش نامعتبر' } }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { phone: phone.trim() }, select: { id: true, name: true, phone: true } })
  if (!user) {
    return NextResponse.json({ success: false, error: { message: 'کاربری با این شماره یافت نشد' } }, { status: 404 })
  }

  const adminRole = await prisma.adminRole.upsert({
    where:  { userId: user.id },
    create: { userId: user.id, role: role as 'support_manager' | 'support_agent', isActive: true },
    update: { role: role as 'support_manager' | 'support_agent', isActive: true },
  })

  return NextResponse.json({ success: true, data: { ...adminRole, user } }, { status: 201 })
}
