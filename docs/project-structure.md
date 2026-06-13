# Project Structure — پلتفرم کوچینگ و توسعه فردی

**نسخه:** ۱.۰  
**فریمورک:** Next.js 14+ (App Router)  
**زبان:** TypeScript  
**استایل:** Tailwind CSS  
**دیتابیس:** PostgreSQL + Prisma ORM  
**احراز هویت:** NextAuth.js (Credentials Provider + OTP)  
**PWA:** next-pwa  

---

## ساختار پوشه‌ها

```
coaching-platform/
├── .env.local                    # متغیرهای محیطی (محلی)
├── .env.example                  # نمونه متغیرها
├── next.config.js                # تنظیمات Next.js + PWA
├── tailwind.config.ts            # تنظیمات Tailwind + تم + فونت
├── tsconfig.json                 # تنظیمات TypeScript
├── package.json
├── prisma/
│   ├── schema.prisma             # تعریف مدل‌های دیتابیس
│   ├── seed.ts                   # داده‌های اولیه (تخصص‌ها، ادمین)
│   └── migrations/               # فایل‌های مایگریشن
│
├── public/
│   ├── manifest.json             # PWA manifest (فارسی، RTL)
│   ├── sw.js                     # Service Worker (auto-generated)
│   ├── icons/                    # آیکون‌های PWA (192, 512)
│   └── fonts/
│       └── IRANSansX/            # فایل‌های فونت (woff2)
│           ├── IRANSansX-Regular.woff2
│           ├── IRANSansX-Medium.woff2
│           ├── IRANSansX-SemiBold.woff2
│           └── IRANSansX-Bold.woff2
│
├── src/
│   ├── app/                      # === App Router (Pages) ===
│   │   ├── layout.tsx            # Root layout (RTL, فونت, تم)
│   │   ├── page.tsx              # Landing page
│   │   ├── globals.css           # استایل‌های عمومی + فونت
│   │   ├── loading.tsx           # Loading state عمومی
│   │   ├── not-found.tsx         # صفحه ۴۰۴
│   │   ├── error.tsx             # صفحه خطا
│   │   │
│   │   ├── (auth)/               # گروه صفحات احراز هویت
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # صفحه ورود (OTP)
│   │   │   └── layout.tsx        # لایوت بدون ناوبری
│   │   │
│   │   ├── (rehjoo)/             # === پنل رهجو ===
│   │   │   ├── layout.tsx        # لایوت با Bottom Nav + FAB
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # داشبورد (صفحه اصلی)
│   │   │   ├── growth-room/
│   │   │   │   ├── page.tsx      # اتاق رشد (تب خصوصی)
│   │   │   │   ├── journal/
│   │   │   │   │   └── page.tsx  # دفترچه شکرگزاری
│   │   │   │   ├── goals/
│   │   │   │   │   └── page.tsx  # اهداف من
│   │   │   │   ├── habits/
│   │   │   │   │   └── page.tsx  # ردیاب عادت‌ها
│   │   │   │   └── wheel/
│   │   │   │       └── page.tsx  # چرخ حیات
│   │   │   ├── coaches/
│   │   │   │   ├── page.tsx      # مارکت‌پلیس راه‌بلدها
│   │   │   │   └── [coachId]/
│   │   │   │       ├── page.tsx  # پروفایل راه‌بلد
│   │   │   │       └── book/
│   │   │   │           └── page.tsx  # رزرو جلسه
│   │   │   ├── tribe/
│   │   │   │   ├── page.tsx      # قبیله (چالش‌ها + بورد)
│   │   │   │   └── [challengeId]/
│   │   │   │       └── page.tsx  # جزئیات چالش
│   │   │   ├── payment/
│   │   │   │   ├── page.tsx      # صفحه پرداخت
│   │   │   │   ├── success/
│   │   │   │   │   └── page.tsx  # پرداخت موفق
│   │   │   │   └── failed/
│   │   │   │       └── page.tsx  # پرداخت ناموفق
│   │   │   ├── sessions/
│   │   │   │   ├── page.tsx      # لیست جلسات من
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx  # اتاق جلسه (Jitsi)
│   │   │   ├── messages/
│   │   │   │   ├── page.tsx      # لیست مکالمات
│   │   │   │   └── [userId]/
│   │   │   │       └── page.tsx  # چت با یک نفر
│   │   │   ├── profile/
│   │   │   │   └── page.tsx      # پروفایل من (داشبورد رشد)
│   │   │   └── settings/
│   │   │       └── page.tsx      # تنظیمات (تم، نوتیفیکیشن)
│   │   │
│   │   ├── (rahbalad)/           # === پنل راه‌بلد ===
│   │   │   ├── layout.tsx        # لایوت کوچ (سایدبار یا تب)
│   │   │   ├── coach-dashboard/
│   │   │   │   └── page.tsx      # داشبورد کوچ
│   │   │   ├── coach-profile/
│   │   │   │   ├── page.tsx      # ویرایش پروفایل
│   │   │   │   ├── certificates/
│   │   │   │   │   └── page.tsx  # مدیریت مدارک
│   │   │   │   └── voice-intro/
│   │   │   │       └── page.tsx  # ضبط/آپلود صدا
│   │   │   ├── coach-availability/
│   │   │   │   └── page.tsx      # زمان‌بندی
│   │   │   ├── coach-packages/
│   │   │   │   └── page.tsx      # مدیریت پکیج‌ها
│   │   │   ├── coach-sessions/
│   │   │   │   ├── page.tsx      # لیست جلسات
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx  # اتاق جلسه
│   │   │   ├── coach-wallet/
│   │   │   │   └── page.tsx      # کیف پول + درخواست تسویه
│   │   │   └── coach-messages/
│   │   │       └── page.tsx      # پیام‌ها
│   │   │
│   │   ├── (admin)/              # === پنل ادمین ===
│   │   │   ├── layout.tsx        # لایوت ادمین (سایدبار)
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx      # داشبورد آماری
│   │   │   │   ├── coaches/
│   │   │   │   │   ├── page.tsx  # مدیریت کوچ‌ها
│   │   │   │   │   ├── pending/
│   │   │   │   │   │   └── page.tsx  # صف تأیید
│   │   │   │   │   └── [coachId]/
│   │   │   │   │       └── page.tsx  # جزئیات کوچ
│   │   │   │   ├── users/
│   │   │   │   │   ├── page.tsx  # مدیریت رهجوها
│   │   │   │   │   └── [userId]/
│   │   │   │   │       └── page.tsx  # جزئیات رهجو
│   │   │   │   ├── finance/
│   │   │   │   │   ├── page.tsx  # داشبورد مالی
│   │   │   │   │   ├── wallets/
│   │   │   │   │   │   └── page.tsx  # کیف پول‌ها
│   │   │   │   │   └── payouts/
│   │   │   │   │       └── page.tsx  # درخواست‌های تسویه
│   │   │   │   ├── disputes/
│   │   │   │   │   ├── page.tsx  # اتاق داوری
│   │   │   │   │   └── [disputeId]/
│   │   │   │   │       └── page.tsx  # جزئیات شکایت
│   │   │   │   ├── sessions/
│   │   │   │   │   └── page.tsx  # لاگ جلسات
│   │   │   │   ├── tickets/
│   │   │   │   │   └── page.tsx  # تیکت‌های پشتیبانی
│   │   │   │   ├── community/
│   │   │   │   │   └── page.tsx  # مدیریت قبیله
│   │   │   │   ├── staff/
│   │   │   │   │   └── page.tsx  # مدیریت کارمندان (RBAC)
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx  # تنظیمات پلتفرم
│   │   │
│   │   └── api/                  # === API Routes ===
│   │       ├── auth/
│   │       │   ├── otp/
│   │       │   │   ├── send/route.ts
│   │       │   │   └── verify/route.ts
│   │       │   ├── refresh/route.ts
│   │       │   └── [...nextauth]/route.ts
│   │       ├── users/
│   │       │   └── me/route.ts
│   │       ├── coaches/
│   │       │   ├── register/route.ts
│   │       │   ├── me/
│   │       │   │   ├── route.ts
│   │       │   │   ├── availability/route.ts
│   │       │   │   ├── packages/route.ts
│   │       │   │   ├── wallet/route.ts
│   │       │   │   └── voice-intro/route.ts
│   │       │   └── [coachId]/route.ts
│   │       ├── marketplace/
│   │       │   ├── coaches/route.ts
│   │       │   └── specializations/route.ts
│   │       ├── bookings/
│   │       │   └── route.ts
│   │       ├── sessions/
│   │       │   └── [sessionId]/route.ts
│   │       ├── payments/
│   │       │   ├── initiate/route.ts
│   │       │   └── verify/route.ts
│   │       ├── messages/
│   │       │   └── route.ts
│   │       ├── moods/route.ts
│   │       ├── habits/route.ts
│   │       ├── goals/route.ts
│   │       ├── journal/route.ts
│   │       ├── challenges/route.ts
│   │       ├── inspiration/route.ts
│   │       ├── notifications/route.ts
│   │       ├── support/route.ts
│   │       ├── admin/
│   │       │   ├── coaches/route.ts
│   │       │   ├── users/route.ts
│   │       │   ├── finance/route.ts
│   │       │   ├── disputes/route.ts
│   │       │   ├── tickets/route.ts
│   │       │   ├── staff/route.ts
│   │       │   └── settings/route.ts
│   │       └── webhooks/
│   │           ├── zarinpal/route.ts
│   │           ├── snappay/route.ts
│   │           └── google-calendar/route.ts
│   │
│   ├── components/               # === کامپوننت‌های مشترک ===
│   │   ├── ui/                   # کامپوننت‌های پایه (Design System)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tag.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   └── ProgressBar.tsx
│   │   │
│   │   ├── layout/               # لایوت‌ها
│   │   │   ├── BottomNav.tsx     # نوار ناوبری پایین (رهجو)
│   │   │   ├── FAB.tsx           # دکمه شناور پشتیبانی
│   │   │   ├── AdminSidebar.tsx  # سایدبار ادمین
│   │   │   ├── CoachNav.tsx      # ناوبری کوچ
│   │   │   ├── ThemeToggle.tsx   # سوییچ تم
│   │   │   └── Header.tsx        # هدر عمومی
│   │   │
│   │   ├── dashboard/            # کامپوننت‌های داشبورد رهجو
│   │   │   ├── GreetingHeader.tsx     # پیام پویا + Streak
│   │   │   ├── MoodTracker.tsx        # ثبت مود ۵ حالته
│   │   │   ├── TodaySteps.tsx         # قدم‌های امروز
│   │   │   ├── NextSession.tsx        # کارت جلسه بعدی
│   │   │   ├── DailyInsight.tsx       # دوز آگاهی روزانه
│   │   │   └── StreakBadge.tsx        # بج شعله
│   │   │
│   │   ├── coach/                # کامپوننت‌های مربوط به کوچ
│   │   │   ├── CoachCard.tsx          # کارت کوچ (مارکت‌پلیس)
│   │   │   ├── CoachProfile.tsx       # پروفایل کامل
│   │   │   ├── TrustBox.tsx           # جعبه ابزار اعتماد
│   │   │   ├── VoicePlayer.tsx        # پلیر صدای راه‌بلد
│   │   │   ├── ReviewCard.tsx         # کارت نظر
│   │   │   ├── GenderBadge.tsx        # بج جنسیت پذیرش
│   │   │   ├── PackageSelector.tsx    # انتخاب پکیج
│   │   │   └── SpecializationFilter.tsx # فیلتر تخصص
│   │   │
│   │   ├── booking/              # رزرو و جلسه
│   │   │   ├── ShamsiCalendar.tsx     # تقویم شمسی
│   │   │   ├── TimeSlotPicker.tsx     # انتخاب ساعت
│   │   │   ├── BookingSummary.tsx     # خلاصه رزرو
│   │   │   ├── PaymentMethodPicker.tsx # انتخاب روش پرداخت
│   │   │   ├── DiscountCode.tsx       # اعمال کد تخفیف
│   │   │   └── JitsiRoom.tsx          # اتاق جلسه آنلاین
│   │   │
│   │   ├── growth/               # رشد فردی
│   │   │   ├── RadarChart.tsx         # گراف عنکبوتی (چرخ حیات)
│   │   │   ├── HabitCheckbox.tsx      # چک‌باکس عادت
│   │   │   ├── GoalProgressBar.tsx    # نوار پیشرفت هدف
│   │   │   ├── JournalEditor.tsx      # ویرایشگر دفترچه
│   │   │   ├── MoodHistory.tsx        # نمودار تاریخچه مود
│   │   │   ├── AchievementTimeline.tsx # تایم‌لاین دستاوردها
│   │   │   └── XPLevelBadge.tsx       # نمایش سطح و XP
│   │   │
│   │   ├── tribe/                # قبیله
│   │   │   ├── ChallengeCard.tsx      # کارت چالش
│   │   │   ├── Leaderboard.tsx        # جدول امتیازات
│   │   │   ├── InspirationCard.tsx    # کارت بورد الهام‌بخش
│   │   │   ├── ReactionBar.tsx        # ری‌اکشن‌های مثبت
│   │   │   └── PostTemplate.tsx       # قالب پست (book/achievement/gratitude)
│   │   │
│   │   ├── wallet/               # مالی
│   │   │   ├── WalletOverview.tsx     # نمای کلی کیف پول
│   │   │   ├── TransactionList.tsx    # لیست تراکنش‌ها
│   │   │   ├── PayoutRequest.tsx      # فرم درخواست تسویه
│   │   │   └── EscrowStatus.tsx       # وضعیت قفل/آزاد
│   │   │
│   │   └── admin/                # ادمین
│   │       ├── CoachApprovalCard.tsx   # کارت تأیید کوچ
│   │       ├── DisputePanel.tsx        # پنل داوری
│   │       ├── PayoutTable.tsx         # جدول تسویه‌ها
│   │       ├── StatsCard.tsx           # کارت آماری
│   │       └── RBACGuard.tsx           # محافظ سطح دسترسی
│   │
│   ├── lib/                      # === توابع و سرویس‌ها ===
│   │   ├── db.ts                 # Prisma Client instance
│   │   ├── auth.ts               # تنظیمات NextAuth
│   │   ├── validations/          # Zod schemas
│   │   │   ├── auth.ts
│   │   │   ├── booking.ts
│   │   │   ├── coach.ts
│   │   │   ├── payment.ts
│   │   │   └── user.ts
│   │   ├── services/             # Business Logic
│   │   │   ├── otp.service.ts         # ارسال/تأیید OTP (کاوه‌نگار)
│   │   │   ├── sms.service.ts         # ارسال پیامک عمومی
│   │   │   ├── email.service.ts       # ارسال ایمیل (نجوا)
│   │   │   ├── payment.service.ts     # زرین‌پال + اسنپ‌پی
│   │   │   ├── escrow.service.ts      # منطق Escrow (lock/release/burn)
│   │   │   ├── booking.service.ts     # منطق رزرو
│   │   │   ├── jitsi.service.ts       # تولید لینک Jitsi
│   │   │   ├── calendar-sync.service.ts # سینک Google Calendar
│   │   │   ├── notification.service.ts  # ارسال نوتیفیکیشن
│   │   │   ├── streak.service.ts      # محاسبه Streak
│   │   │   ├── gamification.service.ts # XP و مدال‌ها
│   │   │   └── upload.service.ts      # آپلود فایل (S3/R2)
│   │   ├── utils/
│   │   │   ├── shamsi.ts             # تبدیل تاریخ شمسی/میلادی
│   │   │   ├── format.ts             # فرمت اعداد فارسی + تومان
│   │   │   ├── time-greeting.ts      # پیام پویا بر اساس ساعت
│   │   │   └── slug.ts               # تولید slug فارسی
│   │   └── constants/
│   │       ├── moods.ts              # تعریف ۵ حالت مود
│   │       ├── reactions.ts          # ۴ ری‌اکشن مثبت
│   │       ├── roles.ts              # نقش‌ها و دسترسی‌ها
│   │       └── theme.ts              # رنگ‌ها و توکن‌های تم
│   │
│   ├── hooks/                    # === Custom Hooks ===
│   │   ├── useAuth.ts            # وضعیت احراز هویت
│   │   ├── useTheme.ts           # مدیریت تم (auto/dark/light)
│   │   ├── useAutoTheme.ts       # سوییچ خودکار بر اساس ساعت
│   │   ├── useMood.ts            # ثبت و خواندن مود
│   │   ├── useStreak.ts          # مدیریت Streak
│   │   ├── useBooking.ts         # فلوی رزرو
│   │   ├── useWallet.ts          # وضعیت کیف پول
│   │   ├── useChat.ts            # پیام‌رسانی real-time
│   │   ├── useNotifications.ts   # نوتیفیکیشن‌ها
│   │   └── useRBAC.ts            # بررسی سطح دسترسی ادمین
│   │
│   ├── stores/                   # === State Management ===
│   │   ├── authStore.ts          # Zustand - وضعیت کاربر
│   │   ├── themeStore.ts         # Zustand - تم فعلی
│   │   ├── bookingStore.ts       # Zustand - فلوی رزرو
│   │   └── notificationStore.ts  # Zustand - نوتیفیکیشن‌ها
│   │
│   ├── middleware.ts             # Auth middleware + RBAC + redirect
│   │
│   └── types/                    # === TypeScript Types ===
│       ├── user.ts
│       ├── coach.ts
│       ├── booking.ts
│       ├── payment.ts
│       ├── wallet.ts
│       ├── growth.ts
│       ├── community.ts
│       ├── admin.ts
│       └── api.ts                # Response/Request generic types
│
├── scripts/
│   ├── seed-specializations.ts   # تخصص‌های اولیه
│   └── create-admin.ts           # ساخت Super Admin اولیه
│
└── docs/                         # === مستندات پروژه ===
    ├── PRD.md                    # سند نیازمندی‌ها
    ├── style-guide.jsx           # راهنمای طراحی
    ├── user-flows.md             # فلوی کاربری
    ├── database-schema.md        # طراحی دیتابیس
    ├── api-endpoints.md          # مستند API
    └── project-structure.md      # این فایل
```

