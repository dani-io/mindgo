# Database Schema — پلتفرم کوچینگ و توسعه فردی

**نسخه:** ۱.۰  
**دیتابیس پیشنهادی:** PostgreSQL  
**ORM پیشنهادی:** Prisma  

---

## خلاصه جداول

| گروه | جداول | تعداد |
|---|---|---|
| کاربران و احراز هویت | users, admin_roles | ۲ |
| پروفایل کوچ | coach_profiles, specializations, coach_specializations, certificates | ۴ |
| رزرو و جلسات | packages, time_slots, bookings, sessions | ۴ |
| ارتباطات | messages, reviews | ۲ |
| مالی | payments, wallets, wallet_transactions, payout_requests, discount_codes | ۵ |
| رشد فردی | moods, habits, habit_logs, goals, journal_entries | ۵ |
| قبیله | challenges, challenge_participants, inspiration_posts, reactions | ۴ |
| پشتیبانی | support_tickets | ۱ |
| نوتیفیکیشن | notifications | ۱ |
| **مجموع** | | **۲۸** |

---

## گروه ۱: کاربران و احراز هویت

### users

جدول مرکزی تمام کاربران (رهجو، راه‌بلد، ادمین).

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | شناسه یکتا |
| phone | VARCHAR(15) UNIQUE | شماره موبایل (برای OTP) |
| name | VARCHAR(100) | نام نمایشی |
| role | ENUM('rehjoo', 'rahbalad', 'admin') | نقش اصلی |
| avatar_url | TEXT | آدرس تصویر پروفایل |
| is_active | BOOLEAN DEFAULT true | وضعیت فعال بودن |
| onboarding_answers | JSONB | پاسخ ۳ سوال طلایی |
| theme_pref | ENUM('auto', 'dark', 'light') DEFAULT 'auto' | ترجیح تم |
| streak_count | INT DEFAULT 0 | روزهای متوالی فعالیت |
| xp_points | INT DEFAULT 0 | امتیاز تجربه |
| level | INT DEFAULT 1 | سطح کاربر |
| last_active_at | TIMESTAMP | آخرین فعالیت |
| created_at | TIMESTAMP DEFAULT NOW() | تاریخ ثبت‌نام |
| updated_at | TIMESTAMP | آخرین به‌روزرسانی |

### admin_roles

نقش‌های RBAC برای پنل ادمین.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | شناسه یکتا |
| user_id | UUID (FK → users) | کاربر ادمین |
| role | ENUM('super_admin', 'support_manager', 'support_agent') | سطح دسترسی |
| is_active | BOOLEAN DEFAULT true | فعال بودن |
| created_at | TIMESTAMP DEFAULT NOW() | تاریخ اعطای نقش |

---

## گروه ۲: پروفایل کوچ

### coach_profiles

اطلاعات تکمیلی راه‌بلد.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | شناسه |
| user_id | UUID (FK → users) UNIQUE | کاربر مرتبط |
| short_bio | VARCHAR(200) | بیوگرافی کوتاه (۲ خط) |
| full_bio | TEXT | بیوگرافی تفصیلی |
| gender_accept | ENUM('all', 'female_only', 'male_only') DEFAULT 'all' | فیلتر پذیرش جنسیت |
| voice_intro_url | TEXT | آدرس فایل صوتی معرفی |
| video_intro_url | TEXT | آدرس ویدیو معرفی (اختیاری) |
| status | ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' | وضعیت تأیید |
| rejection_reason | TEXT | دلیل رد (اگر رد شده) |
| commission_rate | DECIMAL(3,2) DEFAULT 0.70 | نرخ سهم کوچ (مثلاً 0.70 = 70%) |
| total_sessions | INT DEFAULT 0 | تعداد کل جلسات برگزار شده |
| avg_rating | DECIMAL(2,1) DEFAULT 0.0 | میانگین امتیاز |
| approved_at | TIMESTAMP | تاریخ تأیید |
| approved_by | UUID (FK → users) | ادمین تأیید کننده |
| created_at | TIMESTAMP DEFAULT NOW() | |
| updated_at | TIMESTAMP | |

### specializations

لیست تخصص‌ها (تگ‌ها).

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR(50) UNIQUE | نام فارسی (مثلاً «مدیریت استرس») |
| slug | VARCHAR(50) UNIQUE | نسخه URL-safe |
| icon | VARCHAR(10) | آیکون اختیاری |

### coach_specializations

جدول واسط (Many-to-Many).

