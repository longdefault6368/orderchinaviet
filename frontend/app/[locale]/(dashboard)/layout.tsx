'use client';

import { use, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getDictionary, Locale } from '@/lib/i18n';
import { Sidebar } from '@/components/common/Sidebar';
import { CustomerSidebar } from '@/components/customer/CustomerSidebar';
import { CustomerHeader } from '@/components/customer/CustomerHeader';
import { authStore, UserSession } from '@/lib/auth-store';

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeValue } = use(params);
  const locale = localeValue as Locale;
  const router = useRouter();
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const currentUser = authStore.getUser();
    if (!currentUser || !authStore.isLoggedIn()) {
      router.push(`/${locale}/login`);
      return;
    }
    setUser(currentUser);
    setMounted(true);
  }, [locale, router]);

  // Determine title dynamically from pathname
  const getPageTitle = () => {
    if (pathname.includes('/transport-requests')) return 'Gửi Yêu Cầu Vận Chuyển';
    if (pathname.includes('/customers')) return 'Quản Lý Khách Hàng';
    if (pathname.includes('/packages/scan')) return 'Quét Mã Kho Quảng Châu & TP.HCM';
    if (pathname.includes('/packages')) return 'Kiện Hàng & Mã Vận Đơn';
    if (pathname.includes('/shipments')) return 'Đang Vận Chuyển';
    if (pathname.includes('/waybills')) return 'Mã Vận Đơn';
    if (pathname.includes('/orders')) return 'Quản Lý Đơn Hàng';
    if (pathname.includes('/consignments')) return 'Đơn Ký Gửi';
    if (pathname.includes('/deliveries')) return 'Yêu Cầu Giao Hàng Tại Việt Nam';
    if (pathname.includes('/transactions')) return 'Sổ Sách Giao Dịch Ví Dư';
    if (pathname.includes('/disputes')) return 'Hỗ Trợ & Khiếu Nại';
    if (pathname.includes('/withdrawals')) return 'Yêu Cầu Rút Tiền';
    if (pathname.includes('/finance')) return 'Quản Lý Tài Chính & Ví';
    if (pathname.includes('/rates')) return 'Bảng Giá Cước';
    if (pathname.includes('/reports')) return 'Báo Cáo Thống Kê';
    if (pathname.includes('/settings')) return 'Cấu Hình Hệ Thống';
    if (pathname.includes('/guides')) return 'Hướng Dẫn Hệ Thống';
    return 'Bảng Chung';
  };

  // Render a clean, single loading shell during initial mount frame to prevent UI double-rendering
  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-slate-100 text-slate-800  ">
        <div className="hidden lg:block w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 p-5 space-y-4">
          <div className="h-8 bg-slate-200 rounded-xl animate-pulse w-3/4" />
          <div className="space-y-2 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
            <div className="h-5 bg-slate-200 rounded w-48 animate-pulse" />
            <div className="h-8 bg-slate-200 rounded-full w-24 animate-pulse" />
          </div>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    );
  }

  // Check if role is CUSTOMER
  const isCustomerRole = user?.roleCode === 'CUSTOMER';

  if (isCustomerRole) {
    return (
      <div className="flex min-h-screen bg-slate-100 text-slate-800  relative">
        {/* Desktop Sticky Sidebar */}
        <div className="hidden lg:block shrink-0">
          <CustomerSidebar locale={locale} dict={dict} />
        </div>

        {/* Mobile Drawer Overlay Sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-10 w-64 h-full shadow-2xl animate-in slide-in-from-left duration-200">
              <CustomerSidebar locale={locale} dict={dict} onCloseMobileSidebar={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <CustomerHeader
            locale={locale}
            dict={dict}
            pageTitle={getPageTitle()}
            onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          />
          <main className="flex-1 overflow-visible p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    );
  }

  // Admin / Staff Dashboard Layout (Single, crisp, clean layout)
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800  relative">
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar locale={locale} dict={dict} />
      </div>

      {/* Mobile Drawer Overlay Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar locale={locale} dict={dict} onCloseMobileSidebar={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <CustomerHeader
          locale={locale}
          dict={dict}
          pageTitle={getPageTitle()}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
