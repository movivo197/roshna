import type { Metadata, Viewport } from 'next';
import './globals.css';
import './gadgets.css';
import './polish.css';
import './superapp.css';
import './life.css';
import {ThemeProvider} from '@/components/theme';

export const metadata: Metadata = {
  metadataBase: new URL('https://roshna.moeid.net'),
  title: 'روشنا +۳۳ | خانه زندگی تو',
  description: 'امروز من، مسیرهای رشد، کارگاه پروژه، همراه آفلاین و خزانه رمزگذاری‌شده؛ در کنار گفتگو، خبر و بازی در روشنا.',
  alternates: {canonical:'/'},
  openGraph:{type:'website',locale:'fa_IR',siteName:'روشنا',title:'روشنا؛ زندگی به سبک تو',description:'رشد، ارتباط، آگاهی و بازی در یک فضای فارسی.',url:'/'},
  manifest: '/manifest.webmanifest',
  applicationName: 'روشنا',
  appleWebApp: {capable: true, statusBarStyle: 'default', title: 'روشنا'},
  icons: {icon: '/icons/icon.svg', apple: '/icons/apple-touch-icon.png'},
};

export const viewport: Viewport = {width:'device-width',initialScale:1,themeColor:'#070d18'};

export default function RootLayout({children}:{children: React.ReactNode}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
