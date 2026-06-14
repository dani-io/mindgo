import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'support_manager')
  if (!auth.ok) return authError(auth.status, auth.message)

  const coaches = await prisma.coachProfile.findMany({
    where: { status: 'pending' },
    include: {
      user: { select: { id: true, name: true, phone: true, createdAt: true } },
      specializations: { include: { spec: { select: { name: true } } } },
      certificates: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return Response.json({
    success: true,
    data: coaches.map((c) => ({
      id:             c.id,
      userId:         c.userId,
      name:           c.user.name,
      phone:          c.user.phone,
      shortBio:       c.shortBio,
      fullBio:        c.fullBio,
      genderAccept:   c.genderAccept,
      voiceIntroUrl:  c.voiceIntroUrl,
      commissionRate: Number(c.commissionRate),
      specializations: c.specializations.map((s) => s.spec.name),
      certificates:    c.certificates.map((cert) => ({
        id:       cert.id,
        title:    cert.title,
        issuer:   cert.issuer,
        year:     cert.year,
        imageUrl: cert.imageUrl,
      })),
      appliedAt: c.createdAt,
    })),
  })
}