| ستون | نوع | توضیح |
|---|---|---|
| coach_id | UUID (FK → coach_profiles) | |
| spec_id | UUID (FK → specializations) | |
| PK | (coach_id, spec_id) | کلید ترکیبی |

### certificates

مدارک و سرتیفیکیت‌ها.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| coach_id | UUID (FK → coach_profiles) | |
| title | VARCHAR(200) | عنوان مدرک |
| issuer | VARCHAR(200) | صادرکننده (مثلاً ICF) |
| year | INT | سال دریافت |
| image_url | TEXT | تصویر مدرک |
| verified | BOOLEAN DEFAULT false | تأیید شده توسط ادمین |
| created_at | TIMESTAMP DEFAULT NOW() | |

---

## گروه ۳: رزرو و جلسات

### packages

پکیج‌های تعریف شده توسط هر کوچ.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| coach_id | UUID (FK → coach_profiles) | |
| name | VARCHAR(100) | نام پکیج (مثلاً «پکیج رشد») |
| description | TEXT | توضیحات |
| session_count | INT | تعداد جلسات |
| duration_minutes | INT DEFAULT 60 | مدت هر جلسه (دقیقه) |
| price_toman | INT | قیمت (تومان) |
| includes_chat | BOOLEAN DEFAULT false | شامل چت بین جلسات |
| is_intro | BOOLEAN DEFAULT false | جلسه معارفه |
| is_active | BOOLEAN DEFAULT true | فعال بودن |
| sort_order | INT DEFAULT 0 | ترتیب نمایش |
| created_at | TIMESTAMP DEFAULT NOW() | |

### time_slots

بازه‌های زمانی آزاد کوچ.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| coach_id | UUID (FK → coach_profiles) | |
| day_of_week | INT (0-6) | روز هفته (0=شنبه) |
| start_time | TIME | ساعت شروع |
| end_time | TIME | ساعت پایان |
| is_available | BOOLEAN DEFAULT true | در دسترس بودن |

### bookings

رزرو جلسات.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | رهجو |
| coach_id | UUID (FK → coach_profiles) | راه‌بلد |
| package_id | UUID (FK → packages) | پکیج انتخابی |
| session_number | INT | شماره جلسه در پکیج (مثلاً ۲ از ۴) |
| session_date | DATE | تاریخ جلسه |
| session_time | TIME | ساعت جلسه |
| status | ENUM('pending', 'confirmed', 'completed', 'cancelled_by_coach', 'cancelled_by_user', 'no_show') | وضعیت |
| jitsi_room_id | VARCHAR(100) | شناسه اتاق Jitsi (تولید خودکار) |
| created_at | TIMESTAMP DEFAULT NOW() | |
| updated_at | TIMESTAMP | |

### sessions

جزئیات برگزاری جلسه.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| booking_id | UUID (FK → bookings) UNIQUE | رزرو مرتبط |
| status | ENUM('scheduled', 'in_progress', 'completed', 'disputed') | وضعیت |
| confirmed_by_user | BOOLEAN DEFAULT false | تأیید برگزاری توسط رهجو |
| auto_confirm_at | TIMESTAMP | زمان تأیید خودکار (۲۴ ساعت بعد) |
| coach_notes | TEXT | یادداشت کوچ |
| started_at | TIMESTAMP | زمان شروع واقعی |
| ended_at | TIMESTAMP | زمان پایان واقعی |

---

## گروه ۴: ارتباطات

### messages

پیام‌های چت بین کوچ و مراجع.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| sender_id | UUID (FK → users) | فرستنده |
| receiver_id | UUID (FK → users) | گیرنده |
| content | TEXT | متن پیام |
| attachment_url | TEXT | فایل پیوست |
| is_read | BOOLEAN DEFAULT false | خوانده شده |
| created_at | TIMESTAMP DEFAULT NOW() | |

### reviews

نظرات رهجوها درباره راه‌بلدها.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | نویسنده نظر |
| coach_id | UUID (FK → coach_profiles) | کوچ |
| session_id | UUID (FK → sessions) | جلسه مرتبط |
| rating | INT (1-5) | امتیاز |
| comment | TEXT | متن نظر |
| is_anonymous | BOOLEAN DEFAULT false | نمایش ناشناس |
| created_at | TIMESTAMP DEFAULT NOW() | |

---

## گروه ۵: مالی

### payments

