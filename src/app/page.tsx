import Link from 'next/link'

const FEATURES = [
  {
    icon: '🧭',
    title: 'راه‌بلدهای حرفه‌ای',
    desc: 'کوچ‌های دارای مدرک ICF و موسسات معتبر، با جعبه ابزار اعتماد کامل',
    color: '#10B981',
  },
  {
    icon: '🌱',
    title: 'اتاق رشد خصوصی',
    desc: 'دفترچه شکرگزاری، ردیاب عادت، هدف‌گذاری SMART — فضایی امن فقط برای تو',
    color: '#8B5CF6',
  },
  {
    icon: '🏆',
    title: 'گیمیفیکیشن هوشمند',
    desc: 'کسب XP، بج، زنجیره موفقیت — رشد رو با بازی احساس کن',
    color: '#F59E0B',
  },
  {
    icon: '👥',
    title: 'قبیله هم‌مسیران',
    desc: 'چالش‌های گروهی، بورد الهام‌بخش، پارتنر پاسخگویی — تنها نیستی',
    color: '#3B82F6',
  },
  {
    icon: '📖',
    title: 'دوز آگاهی روزانه',
    desc: 'پادکست ۵ دقیقه‌ای، خلاصه کتاب، ویدیو — یادگیری در مسیر زندگی',
    color: '#EF4444',
  },
  {
    icon: '🛡️',
    title: 'پرداخت امن Escrow',
    desc: 'پولت تا پایان موفق جلسه قفله — هم تو هم راه‌بلد با آرامش خاطر',
    color: '#10B981',
  },
]

const STEPS = [
  { num: '۱', title: 'ثبت‌نام در ۳۰ ثانیه', desc: 'فقط شماره موبایل کافیه', icon: '📱' },
  { num: '۲', title: 'راه‌بلدت رو انتخاب کن', desc: 'پروفایل، صدا، مدارک — همه چیز شفاف', icon: '🔍' },
  { num: '۳', title: 'مسیر رشدت رو شروع کن', desc: 'جلسه آنلاین، اتاق رشد، قبیله', icon: '🚀' },
]

const TESTIMONIALS = [
  {
    text: 'بعد از ۳ ماه کار با راه‌بلدم، اولین کسب‌وکارم رو راه‌اندازی کردم. Mindgo یه تحول واقعی بود.',
    name: 'سارا — تهران',
    tag: 'بیزینس کوچینگ',
    color: '#10B981',
  },
  {
    text: 'دفترچه شکرگزاری روزانه رو ۴۵ روز متوالی نوشتم. اضطرابم به شدت کم شد.',
    name: 'محمد — اصفهان',
    tag: 'مدیریت استرس',
    color: '#8B5CF6',
  },
  {
    text: 'از اینکه تمام پرداخت‌ها اسکرو هست و ریسکی نیست خیلی راحت‌تر تصمیم گرفتم.',
    name: 'نیلوفر — مشهد',
    tag: 'لایف کوچینگ',
    color: '#3B82F6',
  },
]

const FAQ_ITEMS = [
  {
    q: 'تفاوت راه‌بلد با روانپزشک چیست؟',
    a: 'کوچینگ بر توانمندسازی آینده تمرکز دارد، نه درمان گذشته. راه‌بلد یک همراه حرفه‌ای است که مسیر رشد شخصی و حرفه‌ای شما را روشن می‌کند.',
  },
  {
    q: 'آیا جلسه اول رایگان است؟',
    a: 'جلسه معارفه با قیمت بسیار پایین برگزار می‌شود تا بتوانی راه‌بلد را بشناسی بدون ریسک.',
  },
  {
    q: 'اگر از جلسه راضی نبودم چه؟',
    a: 'سیستم اسکرو امنیت مالی هر دو طرف را تضمین می‌کند. در صورت اختلاف، تیم داوری بررسی می‌کند.',
  },
  {
    q: 'آیا اطلاعاتم خصوصی می‌ماند؟',
    a: 'اتاق رشد کاملاً خصوصی است. هیچ‌کس — حتی راه‌بلد — بدون اجازه‌ات به یادداشت‌هایت دسترسی ندارد.',
  },
]

