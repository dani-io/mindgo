# API Endpoints — پلتفرم کوچینگ و توسعه فردی

**نسخه:** ۱.۰  
**Base URL:** `/api/v1`  
**فرمت:** REST + JSON  
**احراز هویت:** JWT Bearer Token (via OTP)  
**زبان خطاها:** فارسی  

---

## قراردادها

- تمام endpointها با `/api/v1` شروع می‌شوند
- پاسخ‌ها به فرمت `{ success: boolean, data: {}, message: string }` هستند
- خطاها: `{ success: false, error: { code: string, message: string } }`
- Pagination: `?page=1&limit=20` → پاسخ شامل `{ meta: { total, page, limit, pages } }`
- فیلتر و مرتب‌سازی: `?sort=created_at:desc&filter[status]=active`
- نقش‌ها: 🟢 Public | 🔵 Rehjoo | 🟣 Rahbalad | 🔴 Admin (Support Agent/Manager/Super)

---

## ۱. احراز هویت (Auth)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| POST | `/auth/otp/send` | ارسال کد OTP به شماره موبایل (کاوه‌نگار) | 🟢 |
| POST | `/auth/otp/verify` | تأیید کد OTP → دریافت JWT | 🟢 |
| POST | `/auth/refresh` | تمدید توکن | 🔵🟣🔴 |
| POST | `/auth/logout` | خروج و ابطال توکن | 🔵🟣🔴 |
| GET | `/auth/me` | اطلاعات کاربر فعلی | 🔵🟣🔴 |

### جزئیات

**POST `/auth/otp/send`**
```json
// Request
{ "phone": "09121234567" }

// Response
{ "success": true, "data": { "expires_in": 120 }, "message": "کد تأیید ارسال شد" }
```

**POST `/auth/otp/verify`**
```json
// Request
{ "phone": "09121234567", "code": "12345" }

// Response
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "refresh_token": "eyJ...",
    "user": { "id": "uuid", "name": null, "role": "rehjoo", "is_new": true },
    "expires_in": 86400
  }
}
```

---

## ۲. کاربران (Users)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/users/me` | پروفایل کامل کاربر فعلی | 🔵🟣 |
| PATCH | `/users/me` | به‌روزرسانی پروفایل | 🔵🟣 |
| POST | `/users/me/onboarding` | ذخیره پاسخ ۳ سوال طلایی | 🔵 |
| PATCH | `/users/me/theme` | تغییر تم (auto/dark/light) | 🔵🟣 |
| POST | `/users/me/avatar` | آپلود تصویر پروفایل | 🔵🟣 |
| GET | `/users/:id/public` | پروفایل عمومی (محدود) | 🔵🟣 |

### جزئیات

**PATCH `/users/me`**
```json
// Request
{ "name": "رضا محمدی", "theme_pref": "dark" }
```

**POST `/users/me/onboarding`**
```json
// Request
{
  "answers": {
    "life_area": "شغلی",
    "main_goal": "تغییر مسیر شغلی",
    "experience": "هیچ تجربه‌ای با کوچینگ ندارم"
  }
}
```

---

## ۳. پروفایل راه‌بلد (Coach Profile)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| POST | `/coaches/register` | ثبت‌نام به عنوان راه‌بلد | 🔵 |
| GET | `/coaches/me` | پروفایل کامل کوچ (خودش) | 🟣 |
| PATCH | `/coaches/me` | به‌روزرسانی پروفایل | 🟣 |
| POST | `/coaches/me/voice-intro` | آپلود فایل صوتی معرفی | 🟣 |
| POST | `/coaches/me/video-intro` | آپلود ویدیو معرفی | 🟣 |
| POST | `/coaches/me/certificates` | آپلود مدرک جدید | 🟣 |
| DELETE | `/coaches/me/certificates/:id` | حذف مدرک | 🟣 |
| POST | `/coaches/me/submit` | ارسال پروفایل برای بررسی ادمین | 🟣 |
| GET | `/coaches/me/stats` | آمار کلی (جلسات، درآمد، امتیاز) | 🟣 |