تراکنش‌های پرداخت.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | پرداخت‌کننده |
| booking_id | UUID (FK → bookings) | رزرو مرتبط |
| amount_toman | INT | مبلغ کل (تومان) |
| method | ENUM('zarinpal', 'snappay') | روش پرداخت |
| status | ENUM('pending', 'paid', 'failed', 'refunded') | وضعیت |
| gateway_ref | VARCHAR(100) | شماره مرجع درگاه |
| platform_share | INT | سهم پلتفرم (تومان) |
| coach_share | INT | سهم کوچ (تومان) |
| is_installment | BOOLEAN DEFAULT false | پرداخت اقساطی |
| installment_count | INT | تعداد اقساط |
| discount_code_id | UUID (FK → discount_codes) | کد تخفیف استفاده شده |
| discount_amount | INT DEFAULT 0 | مبلغ تخفیف |
| paid_at | TIMESTAMP | زمان پرداخت |
| created_at | TIMESTAMP DEFAULT NOW() | |

### wallets

کیف پول راه‌بلدها.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| coach_id | UUID (FK → coach_profiles) UNIQUE | کوچ |
| total_earned | INT DEFAULT 0 | کل درآمد |
| locked_amount | INT DEFAULT 0 | مبلغ قفل شده (Escrow) |
| available_amount | INT DEFAULT 0 | مبلغ قابل برداشت |
| sheba_number | VARCHAR(26) | شماره شبا |
| account_holder | VARCHAR(100) | نام صاحب حساب |
| updated_at | TIMESTAMP | |

### wallet_transactions

لاگ عملیات مالی کیف پول.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| wallet_id | UUID (FK → wallets) | کیف پول |
| session_id | UUID (FK → sessions) | جلسه مرتبط (اختیاری) |
| amount | INT | مبلغ (تومان) |
| type | ENUM('lock', 'release', 'burn', 'payout') | نوع عملیات |
| description | TEXT | توضیح |
| created_at | TIMESTAMP DEFAULT NOW() | |

**انواع عملیات:**
- `lock` — قفل سهم کوچ هنگام خرید پکیج
- `release` — آزادسازی سهم بعد از تأیید جلسه
- `burn` — سوزاندن سهم در صورت Refund
- `payout` — واریز به حساب بانکی کوچ

### payout_requests

درخواست‌های تسویه حساب.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| wallet_id | UUID (FK → wallets) | کیف پول |
| amount | INT | مبلغ درخواستی |
| status | ENUM('pending', 'approved', 'transferred', 'rejected') | وضعیت |
| approved_by | UUID (FK → users) | ادمین تأیید کننده |
| paya_ref | VARCHAR(100) | شماره مرجع پایا |
| requested_at | TIMESTAMP DEFAULT NOW() | |
| transferred_at | TIMESTAMP | زمان واریز |

### discount_codes

کدهای تخفیف.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| code | VARCHAR(20) UNIQUE | کد تخفیف |
| type | ENUM('percentage', 'fixed') | نوع تخفیف |
| value | INT | مقدار (درصد یا تومان) |
| max_uses | INT | حداکثر استفاده |
| used_count | INT DEFAULT 0 | تعداد استفاده |
| target_package | UUID (FK → packages) | پکیج خاص (اختیاری) |
| is_active | BOOLEAN DEFAULT true | فعال بودن |
| expires_at | TIMESTAMP | تاریخ انقضا |
| created_at | TIMESTAMP DEFAULT NOW() | |

---

## گروه ۶: رشد فردی

### moods

ثبت مود روزانه.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| mood | ENUM('great', 'good', 'normal', 'stressed', 'tired') | حالت روحی |
| logged_date | DATE | تاریخ ثبت |
| UNIQUE | (user_id, logged_date) | یک مود در روز |
| created_at | TIMESTAMP DEFAULT NOW() | |

### habits

عادت‌های کاربر.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| title | VARCHAR(100) | عنوان عادت |
| description | TEXT | توضیح |
| frequency | ENUM('daily', 'weekly') | تکرار |
| is_active | BOOLEAN DEFAULT true | فعال |
| assigned_by | UUID (FK → users) | اگر توسط کوچ تعیین شده |
| created_at | TIMESTAMP DEFAULT NOW() | |

### habit_logs

لاگ انجام عادت‌ها.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| habit_id | UUID (FK → habits) | |
| logged_date | DATE | تاریخ |
| completed | BOOLEAN DEFAULT false | انجام شده |
| UNIQUE | (habit_id, logged_date) | یک لاگ در روز |

### goals

