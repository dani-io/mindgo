/**
 * Seed sample conversations between the coach (09179498400) and test clients.
 * Creates test users if they don't exist, then inserts messages.
 *
 * Usage: npx tsx scripts/seed-messages.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get the coach user
  const coachUser = await prisma.user.findUnique({ where: { phone: '09179498400' } })
  if (!coachUser) {
    console.error('❌ Coach user (09179498400) not found. Log in first.')
    process.exit(1)
  }
  console.log(`✅ Coach: ${coachUser.name ?? coachUser.phone} (${coachUser.id})`)

  // Create test clients if they don't exist
  const testClients = [
    { phone: '09120000001', name: 'سارا محمدی' },
    { phone: '09120000002', name: 'علی رضایی' },
  ]

  const clients: Array<{ id: string; name: string | null; phone: string }> = []
  for (const tc of testClients) {
    const user = await prisma.user.upsert({
      where:  { phone: tc.phone },
      update: { name: tc.name },
      create: { phone: tc.phone, name: tc.name },
    })
    clients.push(user)
    console.log(`✅ Client: ${user.name} (${user.id})`)
  }

  // Clear existing test messages to avoid duplicates on re-run
  await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: coachUser.id, receiverId: { in: clients.map((c) => c.id) } },
        { receiverId: coachUser.id, senderId: { in: clients.map((c) => c.id) } },
      ],
    },
  })
  console.log('🗑  Cleared old seed messages')

  // Seed conversations
  const now = Date.now()

  const conversations: Array<{
    senderId:   string
    receiverId: string
    content:    string
    isRead:     boolean
    createdAt:  Date
  }> = [
    // === Coach ↔ Sara ===
    {
      senderId:   coachUser.id,
      receiverId: clients[0].id,
      content:    'سلام سارا خانم! خوش اومدی به Mindgo. چطور می‌تونم کمکت کنم؟',
      isRead:     true,
      createdAt:  new Date(now - 4 * 24 * 60 * 60 * 1000),
    },
    {
      senderId:   clients[0].id,
      receiverId: coachUser.id,
      content:    'سلام! ممنون. می‌خوام روی مدیریت استرس کار کنم.',
      isRead:     true,
      createdAt:  new Date(now - 4 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
    },
    {
      senderId:   coachUser.id,
      receiverId: clients[0].id,
      content:    'عالیه! در جلسه اول بیشتر باهم آشنا می‌شیم و یه نقشه راه می‌سازیم.',
      isRead:     true,
      createdAt:  new Date(now - 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
    },
    {
      senderId:   clients[0].id,
      receiverId: coachUser.id,
      content:    'باشه، منتظر جلسه هستم. وقت جلسه کِیه؟',
      isRead:     true,
      createdAt:  new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
    {
      senderId:   coachUser.id,
      receiverId: clients[0].id,
      content:    'جلسه شما فردا ساعت ۱۰ صبحه. لینک اتاق رو در پروفایل می‌بینی.',
      isRead:     true,
      createdAt:  new Date(now - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
    },
    {
      senderId:   clients[0].id,
      receiverId: coachUser.id,
      content:    'ممنون! یه سوال — آیا باید قبل از جلسه چیزی آماده کنم؟',
      isRead:     false,
      createdAt:  new Date(now - 30 * 60 * 1000),
    },

    // === Coach ↔ Ali ===
    {
      senderId:   clients[1].id,
      receiverId: coachUser.id,
      content:    'سلام، می‌خوام برای انتخاب مسیر شغلی کمک بگیرم.',
      isRead:     true,
      createdAt:  new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      senderId:   coachUser.id,
      receiverId: clients[1].id,
      content:    'سلام علی آقا! خوش اومدی. چه حوزه‌ای رو مدنظر داری؟',
      isRead:     true,
      createdAt:  new Date(now - 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000),
    },
    {
      senderId:   clients[1].id,
      receiverId: coachUser.id,
      content:    'بین مهندسی نرم‌افزار و مدیریت محصول مردد هستم.',
      isRead:     true,
      createdAt:  new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      senderId:   coachUser.id,
      receiverId: clients[1].id,
      content:    'هر دو مسیر عالی هستن! در جلسه اول با یه تست شخصیت شروع می‌کنیم تا بهتر بفهمیم کدوم بهت می‌خوره.',
      isRead:     false,
      createdAt:  new Date(now - 2 * 60 * 60 * 1000),
    },
  ]

  await prisma.message.createMany({ data: conversations })
  console.log(`✅ Created ${conversations.length} messages`)

  console.log('\n📊 Summary:')
  console.log(`   Coach ↔ ${clients[0].name}: 6 messages (1 unread from client)`)
  console.log(`   Coach ↔ ${clients[1].name}: 4 messages (1 unread from client)`)
  console.log('\nYou can now view conversations at /messages or /coach-messages')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