### جزئیات

**POST `/coaches/register`**
```json
// Request
{
  "short_bio": "هر قدم کوچک، تغییری بزرگ است",
  "full_bio": "من مریم احمدی هستم...",
  "gender_accept": "all",
  "specializations": ["uuid-spec-1", "uuid-spec-2"]
}
```

**PATCH `/coaches/me`**
```json
// Request
{
  "short_bio": "متن جدید",
  "gender_accept": "female_only",
  "specializations": ["uuid-spec-1", "uuid-spec-3"]
}
```

---

## ۴. مارکت‌پلیس (Marketplace)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/marketplace/coaches` | لیست راه‌بلدهای تأیید شده + فیلتر | 🔵 |
| GET | `/marketplace/coaches/:id` | پروفایل عمومی یک راه‌بلد | 🔵 |
| GET | `/marketplace/coaches/:id/packages` | پکیج‌های فعال یک راه‌بلد | 🔵 |
| GET | `/marketplace/coaches/:id/availability` | اسلات‌های آزاد | 🔵 |
| GET | `/marketplace/coaches/:id/reviews` | نظرات رهجوها | 🔵 |
| GET | `/marketplace/specializations` | لیست تمام تخصص‌ها (تگ‌ها) | 🟢 |

### پارامترهای فیلتر `/marketplace/coaches`

```
?specialization=uuid-spec
&gender_accept=female_only
&min_rating=4.0
&sort=rating:desc|sessions:desc|newest
&search=مریم
&page=1&limit=12
```

### جزئیات

**GET `/marketplace/coaches/:id`**
```json
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "مریم احمدی",
    "short_bio": "هر قدم کوچک...",
    "full_bio": "من مریم احمدی هستم...",
    "gender_accept": "all",
    "voice_intro_url": "https://...",
    "video_intro_url": null,
    "specializations": [{ "id": "uuid", "name": "توسعه فردی" }],
    "certificates": [{ "id": "uuid", "title": "ICF ACC", "issuer": "ICF", "year": 1402, "image_url": "...", "verified": true }],
    "stats": { "total_sessions": 120, "avg_rating": 4.9, "review_count": 45 },
    "is_verified": true,
    "gender_badge": "پذیرش: خانم‌ها و آقایان"
  }
}
```

---

## ۵. رزرو و جلسات (Booking)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| POST | `/bookings` | ایجاد رزرو جدید | 🔵 |
| GET | `/bookings/me` | لیست رزروهای من (رهجو) | 🔵 |
| GET | `/bookings/me/upcoming` | جلسه بعدی من | 🔵 |
| GET | `/bookings/:id` | جزئیات یک رزرو | 🔵🟣 |
| PATCH | `/bookings/:id/cancel` | لغو رزرو | 🔵🟣 |
| GET | `/coaches/me/bookings` | لیست رزروهای من (کوچ) | 🟣 |
| GET | `/coaches/me/bookings/upcoming` | جلسات آینده کوچ | 🟣 |
| POST | `/sessions/:id/confirm` | تأیید برگزاری جلسه (رهجو) | 🔵 |
| POST | `/sessions/:id/start` | شروع جلسه | 🟣 |
| POST | `/sessions/:id/end` | پایان جلسه | 🟣 |
| POST | `/sessions/:id/dispute` | ثبت شکایت | 🔵🟣 |

### جزئیات

**POST `/bookings`**
```json
// Request
{
  "coach_id": "uuid",
  "package_id": "uuid",
  "session_date": "1405-03-23",
  "session_time": "18:30",
  "payment_method": "snappay"
}

// Response
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "payment_url": "https://zarinpal.com/pg/...",
    "jitsi_room_id": "room-abc123",
    "amount": 1800000,
    "status": "pending_payment"
  }
}
```

