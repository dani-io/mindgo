import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return Response.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const userId = payload.sub

  // All messages involving current user, newest first
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    include: {
      sender:   { select: { id: true, name: true, phone: true } },
      receiver: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Build conversation map — first occurrence per partner = last message
  const convMap = new Map<string, {
    partnerId:     string
    partnerName:   string | null
    partnerPhone:  string
    lastMessage:   string
    lastMessageAt: Date
    isLastMine:    boolean
    unreadCount:   number
  }>()

  for (const msg of messages) {
    const isMine    = msg.senderId === userId
    const partnerId = isMine ? msg.receiverId : msg.senderId
    const partner   = isMine ? msg.receiver   : msg.sender

    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, {
        partnerId,
        partnerName:   partner.name,
        partnerPhone:  partner.phone,
        lastMessage:   msg.content,
        lastMessageAt: msg.createdAt,
        isLastMine:    isMine,
        unreadCount:   0,
      })
    }

    // Count all unread messages FROM partner TO me
    if (!isMine && !msg.isRead) {
      convMap.get(partnerId)!.unreadCount++
    }
  }

  const conversations = Array.from(convMap.values()).sort(
    (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
  )

  return Response.json({ success: true, data: conversations })
}
