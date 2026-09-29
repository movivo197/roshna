# روشنا ۲ — سوپراپ فارسی رشد و تجربه

روشنا ابزارهای خودشناسی، برنامه‌ریزی، هدف، عادت، ژورنال، تمرکز و گجت‌های ذهن/بدن را با سه فضای تازه ترکیب می‌کند: گفتگو، اخبار و بازار و بازی. طراحی RTL، responsive، PWA، تم روشن/تاریک/خودکار و ۱۲ رنگ اصلی دارد.

## آنچه واقعاً پیاده شده است

- ابزارهای شخصی local-first با IndexedDB، کنترل تعارض، پشتیبان و بازیابی JSON.
- جستجوی سراسری محلی در برنامه، هدف، ژورنال و کتابخانه؛ Favorites، onboarding، اعلان داخل اپ و شخصی‌سازی.
- حساب اجتماعی واقعی با scrypt، پروفایل، کشف افراد، follow/friend، عمومی/گروهی/خصوصی، reaction، فایل محدود، report/block، حذف حساب و پنل moderation.
- خبرهای واقعی GDELT، نرخ مرجع ECB/Frankfurter، cache/stale/error، Watchlist و نمودار تاریخچه واقعی. منبع‌های تجاری بدون مجوز عدد نشان نمی‌دهند.
- سه بازی HTML5 اصلی و آفلاین؛ دوز آنلاین با state معتبر سرور، lobby، matchmaking، کد دعوت، spectator عمومی، history، XP و leaderboard واقعی.
- پنل مدیریت محتوا، جامعه و آمار جمعی opt-in.

## معماری

Next.js 16 با output standalone و React 19 استفاده شده است. داده شخصی در مرورگر می‌ماند؛ داده اجتماعی/بازی آنلاین در `data/platform.sqlite` ذخیره می‌شود. ماژول‌های گفتگو، بازار و بازی جداگانه lazy-load می‌شوند. یک process PM2 برای SQLite اجرا می‌شود.

امنیت پایه شامل cookie امن HttpOnly، scrypt، same-origin mutation، validation با Zod، محدودیت حجم، rate limit، SQL پارامتری، کنترل عضویت، فیلتر نوع فایل، CSP و ممنوعیت سرو مستقیم data است. پیش از عرضه عمومی باید review امنیتی، سیاست حقوقی و بازیابی disaster آزمایش شود.

## شروع

راهنمای عملی سرور در `START-HERE.fa.md` است. معماری و ادامه مسیر در `docs/ARCHITECTURE.fa.md` و ادامه با Antigravity در `docs/CONTINUE-WITH-ANTIGRAVITY.fa.md` قرار دارد.

```bash
cd /www/wwwroot/roshna.moeid.net
npm install -g pm2
bash deploy/install.sh
```

برای توسعه محلی:

```bash
npm ci
npm run dev
```

پورت پیش‌فرض 3200 است. نسخه حداقل Node.js 22.13 می‌خواهد. مطابق درخواست مالک، تست و build این تحویل اجرا نشده است.
