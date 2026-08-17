'use client';

import { use, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Locale } from '@/lib/i18n';
import { AffiliateSidebar } from '@/components/affiliate/AffiliateSidebar';
import { AffiliateHeader } from '@/components/affiliate/AffiliateHeader';
import { authStore } from '@/lib/auth-store';

export default function AffiliateLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeValue } = use(params);
  const locale = localeValue as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Public pages that shouldn't render the dashboard sidebar/header or require auth token
  const isPublicAffiliatePage =
    pathname.endsWith('/portal') ||
    pathname.endsWith('/login') ||
    pathname.endsWith('/register') ||
    pathname.includes('/activate');

  useEffect(() => {
    if (isPublicAffiliatePage) {
      setIsAuthChecked(true);
      return;
    }

    const user = authStore.getUser();
    const token = authStore.getToken() || (typeof window !== 'undefined' ? localStorage.getItem('ocv_access_token') : null);

    if (!user || !token) {
      router.replace(`/${locale}/affiliate/login`);
    } else {
      setIsAuthChecked(true);
    }
  }, [isPublicAffiliatePage, pathname, locale, router]);

  if (isPublicAffiliatePage) {
    return <>{children}</>;
  }

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white  text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 font-mono">Đang xác thực quyền truy cập đối tác...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900  relative">
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block shrink-0">
        <AffiliateSidebar locale={locale} />
      </div>

      {/* Mobile Drawer Overlay Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <AffiliateSidebar locale={locale} onCloseMobileSidebar={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AffiliateHeader locale={locale} onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
