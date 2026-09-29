# ادامه پروژه با Antigravity و بازگشت به Codex

مسیر مرجع پروژه:

`C:\Users\MH\Documents\ChatGPT\Moeid.net\roshan-app`

Antigravity را روی همین پوشه باز کنید. اگر ابزار برای هر پروژه یک workspace جدا می‌سازد، همین مخزن Git را clone یا همین پوشه را به‌عنوان workspace انتخاب کنید؛ نسخه کپی‌شده بدون commit باعث دو شاخه نامشخص می‌شود. فایل‌های `.env.local` و پوشه `data` را وارد prompt، Git یا سرویس ابری نکنید.

پیش از شروع:

```powershell
cd "C:\Users\MH\Documents\ChatGPT\Moeid.net\roshan-app"
git status --short
git switch -c antigravity/superapp-v2-next
```

اگر این پروژه هنوز مخزن Git مستقل نیست، در مخزن والد branch بسازید و فقط محدوده `roshan-app` را تغییر دهید. Antigravity باید بعد از هر واحد کامل یک commit کوچک بسازد و `docs/HANDOFF.md` را به‌روزرسانی کند. این کار باعث می‌شود Codex در نوبت بعد با خواندن Git diff، commitها و HANDOFF دقیقاً به تغییرات دسترسی داشته باشد. دو عامل نباید هم‌زمان روی یک فایل کار کنند؛ فقط یکی نویسنده فعال باشد.

## پرامپت آماده برای Antigravity

```text
تو توسعه‌دهنده ارشد ادامه‌دهنده پروژه «روشنا» هستی. فقط روی این workspace کار کن و همه تغییرات را داخل roshan-app نگه دار. هدف، تکمیل یک Super App فارسی production-grade برای رشد شخصی، گفتگو، اخبار و بازار و بازی است.

قبل از هر تغییر این فایل‌ها را کامل بخوان:
- AGENTS.md
- docs/ARCHITECTURE.fa.md
- docs/COMMUNITY.fa.md (اگر وجود دارد)
- docs/MARKET-SOURCES.fa.md (اگر وجود دارد)
- docs/GAMES.fa.md (اگر وجود دارد)
- docs/HANDOFF.md (اگر وجود دارد)
- README.fa.md و START-HERE.fa.md
- مستند مرتبط Next.js 16 در node_modules/next/dist/docs

وضعیت مهم:
- ابزارهای شخصی (برنامه، هدف، عادت، ژورنال، تمرکز و گجت‌ها) local-first و آفلاین هستند و نباید به سرور ارسال شوند.
- حساب، پیام، دوستان، گروه‌ها، اعلان‌های حساب و بازی آنلاین داده سروری‌اند.
- Node.js حداقل 22.13 است و هسته فعلی از node:sqlite استفاده می‌کند.
- تم روشن/تاریک/خودکار و ۱۲ رنگ اصلی باید در تمام UI حفظ شود.
- از داده ساختگی، کاربر ساختگی، قیمت ساختگی، خبر ساختگی، score ساختگی و دکمه بی‌عمل استفاده نکن.
- اگر provider بازار مجوز تجاری/کلید ندارد، unavailable با دلیل و راه اتصال واقعی نشان بده.
- پرداخت، هدیه و Premium را تا زمانی که entitlement، ledger، webhook امضاشده و provider واقعی ندارند به‌صورت خرید فعال نمایش نده.
- فایل‌های .env.local، data، رمزها و tokenها را هرگز چاپ، commit یا ارسال نکن.
- APIهای mutation باید Origin/CSRF، schema، size limit، authorization و rate limit داشته باشند.
- قابلیت بلاک باید در خواندن و نوشتن، پیام، دعوت و بازی اعمال شود.
- Accessibility، RTL، keyboard، reduced motion، loading/empty/error و mobile-first الزامی‌اند.

اول source و git diff را بررسی و docs/HANDOFF.md را با بخش «وضعیت شروع» بساز یا تکمیل کن. سپس این اولویت‌ها را به‌ترتیب انجام بده:
1) هر TypeScript یا integration issue موجود میان growth-app، community، market، games و admin را رفع کن.
2) صفحه مدیریت را برای moderation واقعی، آمار opt-in و وضعیت providerهای بازار کامل کن.
3) privacy policy، terms/community rules، account export/delete و retention را پیاده‌سازی کن.
4) migration/backups برای SQLite را قابل اعتماد کن؛ مسیر مهاجرت PostgreSQL را بدون شکستن نسخه تک‌سرور مستند کن.
5) real-time را با یک transport interface بساز: polling فعلی fallback بماند و WebSocket/SSE فقط با احراز هویت، reconnect و backpressure اضافه شود.
6) تست‌های ضروری امنیت/مجوز/قواعد بازی و build را فقط اگر مالک پروژه صریحاً اجازه داد اجرا کن. در غیر این صورت source review انجام بده و در HANDOFF بنویس «اجرا نشده».
7) README، راهنمای aaPanel و env.example بدون secret را همگام کن.

قوانین کار:
- ابتدا مشکل و معیار پذیرش همان واحد را در docs/HANDOFF.md ثبت کن.
- تغییرات کوچک و قابل مرور بساز؛ فایل‌های نامرتبط را بازنویسی نکن.
- برای وابستگی جدید اول دلیل، اندازه و مجوز را بررسی کن. تا جای ممکن از Web API و کتابخانه‌های موجود استفاده کن.
- بعد از هر واحد کامل: فایل‌های تغییرکرده، تصمیم معماری، migration، env جدید، بررسی‌های انجام‌شده و بررسی‌های اجرا‌نشده را در HANDOFF ثبت و یک commit با پیام روشن بساز.
- هیچ deployment، DNS، خرید سرویس یا تغییر سرور خارجی بدون اجازه صریح انجام نده.

در پایان گزارشی بده شامل: قابلیت‌های واقعاً کارا، موارد نیازمند provider/کلید، فایل‌ها و migrationها، ریسک‌های باقیمانده، دستورهای دقیق ادامه و hash آخرین commit. اگر چیزی کامل نیست، آن را به‌وضوح «پیاده‌نشده» بنویس و UI ساختگی نساز.
```

## بازگشت به Codex

بعد از اتمام Antigravity، همین task را باز کنید و بنویسید:

```text
ادامه روشنا از خروجی Antigravity. ابتدا roshan-app/docs/HANDOFF.md و git status/log/diff را بخوان، تغییرات را review کن، موارد ناقص یا ناامن را اصلاح کن و از آخرین commit ادامه بده. تست یا build را فقط با اجازه جدید من اجرا کن.
```

تا وقتی هر دو ابزار همین workspace و تاریخچه Git را می‌بینند، فایل، diff و commitها همان حافظه مشترک عملی پروژه هستند. دسترسی مستقیم و هم‌زمان بین دو عامل وجود ندارد؛ `HANDOFF.md` و Git جلوی گم‌شدن تصمیم‌ها را می‌گیرند.

