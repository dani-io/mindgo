import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, ROLE_LABELS } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'support_agent')
  if (!auth.ok) return Response.json({ success: false, error: { message: auth.message } }, { status: auth.status })

  const user = await prisma.user.findUnique({
    where:  { id: auth.userId },
    select: { id: true, name: true, phone: true },
  })

  return Response.json({
    success: true,
    data: {
      id:        user?.id,
      name:      user?.name,
      phone:     user?.phone,
      adminRole: auth.adminRole,
      roleLabel: ROLE_LABELS[auth.adminRole],
    },
  })
}
