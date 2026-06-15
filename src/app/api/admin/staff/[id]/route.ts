import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// PATCH /api/admin/staff/[id]  body: { role?, isActive? }  (super_admin only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({}))
  const { role, isActive } = body as { role?: string; isActive?: boolean }

  if (role && !['support_manager', 'support_agent'].includes(role)) {
    return NextResponse.json({ success: false, error: { message: 'نقش نامعتبر (نمی‌توان مدیر ارشد ساخت)' } }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (role)                      data.role     = role
  if (typeof isActive === 'boolean') data.isActive = isActive

  const updated = await prisma.adminRole.update({
    where:   { id: params.id },
    data,
    include: { user: { select: { id: true, name: true, phone: true } } },
  }).catch(() => null)

  if (!updated) return NextResponse.json({ success: false, error: { message: 'کارمند یافت نشد' } }, { status: 404 })
  return NextResponse.json({ success: true, data: updated })
}

// DELETE /api/admin/staff/[id]  (super_admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  // Prevent removing own super_admin access
  const record = await prisma.adminRole.findUnique({ where: { id: params.id } })
  if (!record) return NextResponse.json({ success: false, error: { message: 'کارمند یافت نشد' } }, { status: 404 })
  if (record.userId === auth.userId) {
    return NextResponse.json({ success: false, error: { message: 'نمی‌توانید دسترسی خود را حذف کنید' } }, { status: 403 })
  }

  await prisma.adminRole.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