---

## ۶. زمان‌بندی کوچ (Availability)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/coaches/me/availability` | زمان‌بندی فعلی من | 🟣 |
| PUT | `/coaches/me/availability` | به‌روزرسانی کامل زمان‌بندی | 🟣 |
| POST | `/coaches/me/availability/block` | بلاک کردن یک روز/ساعت خاص | 🟣 |
| DELETE | `/coaches/me/availability/block/:id` | حذف بلاک | 🟣 |
| POST | `/coaches/me/calendar/sync` | اتصال Google Calendar | 🟣 |
| DELETE | `/coaches/me/calendar/sync` | قطع اتصال تقویم | 🟣 |

### جزئیات

**PUT `/coaches/me/availability`**
```json
// Request
{
  "slots": [
    { "day_of_week": 0, "start_time": "16:00", "end_time": "20:00" },
    { "day_of_week": 2, "start_time": "16:00", "end_time": "20:00" }
  ]
}
```

---

## ۷. پکیج‌ها (Packages)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/coaches/me/packages` | لیست پکیج‌های من | 🟣 |
| POST | `/coaches/me/packages` | ایجاد پکیج جدید | 🟣 |
| PATCH | `/coaches/me/packages/:id` | ویرایش پکیج | 🟣 |
| DELETE | `/coaches/me/packages/:id` | حذف (غیرفعال) پکیج | 🟣 |

### جزئیات

**POST `/coaches/me/packages`**
```json
// Request
{
  "name": "پکیج رشد",
  "description": "۴ جلسه ۶۰ دقیقه‌ای + پشتیبانی چت",
  "session_count": 4,
  "duration_minutes": 60,
  "price_toman": 1800000,
  "includes_chat": true,
  "is_intro": false
}
```

---

## ۸. پرداخت (Payments)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| POST | `/payments/initiate` | شروع فرآیند پرداخت | 🔵 |
| POST | `/payments/verify` | تأیید پرداخت (callback درگاه) | 🟢 |
| GET | `/payments/me` | تاریخچه پرداخت‌های من | 🔵 |
| POST | `/payments/discount/validate` | اعتبارسنجی کد تخفیف | 🔵 |

### جزئیات

**POST `/payments/initiate`**
```json
// Request
{
  "booking_id": "uuid",
  "method": "zarinpal",
  "discount_code": "WELCOME20"
}

// Response
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "gateway_url": "https://zarinpal.com/pg/StartPay/...",
    "amount_original": 1800000,
    "discount_amount": 360000,
    "amount_final": 1440000
  }
}
```

**POST `/payments/verify`** (Callback از درگاه)
```json
// Request
{ "authority": "A00000000000000000000000000217885", "status": "OK" }

// Response — triggers:
// 1. payment.status → 'paid'
// 2. booking.status → 'confirmed'
// 3. wallet_transaction(type: 'lock') created
// 4. SMS sent to both coach and rehjoo
```

---

## ۹. کیف پول کوچ (Wallet)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/coaches/me/wallet` | موجودی کیف پول | 🟣 |
| GET | `/coaches/me/wallet/transactions` | لیست تراکنش‌ها | 🟣 |
| POST | `/coaches/me/wallet/payout` | درخواست تسویه حساب | 🟣 |
| GET | `/coaches/me/wallet/payouts` | تاریخچه درخواست‌های تسویه | 🟣 |
| PATCH | `/coaches/me/wallet/sheba` | به‌روزرسانی شماره شبا | 🟣 |

### جزئیات

**GET `/coaches/me/wallet`**
```json
// Response
{
  "success": true,
  "data": {
    "total_earned": 8400000,
    "locked_amount": 1400000,
    "available_amount": 5600000,
    "pending_payout": 1400000,
    "sheba_number": "IR123456789012345678901234",
    "account_holder": "مریم احمدی",
    "can_request_payout": true,
    "min_payout_amount": 500000,
    "next_payout_date": "1405-03-26"
  }
}
```

