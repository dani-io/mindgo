# 🧠 Mindgo

**پلتفرم کوچینگ و توسعه فردی**

> ذهنت رو به حرکت درآر

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)

---

## درباره پروژه

Mindgo یک وب‌اپلیکیشن PWA فارسی (RTL) برای کوچینگ و توسعه فردی است. این پلتفرم ترکیبی از «پناهگاه شخصی امن» و «شبکه اجتماعی هم‌مسیر» را ارائه می‌دهد.

### ویژگی‌های کلیدی

- 🧭 **مارکت‌پلیس راه‌بلدها** — جستجو، فیلتر و رزرو جلسه کوچینگ
- 🛡️ **جعبه ابزار اعتماد** — اعتبارسنجی کوچ‌ها با مدارک و سوابق
- 🎧 **صدای راه‌بلد** — فایل صوتی معرفی برای شکستن سد بی‌اعتمادی
- 💳 **پرداخت یکپارچه** — درگاه نقدی (زرین‌پال) + اقساطی (اسنپ‌پی)
- 🔐 **سیستم Escrow** — تسویه مرحله‌ای برای امنیت مالی هر دو طرف
- 📹 **جلسات آنلاین** — ویدیو/صوت با Jitsi Meet
- 🌱 **اتاق رشد** — فضای خصوصی برای Journaling و ردیاب عادت‌ها
- 👥 **قبیله** — چالش‌های گروهی و بورد الهام‌بخش
- 🌙 **تم دوگانه** — خلوت شبانه (Dark) + انرژی صبحگاهی (Light)

### زبان برند

| اصطلاح | معنی |
|---|---|
| راه‌بلد | کوچ |
| رهجو | مراجع |
| قبیله | کامیونیتی |
| اتاق رشد | پروفایل خصوصی |
| جعبه ابزار اعتماد | اعتبارسنجی |

---

## تکنولوژی‌ها

| بخش | ابزار |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + IRANSansX Font |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (OTP via Kavenegar) |
| Video | Jitsi Meet (embedded) |
| Payments | ZarinPal + SnappPay |
| SMS | Kavenegar |
| Email | Najva / Paket |
| State | Zustand |
| Validation | Zod |
| PWA | next-pwa |

---

## شروع سریع

### پیش‌نیازها

- Node.js 18+
- PostgreSQL 16+
- npm یا yarn

### نصب و راه‌اندازی

```bash
# کلون پروژه
git clone git@github.com:YOUR_USERNAME/mindgo.git
cd mindgo

# نصب وابستگی‌ها
npm install

# کپی فایل تنظیمات
cp .env.example .env.local
# فایل .env.local را ویرایش کنید

# راه‌اندازی دیتابیس
npx prisma generate
npx prisma db push
npx ts-node scripts/seed-specializations.ts

# اجرای محلی
npm run dev
```

اپلیکیشن روی `http://localhost:3000` اجرا می‌شود.

---

## ساختار پروژه

```
src/
├── app/              # صفحات (App Router)
│   ├── (auth)/       # احراز هویت
│   ├── (rehjoo)/     # پنل رهجو
│   ├── (rahbalad)/   # پنل راه‌بلد
│   ├── (admin)/      # پنل ادمین
│   └── api/          # API Routes
├── components/       # کامپوننت‌ها
│   ├── ui/           # Design System
│   ├── layout/       # لایوت‌ها
│   ├── dashboard/    # داشبورد
│   ├── coach/        # کوچ
│   ├── booking/      # رزرو
│   ├── growth/       # رشد فردی
│   ├── tribe/        # قبیله
│   └── admin/        # ادمین
├── lib/              # سرویس‌ها و توابع
├── hooks/            # Custom Hooks
├── stores/           # Zustand Stores
└── types/            # TypeScript Types
```

---

## مستندات

تمام مستندات پروژه در پوشه `docs/` قرار دارند:

- **PRD** — سند نیازمندی‌های محصول
- **Style Guide** — راهنمای طراحی بصری
- **User Flows** — مسیرهای کاربری
- **Wireframes** — طرح‌های اولیه صفحات
- **Database Schema** — طراحی دیتابیس (۲۸ جدول)
- **API Endpoints** — مستند API (۱۳۴ endpoint)
- **Project Structure** — ساختار پوشه‌ها

---

## فازبندی

| فاز | هدف | وضعیت |
|---|---|---|
| MVP | رزرو + پرداخت + جلسه + پنل ادمین | 🔄 در حال توسعه |
| فاز ۲ | داشبورد رشد + Gamification + Journaling | ⏳ |
| فاز ۳ | قبیله + محتوا + Micro-learning | ⏳ |

---

## لایسنس

Private & Confidential — All rights reserved.

---

**Mindgo** — *ذهنت رو به حرکت درآر* 🧠
