import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const specs = await prisma.specialization.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ success: true, data: specs })
}