**POST `/coaches/me/wallet/payout`**
```json
// Request
{ "amount": 2800000 }

// Validation: amount >= 500000 AND amount <= available_amount
```

---

## ۱۰. چت (Messages)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/messages/conversations` | لیست مکالمات | 🔵🟣 |
| GET | `/messages/conversations/:userId` | پیام‌های یک مکالمه | 🔵🟣 |
| POST | `/messages` | ارسال پیام | 🔵🟣 |
| PATCH | `/messages/:id/read` | خوانده شد | 🔵🟣 |
| POST | `/messages/attachment` | آپلود فایل پیوست | 🔵🟣 |

---

## ۱۱. نظرات (Reviews)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| POST | `/reviews` | ثبت نظر بعد از جلسه | 🔵 |
| GET | `/coaches/:id/reviews` | نظرات یک کوچ | 🔵 |
| DELETE | `/reviews/:id` | حذف نظر خودم | 🔵 |

### جزئیات

**POST `/reviews`**
```json
// Request
{
  "coach_id": "uuid",
  "session_id": "uuid",
  "rating": 5,
  "comment": "واقعاً مسیر زندگی من رو شفاف کرد",
  "is_anonymous": false
}
```

---

## ۱۲. رشد فردی (Growth)

### مود ترکر

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| POST | `/moods` | ثبت مود روزانه | 🔵 |
| GET | `/moods/me` | تاریخچه مودها | 🔵 |
| GET | `/moods/me/stats` | آمار مودها (هفتگی/ماهانه) | 🔵 |

### عادت‌ها

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/habits/me` | لیست عادت‌های من | 🔵 |
| POST | `/habits` | ایجاد عادت جدید | 🔵🟣 |
| PATCH | `/habits/:id` | ویرایش عادت | 🔵🟣 |
| DELETE | `/habits/:id` | حذف عادت | 🔵 |
| POST | `/habits/:id/check` | تیک زدن (امروز انجام دادم) | 🔵 |
| GET | `/habits/me/today` | تسک‌های امروز (داشبورد) | 🔵 |
| GET | `/habits/me/streak` | اطلاعات Streak | 🔵 |

### اهداف

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/goals/me` | لیست اهداف | 🔵 |
| POST | `/goals` | ایجاد هدف جدید | 🔵 |
| PATCH | `/goals/:id` | ویرایش هدف / به‌روزرسانی پیشرفت | 🔵 |
| DELETE | `/goals/:id` | حذف هدف | 🔵 |

### ژورنال

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/journal/me` | لیست یادداشت‌ها | 🔵 |
| POST | `/journal` | ثبت یادداشت جدید | 🔵 |
| PATCH | `/journal/:id` | ویرایش یادداشت | 🔵 |
| DELETE | `/journal/:id` | حذف یادداشت | 🔵 |

### چرخ حیات

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/wheel-of-life/me` | آخرین نتایج ارزیابی | 🔵 |
| POST | `/wheel-of-life` | ثبت ارزیابی جدید | 🔵 |

---

## ۱۳. قبیله (Community)

### چالش‌ها

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/challenges` | لیست چالش‌های فعال | 🔵 |
| GET | `/challenges/:id` | جزئیات یک چالش + Leaderboard | 🔵 |
| POST | `/challenges/:id/join` | پیوستن به چالش | 🔵 |
| POST | `/challenges/:id/checkin` | Check-in روزانه | 🔵 |
| GET | `/challenges/me` | چالش‌هایی که عضوشم | 🔵 |

### بورد الهام‌بخش

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/inspiration` | فید پست‌ها | 🔵 |
| POST | `/inspiration` | ایجاد پست (template-based) | 🔵 |
| POST | `/inspiration/:id/react` | ری‌اکشن مثبت | 🔵 |
| DELETE | `/inspiration/:id/react` | حذف ری‌اکشن | 🔵 |

