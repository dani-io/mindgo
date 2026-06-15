import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// PATCH /api/admin/inspiration/[id]/visibility  body: { isVisible: boolean }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req, 'support_agent')
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({}))
  if (typeof body.isVisible !== 'boolean') {
    return NextResponse.json({ success: false, error: { message: 'isVisible الزامی است' } }, { status: 400 })
  }

  const updated = await prisma.inspirationPost.update({
    where:  { id: params.id },
    data:   { isVisible: body.isVisible },
    select: { id: true, isVisible: true },
  }).catch(() => null)

  if (!updated) return NextResponse.json({ success: false, error: { message: 'پست یافت نشد' } }, { status: 404 })
  return NextResponse.json({ success: true, data: updated })
}
