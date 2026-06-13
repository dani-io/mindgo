/**
 * Seed: 5 sample coaches with specializations, packages, certificates, reviews.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-coaches.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Specializations ───────────────────────────────────────
const SPECS = [
  { name: 'لایف کوچینگ',         slug: 'life-coaching',     icon: '🌱' },
  { name: 'بیزینس کوچینگ',       slug: 'business-coaching', icon: '💼' },
  { name: 'کوچینگ شغلی',         slug: 'career-coaching',   icon: '🎯' },
  { name: 'مدیریت استرس',        slug: 'stress-management', icon: '🧘' },
  { name: 'سلامت و تندرستی',     slug: 'health-wellness',   icon: '💪' },
  { name: 'روابط و ارتباطات',    slug: 'relationships',     icon: '🤝' },
  { name: 'هدف‌گذاری',           slug: 'goal-setting',      icon: '🏹' },
  { name: 'اعتماد به نفس',       slug: 'self-confidence',   icon: '✨' },
]

// ── Coach seed data ───────────────────────────────────────
const COACHES = [
  {
    phone: '09121111111',
    name: 'مریم احمدی',
    shortBio: 'همراه شما در مسیر تبدیل شدن به بهترین نسخه خودتان',
    fullBio: 'من مریم احمدی هستم، لایف کوچ با بیش از ۸ سال تجربه. در این مسیر به بیش از ۲۰۰ نفر کمک کرده‌ام تا اهداف زندگی‌شان را بیابند و قدم به قدم به آن نزدیک شوند. رویکرد من ترکیبی از کوچینگ ICF و روان‌شناسی مثبت است.',
    genderAccept: 'all'        as const,
    totalSessions: 120,
    avgRating: 4.9,
    specs: ['life-coaching', 'stress-management'],
    packages: [
      { name: 'جلسه معارفه', description: 'یک جلسه ۶۰ دقیقه‌ای آشنایی و ارزیابی', sessionCount: 1, priceToman: 500_000,   isIntro: true,  includesChat: false },
      { name: 'پکیج رشد ۴ جلسه', description: '۴ جلسه ۶۰ دقیقه‌ای + پشتیبانی چت بین جلسات',         sessionCount: 4, priceToman: 1_800_000, isIntro: false, includesChat: true  },
      { name: 'پکیج جامع ۸ جلسه', description: '۸ جلسه ۶۰ دقیقه‌ای + پشتیبانی چت + مواد آموزشی',  sessionCount: 8, priceToman: 3_200_000, isIntro: false, includesChat: true  },
    ],
    certificates: [
      { title: 'ACC — Associate Certified Coach', issuer: 'ICF International',     year: 1399, verified: true  },
      { title: 'دیپلم لایف کوچینگ',               issuer: 'موسسه کوچینگ ایران', year: 1397, verified: true  },
    ],
    reviews: [
      { rating: 5, comment: 'واقعاً مسیر زندگی من رو شفاف کرد. مریم خانم نگاه عمیق و صادقانه‌ای دارن.',  isAnonymous: false, reviewerPhone: '09130000001' },
      { rating: 5, comment: 'بعد از ۴ جلسه تونستم شغلم رو عوض کنم. ممنون از راهنمایی‌های ارزشمندشون.', isAnonymous: true,  reviewerPhone: '09130000002' },
      { rating: 4, comment: 'جلسات خیلی خوب بود. فقط کاش وقت بیشتری برای هر موضوع داشتیم.',            isAnonymous: false, reviewerPhone: '09130000003' },
    ],
  },
  {
    phone: '09122222222',
    name: 'رضا محمدی',
    shortBio: 'کمک به کارآفرینان برای ساخت کسب‌وکار موفق و زندگی متعادل',
    fullBio: 'رضا محمدی، کوچ بیزینس با ۱۲ سال سابقه کارآفرینی و ۵ سال تجربه کوچینگ. با من اگر می‌خواهید کسب‌وکارتان را به سطح بعدی ببرید. روش من مبتنی بر داده، هدفمند و کاملاً اختصاصی برای شرایط کسب‌وکار شماست.',
    genderAccept: 'all'        as const,
    totalSessions: 85,
    avgRating: 4.8,
    specs: ['business-coaching', 'goal-setting'],
    packages: [
      { name: 'جلسه آشنایی', description: 'یک جلسه ۴۵ دقیقه‌ای ارزیابی کسب‌وکار', sessionCount: 1, priceToman: 800_000,   isIntro: true,  includesChat: false },
      { name: 'پکیج بیزینس', description: '۶ جلسه ۹۰ دقیقه‌ای بیزینس کوچینگ + پشتیبانی', sessionCount: 6, priceToman: 4_200_000, isIntro: false, includesChat: true  },
    ],
    certificates: [
      { title: 'Professional Business Coach', issuer: 'European Coaching Institute', year: 1400, verified: true  },
      { title: 'MBA',                          issuer: 'دانشگاه تهران',              year: 1393, verified: false },
    ],
    reviews: [
      { rating: 5, comment: 'رضا آقا دقیقاً می‌دونن یک کارآفرین به چه کمکی نیاز داره.',    isAnonymous: false, reviewerPhone: '09130000001' },
      { rating: 5, comment: 'بعد از ۶ جلسه درآمدم ۴۰٪ افزایش پیدا کرد. جدی می‌گم!',       isAnonymous: true,  reviewerPhone: '09130000002' },
    ],
  },
  {
    phone: '09123333333',
    name: 'سارا کریمی',
    shortBio: 'تخصص در کوچینگ شغلی و تقویت اعتماد به نفس برای بانوان',
    fullBio: 'سارا کریمی، کوچ شغلی با ۶ سال تجربه. متخصص در کمک به بانوان برای پیدا کردن مسیر شغلی ایده‌آل، تقویت اعتماد به نفس و شکستن سقف شیشه‌ای. اگر احساس می‌کنید توانایی‌هایتان بیشتر از جایگاه فعلی‌تان است، اینجاییم.',
    genderAccept: 'female_only' as const,
    totalSessions: 65,
    avgRating: 4.7,
    specs: ['career-coaching', 'self-confidence'],
    packages: [
      { name: 'جلسه معارفه', description: 'یک جلسه ۶۰ دقیقه‌ای برای شناخت هم',          sessionCount: 1, priceToman: 300_000,   isIntro: true,  includesChat: false },
      { name: 'پکیج مسیر شغلی', description: '۵ جلسه ۶۰ دقیقه‌ای + تمرینات خودشناسی', sessionCount: 5, priceToman: 2_500_000, isIntro: false, includesChat: true  },
    ],
    certificates: [
      { title: 'Career Coach Certification', issuer: 'ICF', year: 1401, verified: true },
    ],
    reviews: [
      { rating: 5, comment: 'سارا خانم بهم کمک کردن خودم رو باور کنم. الان مدیر یه تیم ۱۰ نفره هستم!', isAnonymous: false, reviewerPhone: '09130000003' },
      { rating: 4, comment: 'جلسات هدفمند و کاربردی بود.',                                                isAnonymous: true,  reviewerPhone: '09130000001' },
    ],
  },
  {
    phone: '09124444444',
    name: 'علی رضایی',
    shortBio: 'متخصص مدیریت استرس و بهبود کیفیت زندگی با رویکرد علمی',
    fullBio: 'علی رضایی، روانشناس و کوچ با تخصص در مدیریت استرس. پس از ۱۰ سال تحقیق و کار بالینی، به این نتیجه رسیدم که کوچینگ می‌تواند نتایج ملموس‌تر و سریع‌تری برای افراد ایجاد کند. رویکرد من مبتنی بر شواهد علمی و تکنیک‌های اثبات‌شده است.',
    genderAccept: 'all'        as const,
    totalSessions: 45,
    avgRating: 4.6,
    specs: ['stress-management', 'health-wellness'],
    packages: [
      { name: 'جلسه اول رایگان', description: 'یک جلسه ۳۰ دقیقه‌ای آشنایی رایگان', sessionCount: 1, priceToman: 0,         isIntro: true,  includesChat: false },
      { name: 'پکیج آرامش',      description: '۴ جلسه ۶۰ دقیقه‌ای + تکنیک‌های مدیتیشن', sessionCount: 4, priceToman: 1_600_000, isIntro: false, includesChat: false },
    ],
    certificates: [
      { title: 'دکترای روانشناسی بالینی',         issuer: 'دانشگاه شهید بهشتی', year: 1395, verified: true },
      { title: 'Mindfulness-Based Stress Reduction', issuer: 'MBSR Institute',     year: 1400, verified: true },
    ],
    reviews: [
      { rating: 5, comment: 'تکنیک‌هایی که آقای رضایی یاد دادن هنوز هر روز استفاده می‌کنم.', isAnonymous: false, reviewerPhone: '09130000002' },
      { rating: 4, comment: 'رویکرد علمی و مستند داره. خیلی قابل اعتماده.',                   isAnonymous: false, reviewerPhone: '09130000003' },
    ],
  },
  {
    phone: '09125555555',
    name: 'فاطمه موسوی',
    shortBio: 'کوچ روابط و ارتباطات — برای ساختن پیوندهای عمیق‌تر و معناداتر',
    fullBio: 'فاطمه موسوی، با ۱۵ سال تجربه در حوزه روابط انسانی، به شما کمک می‌کند ارتباطات بهتری با خودتان، خانواده و محیط کارتان بسازید. بیشتر از ۵۰۰ نفر با کمک من توانسته‌اند روابط‌شان را متحول کنند.',
    genderAccept: 'female_only' as const,
    totalSessions: 200,
    avgRating: 4.9,
    specs: ['relationships', 'life-coaching'],
    packages: [
      { name: 'جلسه آشنایی',  description: 'یک جلسه ۶۰ دقیقه‌ای ارزیابی روابط',             sessionCount: 1,  priceToman: 600_000,   isIntro: true,  includesChat: false },
      { name: 'پکیج ارتباطات', description: '۶ جلسه ۶۰ دقیقه‌ای + کتاب‌کار اختصاصی',       sessionCount: 6,  priceToman: 3_000_000, isIntro: false, includesChat: true  },
      { name: 'پکیج VIP',     description: '۱۲ جلسه ۹۰ دقیقه‌ای + پشتیبانی نامحدود',       sessionCount: 12, priceToman: 7_200_000, isIntro: false, includesChat: true  },
    ],
    certificates: [
      { title: 'Certified Relationship Coach', issuer: 'ICF',                             year: 1396, verified: true },
      { title: 'NLP Practitioner',             issuer: 'ANLP',                            year: 1398, verified: true },
      { title: 'Family Therapy Certificate',   issuer: 'دانشگاه علوم پزشکی تهران',       year: 1394, verified: true },
    ],
    reviews: [
      { rating: 5, comment: 'فاطمه خانم رابطه من و همسرم رو نجات دادن. واقعاً ممنونم.',          isAnonymous: true,  reviewerPhone: '09130000001' },
      { rating: 5, comment: 'یکی از بهترین تصمیمات عمرم بود که باهاشون کار کردم.',                isAnonymous: false, reviewerPhone: '09130000002' },
      { rating: 5, comment: 'کاملاً حرفه‌ای، همدلانه و قابل اعتماد.',                             isAnonymous: false, reviewerPhone: '09130000003' },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────

const REVIEW_PHONES = ['09130000001', '09130000002', '09130000003']
const REVIEW_NAMES  = ['زهرا', 'امیر', 'مهسا']

async function ensureReviewUsers() {
  const users = []
  for (let i = 0; i < REVIEW_PHONES.length; i++) {
    const u = await prisma.user.upsert({
      where:  { phone: REVIEW_PHONES[i] },
      update: { name: REVIEW_NAMES[i] },
      create: { phone: REVIEW_PHONES[i], name: REVIEW_NAMES[i], role: 'rehjoo' },
    })
    users.push(u)
  }
  return users
}

// ── Main ──────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding coaches...\n')

  // 1. Specializations
  for (const spec of SPECS) {
    await prisma.specialization.upsert({
      where:  { slug: spec.slug },
      update: { name: spec.name, icon: spec.icon },
      create: spec,
    })
  }
  const allSpecs = await prisma.specialization.findMany()
  const specBySlug = Object.fromEntries(allSpecs.map((s) => [s.slug, s.id]))
  console.log(`✓ ${SPECS.length} specializations`)

  // 2. Review users (fake rehjoos)
  const reviewUsers = await ensureReviewUsers()
  const reviewUserByPhone = Object.fromEntries(reviewUsers.map((u) => [u.phone, u]))
  console.log(`✓ ${reviewUsers.length} review users`)

  // 3. Coaches
  for (const data of COACHES) {
    // User
    const user = await prisma.user.upsert({
      where:  { phone: data.phone },
      update: { name: data.name, role: 'rahbalad' },
      create: { phone: data.phone, name: data.name, role: 'rahbalad' },
    })

    // Coach profile
    const profile = await prisma.coachProfile.upsert({
      where:  { userId: user.id },
      update: {
        shortBio: data.shortBio, fullBio: data.fullBio,
        genderAccept: data.genderAccept, status: 'approved',
        totalSessions: data.totalSessions, avgRating: data.avgRating,
      },
      create: {
        userId: user.id, shortBio: data.shortBio, fullBio: data.fullBio,
        genderAccept: data.genderAccept, status: 'approved',
        totalSessions: data.totalSessions, avgRating: data.avgRating,
      },
    })

    // Specializations
    for (const slug of data.specs) {
      const specId = specBySlug[slug]
      if (!specId) continue
      await prisma.coachSpecialization.upsert({
        where:  { coachId_specId: { coachId: profile.id, specId } },
        update: {},
        create: { coachId: profile.id, specId },
      })
    }

    // Certificates (replace)
    await prisma.certificate.deleteMany({ where: { coachId: profile.id } })
    for (const cert of data.certificates) {
      await prisma.certificate.create({ data: { coachId: profile.id, ...cert } })
    }

    // Packages (replace)
    await prisma.package.deleteMany({ where: { coachId: profile.id } })
    const createdPackages: { id: string }[] = []
    for (let i = 0; i < data.packages.length; i++) {
      const pkg = data.packages[i]
      const created = await prisma.package.create({
        data: { coachId: profile.id, durationMinutes: 60, sortOrder: i, ...pkg },
      })
      createdPackages.push(created)
    }

    // Reviews — each needs a booking + session (schema requirement)
    await prisma.review.deleteMany({ where: { coachId: profile.id } })
    const firstPkg = createdPackages[0]
    for (const rev of data.reviews) {
      const reviewer = reviewUserByPhone[rev.reviewerPhone]
      if (!reviewer || !firstPkg) continue

      const booking = await prisma.booking.create({
        data: {
          userId: reviewer.id, coachId: profile.id, packageId: firstPkg.id,
          sessionDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          sessionTime: '18:00', status: 'completed',
        },
      })
      const session = await prisma.session.create({
        data: { bookingId: booking.id, status: 'completed', confirmedByUser: true },
      })
      await prisma.review.create({
        data: {
          userId: reviewer.id, coachId: profile.id, sessionId: session.id,
          rating: rev.rating, comment: rev.comment, isAnonymous: rev.isAnonymous,
        },
      })
    }

    console.log(`✓ ${data.name} — ${data.reviews.length} reviews, ${data.packages.length} packages`)
  }

  console.log('\n✅ Done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
