import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// DELETE /api/admin/inspiration/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req, 'support_agent')
  if (!auth.ok) return authError(auth.status, auth.message)

  const deleted = await prisma.inspirationPost.delete({ where: { id: params.id } }).catch(() => null)
  if (!deleted) return NextResponse.json({ success: false, error: { message: 'پست یافت نشد' } }, { status: 404 })
  return NextResponse.json({ success: true })
}