اهداف کاربر (SMART).

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| title | VARCHAR(200) | عنوان هدف |
| description | TEXT | توضیح |
| progress_pct | INT DEFAULT 0 | درصد پیشرفت |
| is_private | BOOLEAN DEFAULT true | خصوصی |
| target_date | DATE | تاریخ هدف |
| status | ENUM('active', 'completed', 'paused') DEFAULT 'active' | وضعیت |
| created_at | TIMESTAMP DEFAULT NOW() | |

### journal_entries

دفترچه شکرگزاری و تأمل.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| type | ENUM('gratitude', 'reflection', 'freewrite') | نوع یادداشت |
| content | TEXT | محتوا |
| logged_date | DATE | تاریخ |
| created_at | TIMESTAMP DEFAULT NOW() | |

---

## گروه ۷: قبیله (Community)

### challenges

چالش‌های گروهی.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| title | VARCHAR(200) | عنوان چالش |
| description | TEXT | توضیح |
| duration_days | INT | مدت (روز) |
| created_by | UUID (FK → users) | سازنده (ادمین یا کوچ) |
| status | ENUM('upcoming', 'active', 'completed') | وضعیت |
| participant_count | INT DEFAULT 0 | تعداد شرکت‌کنندگان |
| starts_at | TIMESTAMP | زمان شروع |
| ends_at | TIMESTAMP | زمان پایان |
| created_at | TIMESTAMP DEFAULT NOW() | |

### challenge_participants

شرکت‌کنندگان چالش.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| challenge_id | UUID (FK → challenges) | |
| current_streak | INT DEFAULT 0 | زنجیره فعلی |
| is_anonymous | BOOLEAN DEFAULT false | نمایش ناشناس |
| joined_at | TIMESTAMP DEFAULT NOW() | |
| UNIQUE | (user_id, challenge_id) | |

### inspiration_posts

پست‌های بورد الهام‌بخش.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| template | ENUM('book_quote', 'achievement', 'gratitude') | نوع قالب |
| content | TEXT | محتوا |
| is_anonymous | BOOLEAN DEFAULT false | نمایش ناشناس |
| is_visible | BOOLEAN DEFAULT true | نمایش (ادمین می‌تواند مخفی کند) |
| reaction_count | INT DEFAULT 0 | تعداد ری‌اکشن‌ها |
| created_at | TIMESTAMP DEFAULT NOW() | |

### reactions

ری‌اکشن‌های مثبت.

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| post_id | UUID (FK → inspiration_posts) | |
| type | ENUM('strong', 'growing', 'love', 'fire') | نوع ری‌اکشن |
| UNIQUE | (user_id, post_id) | یک ری‌اکشن در هر پست |
| created_at | TIMESTAMP DEFAULT NOW() | |

**نگاشت ری‌اکشن‌ها:** strong = 💪 دمت گرم، growing = 🌱 در حال رشد، love = 🤍 حس خوب، fire = 🔥 پرانرژی

---

## گروه ۸: پشتیبانی

### support_tickets

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | کاربر |
| assigned_to | UUID (FK → users) | کارشناس پشتیبانی |
| category | ENUM('technical', 'financial', 'general') | دسته‌بندی |
| status | ENUM('open', 'in_progress', 'resolved', 'closed') | وضعیت |
| priority | ENUM('low', 'medium', 'high') DEFAULT 'medium' | اولویت |
| subject | VARCHAR(200) | موضوع |
| created_at | TIMESTAMP DEFAULT NOW() | |
| resolved_at | TIMESTAMP | |

---

## گروه ۹: نوتیفیکیشن

### notifications

| ستون | نوع | توضیح |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | گیرنده |
| type | ENUM('sms', 'push', 'in_app', 'email') | کانال ارسال |
| category | ENUM('session_reminder', 'booking_confirmed', 'payout', 'challenge', 'system') | دسته |
| title | VARCHAR(200) | عنوان |
| body | TEXT | متن |
| is_read | BOOLEAN DEFAULT false | خوانده شده |
| sent_at | TIMESTAMP DEFAULT NOW() | |

---

## ایندکس‌های پیشنهادی

```sql
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_coach_profiles_status ON coach_profiles(status);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_coach ON bookings(coach_id);
CREATE INDEX idx_bookings_date ON bookings(session_date);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_moods_user_date ON moods(user_id, logged_date);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, logged_date);
CREATE INDEX idx_inspiration_posts_visible ON inspiration_posts(is_visible, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

---

*این سند مرجع طراحی دیتابیس پلتفرم کوچینگ است. ۲۸ جدول در ۹ گروه منطقی.*