### جزئیات

**POST `/challenges/:id/join`**
```json
// Request
{ "is_anonymous": true }
```

**POST `/inspiration`**
```json
// Request
{
  "template": "book_quote",
  "content": "زندگی یعنی حرکت — مولانا",
  "is_anonymous": false
}
```

**POST `/inspiration/:id/react`**
```json
// Request
{ "type": "fire" }
// Types: strong (💪), growing (🌱), love (🤍), fire (🔥)
```

---

## ۱۴. پشتیبانی (Support)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| POST | `/support/tickets` | ایجاد تیکت | 🔵🟣 |
| GET | `/support/tickets/me` | تیکت‌های من | 🔵🟣 |
| GET | `/support/faq` | لیست سوالات متداول | 🟢 |
| POST | `/support/chat` | ارسال پیام به پشتیبانی (چت شناور) | 🔵🟣 |

---

## ۱۵. نوتیفیکیشن (Notifications)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/notifications/me` | لیست نوتیفیکیشن‌ها | 🔵🟣 |
| PATCH | `/notifications/:id/read` | خوانده شد | 🔵🟣 |
| PATCH | `/notifications/read-all` | همه خوانده شدند | 🔵🟣 |
| GET | `/notifications/me/unread-count` | تعداد خوانده نشده | 🔵🟣 |

---

## ۱۶. پنل ادمین (Admin)

### مدیریت راه‌بلدها

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/admin/coaches` | لیست همه کوچ‌ها + فیلتر وضعیت | 🔴 Manager+ |
| GET | `/admin/coaches/pending` | صف تأیید (Onboarding Queue) | 🔴 Manager+ |
| GET | `/admin/coaches/:id` | جزئیات کامل یک کوچ | 🔴 Manager+ |
| PATCH | `/admin/coaches/:id/approve` | تأیید کوچ (تیک سبز) | 🔴 Manager+ |
| PATCH | `/admin/coaches/:id/reject` | رد کوچ (با دلیل) | 🔴 Manager+ |
| PATCH | `/admin/coaches/:id/suspend` | تعلیق موقت | 🔴 Manager+ |
| PATCH | `/admin/coaches/:id/activate` | فعال‌سازی مجدد | 🔴 Manager+ |
| POST | `/admin/coaches/create` | افزودن دستی کوچ | 🔴 Super |

### مدیریت رهجوها

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/admin/users` | لیست رهجوها + جستجو | 🔴 Agent+ |
| GET | `/admin/users/:id` | پروفایل کامل رهجو | 🔴 Agent+ |
| GET | `/admin/users/:id/payments` | تاریخچه مالی رهجو | 🔴 Manager+ |
| POST | `/admin/users/:id/discount` | اعمال کد تخفیف اختصاصی | 🔴 Manager+ |

### مدیریت مالی

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/admin/finance/overview` | داشبورد مالی کلان | 🔴 Super |
| GET | `/admin/finance/wallets` | کیف پول همه کوچ‌ها | 🔴 Super |
| GET | `/admin/finance/payouts` | درخواست‌های تسویه در انتظار | 🔴 Super |
| PATCH | `/admin/finance/payouts/:id/approve` | تأیید درخواست تسویه | 🔴 Super |
| PATCH | `/admin/finance/payouts/:id/reject` | رد درخواست تسویه | 🔴 Super |
| POST | `/admin/finance/payouts/export-paya` | خروجی فایل پایا (Excel) | 🔴 Super |
| POST | `/admin/finance/payouts/mark-transferred` | علامت‌گذاری واریز انجام شده | 🔴 Super |
| POST | `/admin/finance/refund` | بازگشت وجه (Refund) | 🔴 Manager+ |

### داوری جلسات

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/admin/disputes` | لیست شکایات باز | 🔴 Manager+ |
| GET | `/admin/disputes/:id` | جزئیات شکایت + وضعیت جلسه | 🔴 Manager+ |
| POST | `/admin/disputes/:id/resolve` | حکم داوری | 🔴 Manager+ |

