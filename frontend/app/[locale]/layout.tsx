import { Suspense } from 'react';
import type { Metadata } from 'next';
import '../globals.css';
import { Locale, getDictionary } from '../../lib/i18n';
import { DevHmrAutoReload } from '@/components/common/DevHmrAutoReload';
import { GlobalSpinLoader } from '@/components/common/GlobalSpinLoader';
import { GlobalFloatingWidgets } from '@/components/common/GlobalFloatingWidgets';
import { RouteTitleWatcher } from '@/components/common/RouteTitleWatcher';
import { GlobalToastProvider } from '@/components/common/GlobalToastProvider';
import { GoogleTranslateProvider } from '@/components/common/GoogleTranslateProvider';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'OrderChinaViet - Hệ Thống Đặt Hàng & Vận Chuyển Trung Việt Uy Tín',
    template: '%s | OrderChinaViet',
  },
  description: 'Dịch vụ đặt hàng Taobao, 1688, Tmall trọn gói, vận chuyển hàng Trung Quốc về Việt Nam chính ngạch, đổi tiền nạp ví Alipay / WeChat Pay uy tín số 1.',
  keywords: [
    'nhập hàng trung quốc',
    'đặt hàng 1688',
    'order taobao',
    'order tmall',
    'vận chuyển trung việt',
    'mua hộ hàng trung quốc',
    'thanh toán hộ alipay',
    'tiếp thị liên kết logistics',
    'orderchinaviet',
  ],
  authors: [{ name: 'OrderChinaViet Logistics' }],
  creator: 'OrderChinaViet',
  publisher: 'OrderChinaViet',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'OrderChinaViet - Hệ Thống Đặt Hàng & Vận Chuyển Trung Việt Uy Tín',
    description: 'Dịch vụ đặt hàng Taobao, 1688, Tmall trọn gói, vận chuyển hàng Trung Quốc về Việt Nam chính ngạch, cước siêu rẻ từ 18.000 ₫/kg.',
    url: BASE_URL,
    siteName: 'OrderChinaViet Logistics',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OrderChinaViet - Hệ Thống Đặt Hàng & Vận Chuyển Trung Việt Uy Tín',
    description: 'Dịch vụ mua hộ 1688, Taobao, Tmall và vận chuyển Trung - Việt siêu tốc 3-5 ngày.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <html lang={locale}>
      <body className="bg-white text-slate-900 min-h-screen antialiased">
        <DevHmrAutoReload />
        <GlobalToastProvider />
        <Suspense fallback={null}>
          <RouteTitleWatcher />
          <GlobalSpinLoader />
        </Suspense>
        {children}
        <GlobalFloatingWidgets />
        <GoogleTranslateProvider />
      </body>
    </html>
  );
}
