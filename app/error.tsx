'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="g-error-page" dir="rtl"><h1>صفحه کامل بارگذاری نشد.</h1><p>دوباره تلاش کنید. اطلاعات ذخیره‌شده شما حذف نشده است.</p><button className="g-btn primary" onClick={reset}>تلاش دوباره</button></main>}