**POST `/admin/disputes/:id/resolve`**
```json
// Request
{
  "ruling": "refund_client",
  "reason": "کوچ در جلسه حاضر نشده",
  "refund_amount": 700000
}
// ruling: "refund_client" | "release_coach" | "partial_refund"
```

### مدیریت جلسات

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/admin/sessions` | لاگ تمام جلسات | 🔴 Agent+ |
| GET | `/admin/sessions/:id` | جزئیات جلسه | 🔴 Agent+ |

### مدیریت قبیله

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| POST | `/admin/challenges` | ایجاد چالش جدید | 🔴 Manager+ |
| PATCH | `/admin/challenges/:id` | ویرایش چالش | 🔴 Manager+ |
| DELETE | `/admin/inspiration/:id` | حذف پست نامناسب | 🔴 Agent+ |

### مدیریت تیکت‌ها

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/admin/tickets` | لیست تیکت‌ها | 🔴 Agent+ |
| GET | `/admin/tickets/:id` | جزئیات تیکت | 🔴 Agent+ |
| PATCH | `/admin/tickets/:id/assign` | تخصیص به کارشناس | 🔴 Manager+ |
| PATCH | `/admin/tickets/:id/resolve` | حل تیکت | 🔴 Agent+ |

### داشبورد آماری

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/admin/analytics/overview` | آمار کلی (کاربران، جلسات، درآمد) | 🔴 Super |
| GET | `/admin/analytics/growth` | نمودار رشد کاربران | 🔴 Super |
| GET | `/admin/analytics/revenue` | نمودار درآمد | 🔴 Super |

### مدیریت کارمندان (RBAC)

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/admin/staff` | لیست کارمندان ادمین | 🔴 Super |
| POST | `/admin/staff` | افزودن کارمند جدید | 🔴 Super |
| PATCH | `/admin/staff/:id` | تغییر نقش کارمند | 🔴 Super |
| DELETE | `/admin/staff/:id` | حذف کارمند | 🔴 Super |

### تنظیمات پلتفرم

| متد | مسیر | توضیح | دسترسی |
|---|---|---|---|
| GET | `/admin/settings` | تنظیمات فعلی | 🔴 Super |
| PATCH | `/admin/settings` | به‌روزرسانی تنظیمات | 🔴 Super |

**PATCH `/admin/settings`**
```json
// Request
{
  "default_commission_rate": 0.70,
  "min_payout_amount": 500000,
  "payout_day": "monday",
  "session_auto_confirm_hours": 24
}
```

---

## Webhooks (ورودی)

| سرویس | مسیر | توضیح |
|---|---|---|
| زرین‌پال | `/webhooks/zarinpal` | Callback تأیید پرداخت نقدی |
| اسنپ‌پی | `/webhooks/snappay` | Callback تأیید پرداخت اقساطی |
| Google Calendar | `/webhooks/google-calendar` | سینک تغییرات تقویم کوچ |

---

## خلاصه آماری

| گروه | تعداد Endpoint |
|---|---|
| Auth | ۵ |
| Users | ۶ |
| Coach Profile | ۹ |
| Marketplace | ۶ |
| Booking + Sessions | ۱۱ |
| Availability | ۶ |
| Packages | ۴ |
| Payments | ۴ |
| Wallet | ۵ |
| Messages | ۵ |
| Reviews | ۳ |
| Growth (Mood, Habits, Goals, Journal) | ۱۸ |
| Community (Challenges, Inspiration) | ۹ |
| Support | ۴ |
| Notifications | ۴ |
| Admin | ۳۲ |
| Webhooks | ۳ |
| **مجموع** | **~۱۳۴** |

---

*این سند مرجع API برای تیم توسعه است. هر endpoint با نقش دسترسی و فرمت درخواست/پاسخ مستند شده.*