export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: '#0F172A', color: '#E2E8F0', direction: 'rtl' }}
    >

      {/* Nav */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="font-bold text-lg" style={{ color: '#10B981' }}>Mindgo</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded-xl"
            style={{ color: '#94A3B8' }}
          >
            ورود
          </Link>
          <Link
            href="/login"
            className="text-sm font-bold px-4 py-2 rounded-xl"
            style={{ background: '#10B981', color: 'white' }}
          >
            شروع رایگان
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-6 pt-20 pb-24 text-center">
        <div
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-8"
          style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          🚀 در حال توسعه — نسخه بتا
        </div>

        <h1
          className="font-bold leading-tight mb-6"
          style={{ fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.4 }}
        >
          🧠 <span style={{ color: '#10B981' }}>ذهنت رو</span><br />
          به حرکت درآر
        </h1>

        <p className="text-lg mb-10 leading-relaxed" style={{ color: '#94A3B8' }}>
          اولین پلتفرم کوچینگ و توسعه فردی فارسی — با راه‌بلدهای دارای مدرک،
          اتاق رشد خصوصی، و جامعه‌ای از هم‌مسیران
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="font-bold px-8 py-4 rounded-2xl text-white text-base"
            style={{ background: '#10B981', boxShadow: '0 8px 32px rgba(16,185,129,0.35)' }}
          >
            شروع رایگان — همین الان ›
          </Link>
          <Link
            href="/coaches"
            className="font-semibold px-8 py-4 rounded-2xl text-base"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            مشاهده راه‌بلدها
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-16">
          {[
            { n: '۵۰+',   label: 'راه‌بلد دارای مدرک' },
            { n: '۱۰۰٪', label: 'پرداخت امن اسکرو' },
            { n: '۲۴/۷', label: 'دسترسی به اتاق رشد' },
          ].map(({ n, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold mb-1" style={{ color: '#10B981' }}>{n}</p>
              <p className="text-xs" style={{ color: '#94A3B8' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6" style={{ background: '#1E293B' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">همه چیزی که برای رشد نیاز داری</h2>
          <p className="text-center mb-12" style={{ color: '#94A3B8' }}>یک اکوسیستم کامل، نه فقط یه اپ دیگه</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-5"
                style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: `${f.color}15` }}
                >
                  {f.icon}
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#E2E8F0' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">چطور شروع کنم؟</h2>
          <p className="text-center mb-12" style={{ color: '#94A3B8' }}>سه قدم ساده — کمتر از ۵ دقیقه</p>
          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-5 rounded-2xl p-5"
                style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                >
                  {s.num}
                </div>
                <div className="flex-1">
                  <p className="font-bold mb-0.5" style={{ color: '#E2E8F0' }}>{s.title}</p>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>{s.desc}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coach CTA */}
      <section className="py-20 px-6" style={{ background: '#1E293B' }}>
        <div
          className="max-w-xl mx-auto rounded-3xl p-8 text-center"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <p className="text-4xl mb-4">🧭</p>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#E2E8F0' }}>راه‌بلد هستی؟</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#94A3B8' }}>
            به جامعه راه‌بلدهای Mindgo بپیوند. پروفایل حرفه‌ای، مدیریت جلسات، کیف پول — همه در یک پنل
          </p>
          <Link
            href="/coaches/register"
            className="inline-block font-bold px-6 py-3 rounded-xl text-white"
            style={{ background: '#10B981' }}
          >
            ثبت‌نام به عنوان راه‌بلد ›
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">صدای هم‌مسیران</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-5"
                style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#CBD5E1' }}>
                  &laquo;{t.text}&raquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex-shrink-0" style={{ background: `${t.color}20` }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>{t.name}</p>
                    <p className="text-[10px]" style={{ color: t.color }}>{t.tag}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6" style={{ background: '#1E293B' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">سوالات متداول</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={i}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <summary
                  className="flex items-center justify-between p-5 cursor-pointer font-semibold text-sm list-none"
                  style={{ color: '#E2E8F0' }}
                >
                  <span>{item.q}</span>
                  <span className="text-xl flex-shrink-0 mr-3" style={{ color: '#10B981' }}>+</span>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-2xl font-bold mb-4">آماده‌ای مسیر رشدت رو شروع کنی؟</h2>
        <p className="mb-8" style={{ color: '#94A3B8' }}>رایگان ثبت‌نام کن — جلسه معارفه با قیمت نمادین</p>
        <Link
          href="/login"
          className="inline-block font-bold px-10 py-4 rounded-2xl text-white text-lg"
          style={{ background: '#10B981', boxShadow: '0 8px 40px rgba(16,185,129,0.4)' }}
        >
          🚀 همین الان شروع کن
        </Link>
      </section>

      {/* Footer */}
      <footer
        className="py-10 px-6 text-center"
        style={{ background: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xl">🧠</span>
          <span className="font-bold" style={{ color: '#10B981' }}>Mindgo</span>
        </div>
        <p className="text-xs mb-4" style={{ color: '#475569' }}>
          ذهنت رو به حرکت درآر — پلتفرم کوچینگ و توسعه فردی
        </p>
        <div className="flex justify-center gap-6">
          {[
            { href: '/login',            label: 'ورود' },
            { href: '/coaches',          label: 'راه‌بلدها' },
            { href: '/coaches/register', label: 'ثبت‌نام کوچ' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="text-xs" style={{ color: '#475569' }}>
              {label}
            </Link>
          ))}
        </div>
        <p className="text-xs mt-6" style={{ color: '#334155' }}>
          &copy; ۱۴۰۵ Mindgo — تمامی حقوق محفوظ است
        </p>
      </footer>
    </div>
  )
}