---

## تنظیمات کلیدی

### متغیرهای محیطی (.env.local)

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/coaching_db"

# Auth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
JWT_EXPIRY="24h"

# Kavenegar (SMS)
KAVENEGAR_API_KEY="your-api-key"
KAVENEGAR_SENDER="your-sender-number"
KAVENEGAR_OTP_TEMPLATE="verify-otp"

# ZarinPal
ZARINPAL_MERCHANT_ID="your-merchant-id"
ZARINPAL_CALLBACK_URL="https://yourdomain.com/api/webhooks/zarinpal"
ZARINPAL_SANDBOX=true

# SnappPay
SNAPPAY_API_KEY="your-api-key"
SNAPPAY_CALLBACK_URL="https://yourdomain.com/api/webhooks/snappay"

# Email (Najva)
NAJVA_API_KEY="your-api-key"

# Jitsi
JITSI_DOMAIN="meet.jit.si"
JITSI_APP_ID="your-app-id"

# Google Calendar
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# File Upload (S3-compatible)
S3_ENDPOINT="your-endpoint"
S3_BUCKET="coaching-uploads"
S3_ACCESS_KEY="your-key"
S3_SECRET_KEY="your-secret"

# Platform Settings
DEFAULT_COMMISSION_RATE=0.70
MIN_PAYOUT_AMOUNT=500000
SESSION_AUTO_CONFIRM_HOURS=24
PAYOUT_DAY="monday"
```

### PWA Manifest (public/manifest.json)

```json
{
  "name": "پلتفرم کوچینگ و توسعه فردی",
  "short_name": "کوچینگ",
  "description": "همراه شما در مسیر رشد",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait",
  "dir": "rtl",
  "lang": "fa",
  "theme_color": "#0F172A",
  "background_color": "#0F172A",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Tailwind Config (tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IRANSansX', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          green: { DEFAULT: '#10B981', light: '#D1FAE5', dark: '#065F46' },
          blue: { DEFAULT: '#3B82F6', light: '#DBEAFE', dark: '#1E3A8A' },
          amber: { DEFAULT: '#F59E0B', light: '#FEF3C7', dark: '#92400E' },
          purple: { DEFAULT: '#8B5CF6', light: '#EDE9FE', dark: '#5B21B6' },
          red: { DEFAULT: '#EF4444', light: '#FEE2E2', dark: '#991B1B' },
        },
        surface: {
          dark: { bg: '#0F172A', card: '#1E293B', card2: '#334155' },
          light: { bg: '#FAFAF9', card: '#FFFFFF', card2: '#F1F5F9' },
        },
        content: {
          dark: { t1: '#E2E8F0', t2: '#94A3B8', t3: '#64748B' },
          light: { t1: '#1E293B', t2: '#475569', t3: '#94A3B8' },
        },
      },
      borderRadius: {
        sm: '6px', md: '10px', lg: '14px', xl: '20px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}

export default config
```

### Prisma Schema (prisma/schema.prisma) — نمونه

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  rehjoo
  rahbalad
  admin
}

enum ThemePref {
  auto
  dark
  light
}

model User {
  id                String    @id @default(uuid())
  phone             String    @unique
  name              String?
  role              UserRole  @default(rehjoo)
  avatarUrl         String?   @map("avatar_url")
  isActive          Boolean   @default(true) @map("is_active")
  onboardingAnswers Json?     @map("onboarding_answers")
  themePref         ThemePref @default(auto) @map("theme_pref")
  streakCount       Int       @default(0) @map("streak_count")
  xpPoints          Int       @default(0) @map("xp_points")
  level             Int       @default(1)
  lastActiveAt      DateTime? @map("last_active_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  coachProfile      CoachProfile?
  bookings          Booking[]
  moods             Mood[]
  habits            Habit[]
  goals             Goal[]
  journalEntries    JournalEntry[]
  sentMessages      Message[]      @relation("sender")
  receivedMessages  Message[]      @relation("receiver")
  reviews           Review[]
  notifications     Notification[]

  @@map("users")
}
```

---

## وابستگی‌های اصلی (package.json)

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^4.0.0",
    "next-pwa": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "zustand": "^4.0.0",
    "zod": "^3.0.0",
    "date-fns-jalali": "^3.0.0",
    "jitsi-meet-react-sdk": "^1.0.0",
    "recharts": "^2.0.0",
    "lucide-react": "^0.300.0",
    "sonner": "^1.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### توضیح وابستگی‌ها

| پکیج | کاربرد |
|---|---|
| next-pwa | تبدیل به PWA (Service Worker + manifest) |
| zustand | State management (سبک‌تر از Redux) |
| zod | Validation ورودی‌ها (API + فرم‌ها) |
| date-fns-jalali | تاریخ شمسی (جلالی) |
| jitsi-meet-react-sdk | اتاق ویدیو کنفرانس |
| recharts | نمودارها (Radar Chart, خط, میله) |
| lucide-react | آیکون‌ها |
| sonner | Toast notifications |

---

## Middleware (src/middleware.ts)

```typescript
// Routes protection + RBAC
export const config = {
  matcher: [
    '/dashboard/:path*',      // → must be rehjoo
    '/growth-room/:path*',    // → must be rehjoo
    '/coaches/:path*',        // → must be rehjoo
    '/coach-dashboard/:path*', // → must be rahbalad + approved
    '/admin/:path*',          // → must be admin (check role level)
  ]
}
```

---

## اسکریپت‌های توسعه

```bash
# نصب و راه‌اندازی
npm install
npx prisma generate
npx prisma db push
npx ts-node scripts/seed-specializations.ts
npx ts-node scripts/create-admin.ts

# توسعه
npm run dev           # localhost:3000

# بیلد
npm run build
npm start

# دیتابیس
npx prisma studio     # GUI مدیریت دیتابیس
npx prisma migrate dev # ساخت مایگریشن جدید
```

---

*این سند آخرین قطعه از پکیج مستندات است. با این ۶ سند، پروژه آماده شروع پیاده‌سازی با Claude Code است.*
